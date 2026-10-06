import { useCallback, useEffect, useState } from "react"
import type { FordelingState, FordelingViewState, PostId, ViewId } from "@/types/fordeling"
import {
  beregnBufferMål,
  erMålNådd,
  fordelLikt,
  frigjørPost,
  lagForslag,
  omfordelEtterFasteUtgifter,
  tilpassTilNyLønn,
} from "@/lib/beregninger"
import { clearState, getDefaultState, loadState, saveState } from "@/lib/fordeling-storage"
import {
  lagreMålFraFordeling,
  lesBekreftedeMål,
  type DeltMålId,
} from "@/lib/sparemaal-storage"
import { lesUtgifterTotal } from "@/lib/utgifter-storage"

const DELTE_MÅL: DeltMålId[] = ["buffer", "ferie", "storeLivshendelser"]

/** Mål bekreftet i «Definer taket» går foran målene som er lagret i Fordeling. */
function medBekreftedeMål(state: FordelingState): FordelingState {
  const bekreftede = lesBekreftedeMål()
  const poster = structuredClone(state.poster)
  for (const id of DELTE_MÅL) {
    if (id in bekreftede) poster[id].mål = bekreftede[id] ?? null
  }
  return { ...state, poster }
}

function createInitialViewState(): FordelingViewState {
  const saved = loadState()
  if (saved && saved.lønn) {
    return { ...medBekreftedeMål(saved), view: "dashboard", expandedPost: null }
  }
  return { ...medBekreftedeMål(getDefaultState()), view: "inngang", expandedPost: null }
}

export function useFordelingState() {
  const [state, setState] = useState<FordelingViewState>(createInitialViewState)

  // Lagre til localStorage ved endringer i persistert state
  useEffect(() => {
    if (state.lønn) {
      saveState({
        lønn: state.lønn,
        poster: state.poster,
        interaksjon: state.interaksjon,
        fasteTrekkFullført: state.fasteTrekkFullført ?? null,
      })
    }
  }, [state.lønn, state.poster, state.interaksjon, state.fasteTrekkFullført])

  /** Første gang: lag forslag ut fra lønn (og faste utgifter fra Utgifter hvis valgt). */
  const start = useCallback((lønn: number, fasteFraUtgifter: number | null) => {
    setState((prev) => {
      const defaults = getDefaultState()
      const poster = structuredClone(prev.poster)
      if (!poster.buffer.mål) poster.buffer.mål = beregnBufferMål(lønn)
      lagForslag(lønn, poster, fasteFraUtgifter)
      return {
        ...prev,
        lønn,
        poster,
        interaksjon: { ...defaults.interaksjon, fasteUtgifter: fasteFraUtgifter != null },
        view: "dashboard",
        expandedPost: null,
      }
    })
  }, [])

  /** Ny lønn fra oversikten: beholder brukerens valg så langt det går. */
  const endreLønn = useCallback((nyLønn: number) => {
    const bufferBekreftet = "buffer" in lesBekreftedeMål()
    setState((prev) => {
      if (!prev.lønn || nyLønn === prev.lønn) return prev
      const poster = structuredClone(prev.poster)
      // Buffer-målet følger lønna så lenge det er vårt forslag (ikke valgt av brukeren)
      if (!bufferBekreftet && poster.buffer.mål === beregnBufferMål(prev.lønn)) {
        poster.buffer.mål = beregnBufferMål(nyLønn)
      }
      tilpassTilNyLønn(nyLønn, poster, prev.interaksjon.fasteUtgifter)
      return { ...prev, lønn: nyLønn, poster }
    })
  }, [])

  const endrePost = useCallback((postId: PostId, nyVerdi: number) => {
    setState((prev) => {
      if (!prev.lønn) return prev
      const poster = structuredClone(prev.poster)

      const gammel = poster[postId].månedlig
      const andrePoster = (Object.keys(poster) as PostId[]).filter(
        (k) => k !== postId && k !== "fasteUtgifter" && !erMålNådd(poster[k])
      )

      // Slideren kan bare ta fra andre spareposter, aldri fra faste utgifter
      // (som er reelle forpliktelser).
      const sumAndrePoster = andrePoster.reduce(
        (s, k) => s + (poster[k].månedlig ?? 0),
        0
      )
      const begrensetVerdi = Math.max(0, Math.min(nyVerdi, gammel + sumAndrePoster))

      const differanse = begrensetVerdi - gammel
      poster[postId].månedlig = begrensetVerdi

      // Fordel differansen likt på andre poster (unntatt faste utgifter)
      fordelLikt(differanse, andrePoster, poster, prev.lønn)

      return {
        ...prev,
        poster,
        interaksjon: { ...prev.interaksjon, [postId]: true },
      }
    })
  }, [])

  const endreFasteUtgifter = useCallback((nyVerdi: number) => {
    setState((prev) => {
      if (!prev.lønn) return prev
      const poster = structuredClone(prev.poster)
      omfordelEtterFasteUtgifter(nyVerdi, prev.lønn, poster)

      return {
        ...prev,
        poster,
        interaksjon: { ...prev.interaksjon, fasteUtgifter: true },
      }
    })
  }, [])

  const endreAlleredeSpart = useCallback((postId: PostId, verdi: number) => {
    setState((prev) => {
      const poster = structuredClone(prev.poster)
      poster[postId].alleredeSpart = verdi
      // Mål nådd: frigjør månedsbeløpet til de andre sparepostene
      if (prev.lønn && erMålNådd(poster[postId])) frigjørPost(postId, prev.lønn, poster)
      return { ...prev, poster }
    })
  }, [])

  const endreMål = useCallback((postId: PostId, verdi: number | null) => {
    // Målene eies av «Definer taket» — lagre der også
    if ((DELTE_MÅL as PostId[]).includes(postId)) {
      lagreMålFraFordeling(postId as DeltMålId, verdi)
    }
    setState((prev) => {
      const poster = structuredClone(prev.poster)
      poster[postId].mål = verdi
      if (prev.lønn && erMålNådd(poster[postId])) frigjørPost(postId, prev.lønn, poster)
      return { ...prev, poster }
    })
  }, [])

  /** Tilbake til forslaget. Mål og «allerede spart» beholdes. */
  const tilbakestill = useCallback(() => {
    const fasteFraUtgifter = lesUtgifterTotal()
    setState((prev) => {
      if (!prev.lønn) return prev
      const defaults = getDefaultState()
      const poster = structuredClone(prev.poster)
      lagForslag(prev.lønn, poster, fasteFraUtgifter)
      return {
        ...prev,
        poster,
        interaksjon: { ...defaults.interaksjon, fasteUtgifter: fasteFraUtgifter != null },
      }
    })
  }, [])

  const fullførFasteTrekk = useCallback(() => {
    setState((prev) => ({
      ...prev,
      fasteTrekkFullført: new Date().toISOString().slice(0, 10),
    }))
  }, [])

  const toggleExpanded = useCallback((postId: PostId) => {
    setState((prev) => ({
      ...prev,
      expandedPost: prev.expandedPost === postId ? null : postId,
    }))
  }, [])

  const visView = useCallback((view: ViewId) => {
    setState((prev) => ({ ...prev, view }))
  }, [])

  const nullstill = useCallback(() => {
    clearState()
    setState({
      ...getDefaultState(),
      view: "inngang",
      expandedPost: null,
    })
  }, [])

  return {
    state,
    start,
    endreLønn,
    endrePost,
    endreFasteUtgifter,
    endreAlleredeSpart,
    endreMål,
    tilbakestill,
    fullførFasteTrekk,
    toggleExpanded,
    visView,
    nullstill,
  }
}

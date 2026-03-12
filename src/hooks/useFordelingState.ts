import { useCallback, useEffect, useState } from "react"
import type {
  FordelingViewState,
  PostId,
  ViewId,
} from "@/types/fordeling"
import {
  beregnBufferMål,
  beregnStandardfordeling,
  fordelLikt,
  omfordelEtterFasteUtgifter,
} from "@/lib/beregninger"
import { clearState, getDefaultState, loadState, saveState } from "@/lib/storage"

function createInitialViewState(): FordelingViewState {
  const saved = loadState()
  if (saved && saved.lønn) {
    return {
      ...saved,
      view: "dashboard",
      expandedPost: null,
    }
  }
  return {
    ...getDefaultState(),
    view: "inngang",
    expandedPost: null,
  }
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
      })
    }
  }, [state.lønn, state.poster, state.interaksjon])

  const start = useCallback((lønn: number) => {
    const fordeling = beregnStandardfordeling(lønn)
    const defaults = getDefaultState()

    const poster = { ...defaults.poster }
    for (const [key, beløp] of Object.entries(fordeling)) {
      poster[key as PostId].månedlig = beløp
    }

    // Buffer-mål settes automatisk til 1,5× lønn
    poster.buffer.mål = beregnBufferMål(lønn)

    setState({
      lønn,
      poster,
      interaksjon: defaults.interaksjon,
      view: "dashboard",
      expandedPost: null,
    })
  }, [])

  const endrePost = useCallback(
    (postId: PostId, nyVerdi: number) => {
      setState((prev) => {
        if (!prev.lønn) return prev
        const poster = structuredClone(prev.poster)

        const gammel = poster[postId].månedlig
        const differanse = nyVerdi - gammel
        poster[postId].månedlig = nyVerdi

        // Fordel differansen likt på andre poster (unntatt fasteUtgifter)
        const andrePoster = (Object.keys(poster) as PostId[]).filter(
          (k) => k !== postId && k !== "fasteUtgifter"
        )
        fordelLikt(differanse, andrePoster, poster, prev.lønn)

        return {
          ...prev,
          poster,
          interaksjon: { ...prev.interaksjon, [postId]: true },
        }
      })
    },
    []
  )

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

  const endreAlleredeSpart = useCallback(
    (postId: PostId, verdi: number) => {
      setState((prev) => {
        const poster = structuredClone(prev.poster)
        poster[postId].alleredeSpart = verdi

        // Hvis målet er nådd, sett månedlig til 0
        const mål = poster[postId].mål ?? 0
        if (mål > 0 && verdi >= mål) {
          poster[postId].månedlig = 0
        }

        return { ...prev, poster }
      })
    },
    []
  )

  const endreMål = useCallback((postId: PostId, verdi: number | null) => {
    setState((prev) => {
      const poster = structuredClone(prev.poster)
      poster[postId].mål = verdi

      // Hvis målet er nådd, sett månedlig til 0
      const alleredeSpart = poster[postId].alleredeSpart ?? 0
      if (verdi && verdi > 0 && alleredeSpart >= verdi) {
        poster[postId].månedlig = 0
      }

      return { ...prev, poster }
    })
  }, [])

  const tilbakestill = useCallback(() => {
    setState((prev) => {
      if (!prev.lønn) return prev
      const fordeling = beregnStandardfordeling(prev.lønn)
      const defaults = getDefaultState()
      const poster = { ...defaults.poster }
      for (const [key, beløp] of Object.entries(fordeling)) {
        poster[key as PostId].månedlig = beløp
      }
      poster.buffer.mål = beregnBufferMål(prev.lønn)

      return {
        ...prev,
        poster,
        interaksjon: defaults.interaksjon,
      }
    })
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
    endrePost,
    endreFasteUtgifter,
    endreAlleredeSpart,
    endreMål,
    tilbakestill,
    toggleExpanded,
    visView,
    nullstill,
  }
}

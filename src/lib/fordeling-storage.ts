import type { FordelingState, PostId } from "@/types/fordeling"
import {
  NØKLER,
  erObjekt,
  fjern,
  ikkeNegativtTall,
  lesJson,
  positivtTallEllerNull,
  skrivJson,
} from "@/lib/lagring"

const POST_IDER: PostId[] = [
  "fasteUtgifter",
  "buffer",
  "guiltFree",
  "ferie",
  "storeLivshendelser",
  "pensjon",
]

const DEFAULT_STATE: FordelingState = {
  lønn: null,
  poster: {
    fasteUtgifter: { månedlig: 0 },
    buffer: { månedlig: 0, mål: null, alleredeSpart: 0 },
    guiltFree: { månedlig: 0 },
    ferie: { månedlig: 0, mål: 15000, alleredeSpart: 0 },
    storeLivshendelser: { månedlig: 0, mål: null, alleredeSpart: 0 },
    pensjon: { månedlig: 0 },
  },
  interaksjon: {
    fasteUtgifter: false,
    buffer: false,
    guiltFree: false,
    ferie: false,
    storeLivshendelser: false,
    pensjon: false,
  },
  fasteTrekkFullført: null,
}

/**
 * Tolker lagret fordeling. Ukjente felt ignoreres, manglende felt får
 * standardverdier, og tall med feil form erstattes — slik at gammel eller
 * korrupt data aldri kan krasje verktøyet.
 */
export function tolkFordeling(rå: unknown): FordelingState | null {
  if (!erObjekt(rå)) return null
  const lønn = positivtTallEllerNull(rå.lønn)
  if (lønn == null || !erObjekt(rå.poster)) return null

  const state = structuredClone(DEFAULT_STATE)
  state.lønn = lønn

  for (const id of POST_IDER) {
    const lagret = rå.poster[id]
    if (!erObjekt(lagret)) continue
    const post = state.poster[id]
    post.månedlig = ikkeNegativtTall(lagret.månedlig, 0)
    if ("mål" in post) {
      post.mål = "mål" in lagret ? positivtTallEllerNull(lagret.mål) : post.mål
    }
    if ("alleredeSpart" in post) {
      post.alleredeSpart = ikkeNegativtTall(lagret.alleredeSpart, 0)
    }
  }

  if (erObjekt(rå.interaksjon)) {
    for (const id of POST_IDER) {
      state.interaksjon[id] = rå.interaksjon[id] === true
    }
  }

  if (typeof rå.fasteTrekkFullført === "string") {
    state.fasteTrekkFullført = rå.fasteTrekkFullført
  }

  return state
}

export function loadState(): FordelingState | null {
  return tolkFordeling(lesJson(NØKLER.fordeling))
}

export function saveState(state: FordelingState): void {
  skrivJson(NØKLER.fordeling, state)
}

export function clearState(): void {
  fjern(NØKLER.fordeling)
}

export function getDefaultState(): FordelingState {
  return structuredClone(DEFAULT_STATE)
}

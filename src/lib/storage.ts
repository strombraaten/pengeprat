import type { FordelingState, PostId } from "@/types/fordeling"

const STORAGE_KEY = "pengeprat_v2"

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
}

export function loadState(): FordelingState | null {
  try {
    const lagret = localStorage.getItem(STORAGE_KEY)
    if (!lagret) return null

    const parsed = JSON.parse(lagret) as FordelingState
    if (!parsed || typeof parsed.lønn !== "number" || !parsed.poster)
      return null

    // Merge inn lagret data med defaults for å ikke miste nye felt
    const state = structuredClone(DEFAULT_STATE)
    state.lønn = parsed.lønn
    for (const key of Object.keys(state.poster) as PostId[]) {
      if (parsed.poster[key]) {
        Object.assign(state.poster[key], parsed.poster[key])
      }
    }
    if (parsed.interaksjon) {
      Object.assign(state.interaksjon, parsed.interaksjon)
    }
    return state
  } catch {
    return null
  }
}

export function saveState(state: FordelingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage utilgjengelig – fortsett uten lagring
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function getDefaultState(): FordelingState {
  return structuredClone(DEFAULT_STATE)
}

import type { SparemaalState } from "@/types/sparemaal"

const STORAGE_KEY = "pengeprat_sparemaal_v1"
const FORDELING_KEY = "pengeprat_v2"

// Fallback defaults when fordeling-data is unavailable
const BUFFER_FALLBACK = 82_500
const FRAMTIDSFRI_FALLBACK = 210_000
const FERIE_DEFAULT = 15_000

/** Read lønn and fasteUtgifter from the fordeling state to compute smarter defaults. */
function readFordelingDefaults(): { buffer: number; framtidsfri: number } {
  try {
    const raw = localStorage.getItem(FORDELING_KEY)
    if (!raw) return { buffer: BUFFER_FALLBACK, framtidsfri: FRAMTIDSFRI_FALLBACK }

    const parsed = JSON.parse(raw)
    const lønn: number | null = parsed?.lønn ?? null
    const fasteUtgifter: number = parsed?.poster?.fasteUtgifter?.månedlig ?? 0

    return {
      buffer: lønn ? Math.round(lønn * 1.5) : BUFFER_FALLBACK,
      framtidsfri: fasteUtgifter > 0 ? Math.round(fasteUtgifter * 6) : FRAMTIDSFRI_FALLBACK,
    }
  } catch {
    return { buffer: BUFFER_FALLBACK, framtidsfri: FRAMTIDSFRI_FALLBACK }
  }
}

function buildDefaultState(): SparemaalState {
  const { buffer, framtidsfri } = readFordelingDefaults()
  return {
    buffer: { mål: buffer, bekreftet: false },
    ferie: { mål: FERIE_DEFAULT, bekreftet: false },
    framtidsfri: { mål: framtidsfri, bekreftet: false },
    storeLivshendelser: { type: "Bil", mål: null, bekreftet: false },
    egne: [],
  }
}

export function loadSparemaalState(): SparemaalState {
  const defaults = buildDefaultState()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults

    const parsed = JSON.parse(raw) as Partial<SparemaalState>
    if (!parsed || typeof parsed !== "object") return defaults

    // Merge saved data over defaults — new fields in future versions get default values
    const state = structuredClone(defaults)

    if (parsed.buffer && typeof parsed.buffer === "object") {
      Object.assign(state.buffer, parsed.buffer)
    }
    if (parsed.ferie && typeof parsed.ferie === "object") {
      Object.assign(state.ferie, parsed.ferie)
    }
    if (parsed.framtidsfri && typeof parsed.framtidsfri === "object") {
      Object.assign(state.framtidsfri, parsed.framtidsfri)
    }
    if (parsed.storeLivshendelser && typeof parsed.storeLivshendelser === "object") {
      Object.assign(state.storeLivshendelser, parsed.storeLivshendelser)
    }
    if (Array.isArray(parsed.egne)) {
      state.egne = parsed.egne
    }

    return state
  } catch {
    return defaults
  }
}

export function saveSparemaalState(state: SparemaalState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable — continue without saving
  }
}

export function clearSparemaalState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

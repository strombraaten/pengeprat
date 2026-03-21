import type { UventetSumKategori, UventetSumState } from "@/types/uventet-sum"

const STORAGE_KEY = "pengeprat_uventet_sum"

// Colors match the shared categories from src/lib/kategorier.ts so the visual
// language stays consistent across the app. The two extra colors cover
// user-added categories that don't have a counterpart in Fordeling.
const FARGER = [
  "oklch(0.62 0.15 185)", // buffer  — teal
  "oklch(0.65 0.14 70)",  // guiltFree — amber
  "oklch(0.63 0.15 30)",  // ferie — orange
  "oklch(0.53 0.19 295)", // storeLivshendelser — purple
  "oklch(0.62 0.15 140)", // pensjon — green
  "oklch(0.58 0.16 250)", // extra — blue (matches fasteUtgifter in Fordeling)
]

export const DEFAULT_KATEGORIER: UventetSumKategori[] = [
  { id: "buffer",             navn: "Buffer",              prosent: 25, locked: false, farge: FARGER[0] },
  { id: "guiltFree",          navn: "Guilt-free spending", prosent: 20, locked: false, farge: FARGER[1] },
  { id: "ferie",              navn: "Ferie",               prosent: 20, locked: false, farge: FARGER[2] },
  { id: "storeLivshendelser", navn: "Store livshendelser", prosent: 20, locked: false, farge: FARGER[3] },
  { id: "pensjon",            navn: "Pensjon",             prosent: 15, locked: false, farge: FARGER[4] },
]

export function nyttFargeFraPaletten(antallEksisterende: number): string {
  return FARGER[antallEksisterende % FARGER.length]
}

export function klonaKategorier(): UventetSumKategori[] {
  return DEFAULT_KATEGORIER.map((k) => ({ ...k }))
}

export function loadUventetSumState(): UventetSumState {
  try {
    const lagret = localStorage.getItem(STORAGE_KEY)
    if (lagret) {
      const data = JSON.parse(lagret) as UventetSumState
      // Migration: ensure all saved categories have the locked field
      if (data.kategorier) {
        data.kategorier = data.kategorier.map((k) => ({ locked: false, ...k }))
      }
      return data
    }
  } catch {
    // Corrupt storage — fall through to defaults
  }
  return { beløp: 0, kategorier: klonaKategorier() }
}

export function saveUventetSumState(state: UventetSumState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function clearUventetSumState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

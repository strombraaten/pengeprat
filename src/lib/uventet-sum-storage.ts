import type { UventetSumKategori, UventetSumState } from "@/types/uventet-sum"

const STORAGE_KEY = "pengeprat_uventet_sum"

// Colors match src/lib/kategorier.ts and SparemaalApp.tsx (FARGE constant)
// for visual consistency across the app.
const FARGER = [
  "oklch(0.62 0.15 185)", // buffer             — teal
  "oklch(0.65 0.14 70)",  // guiltFree          — amber
  "oklch(0.63 0.15 30)",  // ferie              — orange
  "oklch(0.53 0.19 295)", // storeLivshendelser — purple
  "oklch(0.62 0.15 140)", // pensjon            — green
  "oklch(0.61 0.19 278)", // framtidsfri        — violet
  "oklch(0.58 0.16 250)", // extra              — blue
]

export const DEFAULT_KATEGORIER: UventetSumKategori[] = [
  { id: "buffer",             navn: "Buffer",              kr: 0, farge: FARGER[0] },
  { id: "guiltFree",          navn: "Guilt-free spending", kr: 0, farge: FARGER[1] },
  { id: "ferie",              navn: "Ferie",               kr: 0, farge: FARGER[2] },
  { id: "storeLivshendelser", navn: "Store livshendelser", kr: 0, farge: FARGER[3] },
  { id: "framtidsfri",        navn: "Framtidsfri",         kr: 0, farge: FARGER[5] },
  { id: "pensjon",            navn: "Pensjon",             kr: 0, farge: FARGER[4] },
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
      // Migration: old format used prosent+locked instead of kr — reset to defaults
      if (data.kategorier?.[0] && "prosent" in (data.kategorier[0] as Record<string, unknown>)) {
        return { beløp: 0, kategorier: klonaKategorier() }
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

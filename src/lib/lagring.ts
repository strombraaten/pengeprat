// Felles, trygg tilgang til localStorage.
//
// All brukerdata i Pengeprat ligger KUN i nettleseren. Derfor må lagring aldri
// kunne krasje appen (privat modus, full kvote, blokkerte cookies) og aldri
// kunne laste inn data med feil form. Alle verktøy går via denne modulen.
//
// Nøklene under er historiske og må IKKE endres — da mister brukerne dataene
// sine. Se docs/arkitektur.md#lagring.

export const NØKLER = {
  fordeling: "pengeprat_v2",
  utgifter: "pengeprat-utgifter-state",
  sparemaal: "pengeprat_sparemaal_v1",
  uventetSum: "pengeprat_uventet_sum",
} as const

export type Nøkkel = (typeof NØKLER)[keyof typeof NØKLER]

/** Leser og parser JSON. Returnerer null ved manglende, korrupt eller utilgjengelig lagring. */
export function lesJson(nøkkel: string): unknown {
  try {
    const rå = localStorage.getItem(nøkkel)
    if (rå == null) return null
    return JSON.parse(rå)
  } catch {
    return null
  }
}

/** Skriver JSON. Returnerer false hvis lagring ikke er tilgjengelig. */
export function skrivJson(nøkkel: string, verdi: unknown): boolean {
  try {
    localStorage.setItem(nøkkel, JSON.stringify(verdi))
    return true
  } catch {
    return false
  }
}

export function fjern(nøkkel: string): void {
  try {
    localStorage.removeItem(nøkkel)
  } catch {
    // Lagring utilgjengelig — ingenting å fjerne
  }
}

// ─── Små valideringshjelpere for innlasting ────────────────────────────────

export function erObjekt(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

/** Endelig, ikke-negativt tall — ellers fallback. */
export function ikkeNegativtTall(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback
}

/** Positivt tall eller null (brukes for valgfrie mål). */
export function positivtTallEllerNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null
}

export function tekst(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback
}

// Sikkerhetskopi av alle data i Pengeprat.
//
// Alt ligger bare i nettleseren. Tømmer brukeren nettleserdata eller bytter
// enhet, er planen borte. En sikkerhetskopi er en vanlig JSON-fil brukeren
// laster ned selv — den sendes aldri noe sted.

import { NØKLER, erObjekt, lesJson, skrivJson } from "@/lib/lagring"
import { tolkFordeling } from "@/lib/fordeling-storage"
import { tolkSparemaal } from "@/lib/sparemaal-storage"
import { tolkUtgifter } from "@/lib/utgifter-storage"
import { tolkUventetSum } from "@/lib/uventet-sum-storage"

export const FORMAT = "pengeprat-sikkerhetskopi"
export const VERSJON = 1

type Verktøy = keyof typeof NØKLER

export interface Sikkerhetskopi {
  format: typeof FORMAT
  versjon: number
  laget: string
  data: Partial<Record<Verktøy, unknown>>
}

export function lagSikkerhetskopi(nå: Date = new Date()): Sikkerhetskopi {
  const data: Partial<Record<Verktøy, unknown>> = {}
  for (const [verktøy, nøkkel] of Object.entries(NØKLER) as [Verktøy, string][]) {
    const verdi = lesJson(nøkkel)
    if (verdi != null) data[verktøy] = verdi
  }
  return { format: FORMAT, versjon: VERSJON, laget: nå.toISOString(), data }
}

export type GjenopprettResultat =
  | { ok: true; verktøy: Verktøy[] }
  | { ok: false; feil: string }

/**
 * Leser en sikkerhetskopi og skriver dataene tilbake. Hvert verktøys data
 * kjøres gjennom samme tolkning som ved vanlig innlasting, så en ødelagt
 * eller manipulert fil aldri kan legge inn data med feil form.
 */
export function gjenopprett(tekst: string): GjenopprettResultat {
  let rå: unknown
  try {
    rå = JSON.parse(tekst)
  } catch {
    return { ok: false, feil: "Filen er ikke en gyldig sikkerhetskopi (ikke JSON)." }
  }
  if (!erObjekt(rå) || rå.format !== FORMAT || !erObjekt(rå.data)) {
    return { ok: false, feil: "Filen er ikke en sikkerhetskopi fra Pengeprat." }
  }
  if (typeof rå.versjon !== "number" || rå.versjon > VERSJON) {
    return { ok: false, feil: "Sikkerhetskopien er laget av en nyere versjon av Pengeprat." }
  }

  const data = rå.data
  const tolket: Partial<Record<Verktøy, unknown>> = {}
  if (data.fordeling != null) {
    const f = tolkFordeling(data.fordeling)
    if (f) tolket.fordeling = f
  }
  if (data.utgifter != null) tolket.utgifter = tolkUtgifter(data.utgifter)
  if (data.sparemaal != null) tolket.sparemaal = tolkSparemaal(data.sparemaal)
  if (data.uventetSum != null) tolket.uventetSum = tolkUventetSum(data.uventetSum)

  const verktøy = Object.keys(tolket) as Verktøy[]
  if (verktøy.length === 0) {
    return { ok: false, feil: "Sikkerhetskopien inneholder ingen data." }
  }
  for (const v of verktøy) {
    if (!skrivJson(NØKLER[v], tolket[v])) {
      return { ok: false, feil: "Nettleseren lar oss ikke lagre data (privat modus?)." }
    }
  }
  return { ok: true, verktøy }
}

export function filnavn(nå: Date = new Date()): string {
  return `pengeprat-${nå.toISOString().slice(0, 10)}.json`
}

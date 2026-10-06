import type { UventetSumKategori, UventetSumState } from "@/types/uventet-sum"
import {
  NØKLER,
  erObjekt,
  fjern,
  ikkeNegativtTall,
  lesJson,
  skrivJson,
  tekst,
} from "@/lib/lagring"
import { OMRAADER, ekstraFarge, type OmraadeId } from "@/lib/omraader"

// Standardkategoriene følger spareområdene (unntatt faste utgifter)
const STANDARD_IDER: OmraadeId[] = [
  "buffer",
  "guiltFree",
  "ferie",
  "storeLivshendelser",
  "framtidsfri",
  "pensjon",
]

export const DEFAULT_KATEGORIER: UventetSumKategori[] = STANDARD_IDER.map((id) => ({
  id,
  navn: OMRAADER[id].navn,
  kr: 0,
  farge: OMRAADER[id].farge,
}))

export function nyttFargeFraPaletten(antallEksisterende: number): string {
  return ekstraFarge(antallEksisterende)
}

export function klonaKategorier(): UventetSumKategori[] {
  return DEFAULT_KATEGORIER.map((k) => ({ ...k }))
}

function standardState(): UventetSumState {
  return { beløp: 0, kategorier: klonaKategorier() }
}

export function tolkUventetSum(rå: unknown): UventetSumState {
  if (!erObjekt(rå) || !Array.isArray(rå.kategorier)) return standardState()

  // Gammelt format brukte prosent+locked i stedet for kr — start på nytt
  if (rå.kategorier.some((k) => erObjekt(k) && "prosent" in k)) return standardState()

  const beløp = ikkeNegativtTall(rå.beløp, 0)
  const kategorier: UventetSumKategori[] = rå.kategorier
    .filter(erObjekt)
    .filter((k) => typeof k.id === "string")
    .map((k, i) => ({
      id: k.id as string,
      navn: tekst(k.navn, ""),
      kr: ikkeNegativtTall(k.kr, 0),
      farge: tekst(k.farge, ekstraFarge(i)),
    }))

  if (kategorier.length === 0) return standardState()

  // Summen kan aldri overstige beløpet — nullstill fordelingen hvis den gjør det
  const sum = kategorier.reduce((s, k) => s + k.kr, 0)
  if (sum > beløp) return { beløp, kategorier: kategorier.map((k) => ({ ...k, kr: 0 })) }

  return { beløp, kategorier }
}

export function loadUventetSumState(): UventetSumState {
  return tolkUventetSum(lesJson(NØKLER.uventetSum))
}

export function saveUventetSumState(state: UventetSumState): void {
  skrivJson(NØKLER.uventetSum, state)
}

export function clearUventetSumState(): void {
  fjern(NØKLER.uventetSum)
}

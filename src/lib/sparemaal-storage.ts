import type {
  EgetMaal,
  LivehendelsesType,
  SparemaalEntry,
  SparemaalState,
} from "@/types/sparemaal"
import { beregnBufferMål, beregnFramtidsfriMål, FERIE_MÅL } from "@/lib/beregninger"
import { loadState as lastFordeling } from "@/lib/fordeling-storage"
import {
  NØKLER,
  erObjekt,
  fjern,
  lesJson,
  positivtTallEllerNull,
  skrivJson,
  tekst,
} from "@/lib/lagring"
import { ekstraFarge } from "@/lib/omraader"

// «Definer taket» eier sparemålene. Fordeling leser og skriver målene herfra,
// slik at brukeren bare har ett tall per mål. Se docs/produkt.md#mål.

// Brukes når vi ikke vet noe om brukerens lønn eller utgifter
export const BUFFER_FALLBACK = 82_500
export const FRAMTIDSFRI_FALLBACK = 210_000

/** Mål som deles mellom Fordeling og Definer taket. */
export type DeltMålId = "buffer" | "ferie" | "storeLivshendelser"

const LIVSHENDELSE_TYPER: LivehendelsesType[] = ["Bil", "Bryllup", "Egenkapital", "Annet"]

/**
 * Forslag til mål regnet ut fra Fordeling (lønn og faste utgifter).
 * Brukes som utgangspunkt og for «Tilbakestill til forslag».
 */
export function beregnForslag(): { buffer: number; framtidsfri: number } {
  const fordeling = lastFordeling()
  const lønn = fordeling?.lønn ?? null
  const faste = fordeling?.poster.fasteUtgifter.månedlig ?? 0
  return {
    buffer: lønn ? beregnBufferMål(lønn) : BUFFER_FALLBACK,
    framtidsfri: faste > 0 ? beregnFramtidsfriMål(faste) : FRAMTIDSFRI_FALLBACK,
  }
}

function standardState(): SparemaalState {
  const forslag = beregnForslag()
  // Har brukeren satt mål i Fordeling før, starter vi fra dem
  const fordeling = lastFordeling()
  const fraFordeling = (id: DeltMålId) => fordeling?.poster[id].mål ?? null
  return {
    buffer: { mål: fraFordeling("buffer") ?? forslag.buffer, bekreftet: false },
    ferie: { mål: fraFordeling("ferie") ?? FERIE_MÅL, bekreftet: false },
    framtidsfri: { mål: forslag.framtidsfri, bekreftet: false },
    storeLivshendelser: {
      type: "Bil",
      mål: fraFordeling("storeLivshendelser"),
      bekreftet: false,
    },
    egne: [],
  }
}

function tolkEntry(rå: unknown, standard: SparemaalEntry): SparemaalEntry {
  if (!erObjekt(rå)) return standard
  return {
    mål: "mål" in rå ? positivtTallEllerNull(rå.mål) : standard.mål,
    bekreftet: rå.bekreftet === true,
  }
}

function tolkEget(rå: unknown, indeks: number): EgetMaal | null {
  if (!erObjekt(rå) || typeof rå.id !== "string") return null
  return {
    id: rå.id,
    navn: tekst(rå.navn, ""),
    ...(typeof rå.beskrivelse === "string" ? { beskrivelse: rå.beskrivelse } : {}),
    mål: positivtTallEllerNull(rå.mål),
    farge: tekst(rå.farge, ekstraFarge(indeks)),
    bekreftet: rå.bekreftet === true,
  }
}

export function tolkSparemaal(rå: unknown): SparemaalState {
  const standard = standardState()
  if (!erObjekt(rå)) return standard

  const livs = erObjekt(rå.storeLivshendelser) ? rå.storeLivshendelser : {}
  const type = LIVSHENDELSE_TYPER.includes(livs.type as LivehendelsesType)
    ? (livs.type as LivehendelsesType)
    : standard.storeLivshendelser.type

  return {
    buffer: tolkEntry(rå.buffer, standard.buffer),
    ferie: tolkEntry(rå.ferie, standard.ferie),
    framtidsfri: tolkEntry(rå.framtidsfri, standard.framtidsfri),
    storeLivshendelser: {
      ...tolkEntry(rå.storeLivshendelser, standard.storeLivshendelser),
      type,
    },
    egne: Array.isArray(rå.egne)
      ? rå.egne.map(tolkEget).filter((e): e is EgetMaal => e !== null)
      : [],
  }
}

export function loadSparemaalState(): SparemaalState {
  return tolkSparemaal(lesJson(NØKLER.sparemaal))
}

export function saveSparemaalState(state: SparemaalState): void {
  skrivJson(NØKLER.sparemaal, state)
}

export function clearSparemaalState(): void {
  fjern(NØKLER.sparemaal)
}

/** Bekreftede mål fra Definer taket. Ubekreftede mål er bare forslag og tas ikke med. */
export function lesBekreftedeMål(): Partial<Record<DeltMålId, number | null>> {
  const rå = lesJson(NØKLER.sparemaal)
  if (!erObjekt(rå)) return {}
  const state = tolkSparemaal(rå)
  const ut: Partial<Record<DeltMålId, number | null>> = {}
  for (const id of ["buffer", "ferie", "storeLivshendelser"] as const) {
    if (state[id].bekreftet) ut[id] = state[id].mål
  }
  return ut
}

/** Når brukeren endrer et mål i Fordeling, lagres det som bekreftet mål her. */
export function lagreMålFraFordeling(id: DeltMålId, mål: number | null): void {
  const state = loadSparemaalState()
  if (id === "storeLivshendelser") {
    state.storeLivshendelser = { ...state.storeLivshendelser, mål, bekreftet: true }
  } else {
    state[id] = { ...state[id], mål, bekreftet: true }
  }
  saveSparemaalState(state)
}

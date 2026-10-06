import type { ExpenseCategory, ExpenseItem, PresetKey, UtgifterState } from "@/types/utgifter"
import { DEFAULT_CATEGORIES, PRESETS } from "@/lib/utgifter-data"
import { calculateGrandTotal } from "@/lib/utgifter-utils"
import {
  NØKLER,
  erObjekt,
  ikkeNegativtTall,
  lesJson,
  skrivJson,
  tekst,
} from "@/lib/lagring"

function alleStandardposter(): string[] {
  return DEFAULT_CATEGORIES.flatMap((c) => c.items.map((i) => i.id))
}

export function standardUtgifter(): UtgifterState {
  return {
    categories: structuredClone(DEFAULT_CATEGORIES),
    expandedCategories: DEFAULT_CATEGORIES.map((c) => c.id),
    selectedPreset: null,
    endret: false,
    kjenteStandardposter: alleStandardposter(),
  }
}

function tolkPost(rå: unknown): ExpenseItem | null {
  if (!erObjekt(rå) || typeof rå.id !== "string") return null
  return {
    id: rå.id,
    label: tekst(rå.label, rå.id),
    amount: ikkeNegativtTall(rå.amount, 0),
    ...(rå.custom === true ? { custom: true } : {}),
  }
}

/**
 * Tolker lagret utgiftsdata og fletter den med kategoriene i koden.
 *
 * Kategoriene i koden endrer seg over tid (f.eks. «Diverse» i #50). Lagret
 * data skal ikke skjule nye kategorier/poster, og brukerens egne poster og
 * beløp skal aldri forsvinne. Regler:
 * - Nye standardposter legges til med 0 kr (aldri eksempelbeløp, for ikke å
 *   endre totalen brukeren har lagt inn).
 * - Standardposter brukeren har slettet, legges ikke tilbake
 *   (vi husker hvilke standardposter brukeren har sett i `kjenteStandardposter`).
 * - Poster/kategorier som ikke lenger finnes i koden, beholdes.
 */
export function tolkUtgifter(rå: unknown): UtgifterState {
  const standard = standardUtgifter()
  if (!erObjekt(rå) || !Array.isArray(rå.categories)) return standard

  const lagredeKategorier = rå.categories.filter(erObjekt)
  const lagretPostIder = lagredeKategorier.flatMap((c) =>
    Array.isArray(c.items) ? c.items.filter(erObjekt).map((i) => i.id) : []
  )
  // Eldre lagringer mangler listen — da regner vi alt som var lagret som «sett».
  const kjente = new Set<string>(
    Array.isArray(rå.kjenteStandardposter)
      ? rå.kjenteStandardposter.filter((x): x is string => typeof x === "string")
      : lagretPostIder.filter((x): x is string => typeof x === "string")
  )

  const kategorier: ExpenseCategory[] = DEFAULT_CATEGORIES.map((def) => {
    const lagret = lagredeKategorier.find((c) => c.id === def.id)
    if (!lagret) {
      // Helt ny kategori for denne brukeren
      return { ...structuredClone(def), items: def.items.map((i) => ({ ...i, amount: 0 })) }
    }
    const lagredePoster = (Array.isArray(lagret.items) ? lagret.items : [])
      .map(tolkPost)
      .filter((p): p is ExpenseItem => p !== null)

    const nyeStandardposter = def.items
      .filter((i) => !kjente.has(i.id) && !lagredePoster.some((p) => p.id === i.id))
      .map((i) => ({ ...i, amount: 0 }))

    return {
      ...def,
      items: [...lagredePoster, ...nyeStandardposter],
    }
  })

  // Kategorier som er fjernet fra koden, men har brukerdata, beholdes
  for (const lagret of lagredeKategorier) {
    if (typeof lagret.id !== "string") continue
    if (DEFAULT_CATEGORIES.some((d) => d.id === lagret.id)) continue
    const poster = (Array.isArray(lagret.items) ? lagret.items : [])
      .map(tolkPost)
      .filter((p): p is ExpenseItem => p !== null)
    if (poster.length === 0) continue
    kategorier.push({
      id: lagret.id,
      name: tekst(lagret.name, lagret.id),
      icon: "Package",
      items: poster,
    })
  }

  const ekspandert = Array.isArray(rå.expandedCategories)
    ? rå.expandedCategories.filter((x): x is string => typeof x === "string")
    : typeof rå.expandedCategory === "string"
      ? [rå.expandedCategory]
      : standard.expandedCategories

  const preset =
    typeof rå.selectedPreset === "string" && rå.selectedPreset in PRESETS
      ? (rå.selectedPreset as PresetKey)
      : null

  const state: UtgifterState = {
    categories: kategorier,
    expandedCategories: ekspandert,
    selectedPreset: preset,
    // Eldre lagringer: anse som endret hvis tallene avviker fra eksempeltallene
    endret: typeof rå.endret === "boolean" ? rå.endret : !harStandardbeløp(kategorier),
    kjenteStandardposter: alleStandardposter(),
  }
  return state
}

function harStandardbeløp(kategorier: ExpenseCategory[]): boolean {
  return calculateGrandTotal(kategorier) === calculateGrandTotal(DEFAULT_CATEGORIES)
}

export function lastUtgifter(): UtgifterState {
  return tolkUtgifter(lesJson(NØKLER.utgifter))
}

export function lagreUtgifter(state: UtgifterState): void {
  skrivJson(NØKLER.utgifter, state)
}

/**
 * Brukerens månedlige utgifter fra Utgifter-verktøyet, eller null hvis
 * brukeren ikke har lagt inn egne tall (eksempeltallene teller ikke).
 */
export function lesUtgifterTotal(): number | null {
  const rå = lesJson(NØKLER.utgifter)
  if (rå == null) return null
  const state = tolkUtgifter(rå)
  if (!state.endret) return null
  const total = calculateGrandTotal(state.categories)
  return total > 0 ? total : null
}

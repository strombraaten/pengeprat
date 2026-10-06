// Planen er summen av alle stegene i Pengeprat.
//
// Hvert verktøy lagrer sine egne data. Denne modulen leser dem og setter dem
// sammen til én plan: hva som går til hva hver måned, hvilke mål du sparer mot
// og når du er i mål. Planen brukes av «Min plan»-siden og av forslaget i
// «Uventet sum». Se docs/produkt.md#planen for flyten mellom stegene.

import type { FordelingState, PostId } from "@/types/fordeling"
import type { SparemaalState } from "@/types/sparemaal"
import { beregnMånederTilMål } from "@/lib/beregninger"
import { loadState as lastFordeling } from "@/lib/fordeling-storage"
import { NØKLER, erObjekt, lesJson } from "@/lib/lagring"
import { OMRAADER, type OmraadeId } from "@/lib/omraader"
import { loadSparemaalState } from "@/lib/sparemaal-storage"
import { lesUtgifterTotal } from "@/lib/utgifter-storage"
import { avrundTil } from "@/lib/tall"

export interface PlanTrekk {
  id: PostId
  navn: string
  farge: string
  konto: string
  månedlig: number
}

export interface PlanMål {
  id: string
  navn: string
  farge: string
  mål: number | null
  /** Bekreftet i «Definer taket» (ellers et forslag). */
  bekreftet: boolean
  /** Kjent når målet også er en post i Fordeling. */
  alleredeSpart: number | null
  månedlig: number | null
  /** Måneder til målet er nådd; Infinity hvis det ikke spares; null hvis ukjent. */
  måneder: number | null
}

export interface Plan {
  steg: {
    utgifter: boolean
    fordeling: boolean
    sparemaal: boolean
    fasteTrekk: boolean
  }
  lønn: number | null
  fasteUtgifter: number | null
  utgifterTotal: number | null
  fasteTrekkFullført: string | null
  trekk: PlanTrekk[]
  mål: PlanMål[]
}

const SPARE_POSTER: PostId[] = ["buffer", "guiltFree", "ferie", "storeLivshendelser", "pensjon"]
const MÅL_I_FORDELING = ["buffer", "ferie", "storeLivshendelser"] as const

export interface PlanGrunnlag {
  fordeling: FordelingState | null
  sparemaal: SparemaalState
  /** Har brukeren lagret noe i «Definer taket»? */
  sparemaalLagret: boolean
  utgifterTotal: number | null
}

/** Ren funksjon: bygger planen fra dataene til hvert verktøy. */
export function byggPlan({
  fordeling,
  sparemaal,
  sparemaalLagret,
  utgifterTotal,
}: PlanGrunnlag): Plan {
  const lønn = fordeling?.lønn ?? null

  const trekk: PlanTrekk[] = fordeling
    ? SPARE_POSTER.map((id) => ({
        id,
        navn: OMRAADER[id].navn,
        farge: OMRAADER[id].farge,
        konto: OMRAADER[id].konto,
        månedlig: fordeling.poster[id].månedlig,
      })).filter((t) => t.månedlig > 0)
    : []

  const målFraFordeling: PlanMål[] = MÅL_I_FORDELING.map((id) => {
    const entry = sparemaal[id]
    const post = fordeling?.poster[id]
    // Bekreftede mål fra «Definer taket» går foran
    const mål = entry.bekreftet ? entry.mål : (post?.mål ?? entry.mål)
    const alleredeSpart = post ? (post.alleredeSpart ?? 0) : null
    const månedlig = post ? post.månedlig : null
    const måneder =
      mål && månedlig != null ? beregnMånederTilMål(mål, alleredeSpart ?? 0, månedlig) : null
    const navn =
      id === "storeLivshendelser" && sparemaal.storeLivshendelser.type !== "Annet"
        ? `${OMRAADER[id].navn} (${sparemaal.storeLivshendelser.type.toLowerCase()})`
        : OMRAADER[id].navn
    return {
      id,
      navn,
      farge: OMRAADER[id].farge,
      mål,
      bekreftet: entry.bekreftet,
      alleredeSpart,
      månedlig,
      måneder,
    }
  })

  const framtidsfri: PlanMål = {
    id: "framtidsfri",
    navn: OMRAADER.framtidsfri.navn,
    farge: OMRAADER.framtidsfri.farge,
    mål: sparemaal.framtidsfri.mål,
    bekreftet: sparemaal.framtidsfri.bekreftet,
    alleredeSpart: null,
    månedlig: null,
    måneder: null,
  }

  const egne: PlanMål[] = sparemaal.egne
    .filter((e) => e.bekreftet)
    .map((e) => ({
      id: e.id,
      navn: e.navn || "Eget mål",
      farge: e.farge,
      mål: e.mål,
      bekreftet: true,
      alleredeSpart: null,
      månedlig: null,
      måneder: null,
    }))

  return {
    steg: {
      utgifter: utgifterTotal != null,
      fordeling: lønn != null,
      sparemaal:
        sparemaalLagret &&
        ([...MÅL_I_FORDELING, "framtidsfri"] as const).some((id) => sparemaal[id].bekreftet),
      fasteTrekk: Boolean(fordeling?.fasteTrekkFullført),
    },
    lønn,
    fasteUtgifter: fordeling ? fordeling.poster.fasteUtgifter.månedlig : null,
    utgifterTotal,
    fasteTrekkFullført: fordeling?.fasteTrekkFullført ?? null,
    trekk,
    mål: [...målFraFordeling, framtidsfri, ...egne],
  }
}

/** Leser alle verktøyenes data fra nettleseren og bygger planen. */
export function lesPlan(): Plan {
  return byggPlan({
    fordeling: lastFordeling(),
    sparemaal: loadSparemaalState(),
    sparemaalLagret: erObjekt(lesJson(NØKLER.sparemaal)),
    utgifterTotal: lesUtgifterTotal(),
  })
}

/** «mars 2028» — måneden et mål nås, regnet fra `fra`. */
export function formaterFerdigMåned(måneder: number, fra: Date = new Date()): string {
  const dato = new Date(fra.getFullYear(), fra.getMonth() + måneder, 1)
  return dato.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })
}

// ─── Forslag til fordeling av en uventet sum ───────────────────────────────

export interface UventetForslag {
  kr: Partial<Record<OmraadeId, number>>
  begrunnelse: string[]
}

/** Andelen av det som er igjen etter bufferen, som går til å kose seg. */
export const KOS_ANDEL = 0.3

/**
 * Forslag basert på hvor mye som mangler på hvert mål:
 * 1. Fyll opp bufferen først — den er grunnmuren.
 * 2. Av resten går 30 % til guilt-free (kos deg litt!) og 70 % til fornuft.
 * 3. Fornuft-delen fyller målene i rekkefølge: ferie, store livshendelser,
 *    framtidsfri. Det som er igjen går til pensjon.
 * Alle beløp rundes ned til hele hundrelapper; restkroner går til siste mottaker.
 */
export function foreslåUventetFordeling(beløp: number, plan: Plan): UventetForslag {
  const kr: Partial<Record<OmraadeId, number>> = {}
  const begrunnelse: string[] = []
  if (beløp <= 0) return { kr, begrunnelse }

  const mangler = (id: string) => {
    const m = plan.mål.find((x) => x.id === id)
    if (!m?.mål) return 0
    return Math.max(0, m.mål - (m.alleredeSpart ?? 0))
  }
  const ned = (n: number) => Math.floor(n / 100) * 100

  let igjen = beløp
  const gi = (id: OmraadeId, ønsket: number) => {
    const beløpTil = Math.min(igjen, ned(ønsket))
    if (beløpTil <= 0) return 0
    kr[id] = (kr[id] ?? 0) + beløpTil
    igjen -= beløpTil
    return beløpTil
  }

  const tilBuffer = gi("buffer", mangler("buffer"))
  if (tilBuffer > 0) {
    begrunnelse.push(
      igjen === 0
        ? "Alt går til bufferen — den er grunnmuren og bør fylles først."
        : "Bufferen fylles opp først — den er grunnmuren."
    )
  } else {
    begrunnelse.push("Bufferen er allerede full.")
  }

  if (igjen > 0) {
    const kos = gi("guiltFree", avrundTil(igjen * KOS_ANDEL, 100))
    if (kos > 0) begrunnelse.push(`${Math.round(KOS_ANDEL * 100)} % av resten går til å kose deg.`)

    const fyller: OmraadeId[] = []
    for (const id of ["ferie", "storeLivshendelser", "framtidsfri"] as const) {
      if (gi(id, mangler(id)) > 0) fyller.push(id)
    }
    if (fyller.length > 0) {
      begrunnelse.push(
        `Resten fyller opp sparemålene dine: ${fyller.map((id) => OMRAADER[id].navn.toLowerCase()).join(", ")}.`
      )
    }
    if (igjen > 0) {
      kr.pensjon = (kr.pensjon ?? 0) + igjen
      igjen = 0
      begrunnelse.push("Det som er igjen går til pensjon.")
    }
  }

  return { kr, begrunnelse }
}

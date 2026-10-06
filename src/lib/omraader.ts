// De seks spareområdene (pluss faste utgifter) er ryggraden i Pengeprat.
// Filosofien på forsiden, fordelingen, sparemålene og uventet sum bygger
// alle på disse. Navn og farger defineres KUN her — alle verktøy henter
// herfra, slik at et område ser likt ut overalt.
//
// Se docs/produkt.md for hvorfor områdene finnes og hvordan de henger sammen.

export type OmraadeId =
  | "fasteUtgifter"
  | "buffer"
  | "guiltFree"
  | "ferie"
  | "storeLivshendelser"
  | "framtidsfri"
  | "pensjon"

export interface Omraade {
  id: OmraadeId
  navn: string
  farge: string
  /** Kontotypen pengene typisk står på — brukes i faste trekk og planen. */
  konto: string
}

export const OMRAADER: Record<OmraadeId, Omraade> = {
  fasteUtgifter: {
    id: "fasteUtgifter",
    navn: "Faste utgifter",
    farge: "oklch(0.58 0.16 250)", // blå
    konto: "brukskonto",
  },
  buffer: {
    id: "buffer",
    navn: "Buffer",
    farge: "oklch(0.62 0.15 185)", // teal
    konto: "sparekonto",
  },
  guiltFree: {
    id: "guiltFree",
    navn: "Guilt-free spending",
    farge: "oklch(0.65 0.14 70)", // amber
    konto: "forbrukskonto",
  },
  ferie: {
    id: "ferie",
    navn: "Ferie",
    farge: "oklch(0.63 0.15 30)", // oransje
    konto: "sparekonto",
  },
  storeLivshendelser: {
    id: "storeLivshendelser",
    navn: "Store livshendelser",
    farge: "oklch(0.53 0.19 295)", // lilla
    konto: "sparekonto",
  },
  framtidsfri: {
    id: "framtidsfri",
    navn: "Framtidsfri",
    farge: "oklch(0.61 0.19 278)", // fiolett
    konto: "aksjesparekonto",
  },
  pensjon: {
    id: "pensjon",
    navn: "Pensjon",
    farge: "oklch(0.62 0.15 140)", // grønn
    konto: "IPS / pensjonskonto",
  },
}

/** Ekstra farger for brukerens egne kategorier/mål (roterer). */
export const EKSTRA_FARGER = [
  "oklch(0.58 0.16 250)",
  "oklch(0.60 0.18 320)",
  "oklch(0.65 0.15 200)",
  "oklch(0.62 0.16 15)",
  "oklch(0.66 0.12 100)",
]

export function ekstraFarge(indeks: number): string {
  return EKSTRA_FARGER[indeks % EKSTRA_FARGER.length]
}

export type LivehendelsesType = "Bil" | "Bryllup" | "Egenkapital" | "Annet"

export interface SparemaalEntry {
  mål: number | null
  bekreftet: boolean
}

export interface LivehendelsesEntry extends SparemaalEntry {
  type: LivehendelsesType
}

export interface EgetMaal {
  id: string
  navn: string
  beskrivelse?: string
  mål: number | null
  farge: string
  bekreftet: boolean
}

export interface SparemaalState {
  buffer: SparemaalEntry
  ferie: SparemaalEntry
  framtidsfri: SparemaalEntry
  storeLivshendelser: LivehendelsesEntry
  egne: EgetMaal[]
}

export interface UventetSumKategori {
  id: string
  navn: string
  /** Kr allocated to this category (0 to state.beløp). */
  kr: number
  farge: string
}

export interface UventetSumState {
  beløp: number
  kategorier: UventetSumKategori[]
}

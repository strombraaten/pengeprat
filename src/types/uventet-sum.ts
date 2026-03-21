export interface UventetSumKategori {
  id: string
  navn: string
  /** Percentage allocation (0–100). Sum across all categories should equal 100. */
  prosent: number
  /** When true this category is pinned and excluded from auto-redistribution. */
  locked: boolean
  farge: string
}

export interface UventetSumState {
  beløp: number
  kategorier: UventetSumKategori[]
}

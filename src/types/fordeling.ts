export type PostId =
  | "fasteUtgifter"
  | "buffer"
  | "guiltFree"
  | "ferie"
  | "storeLivshendelser"
  | "pensjon"

export type ViewId =
  | "inngang"
  | "dashboard"
  | "fasteTrekk"
  | "feiring"

export interface Kategori {
  id: PostId
  navn: string
  farge: string
  beskrivelse: string
  forklaring: string
  inputType: "tekst" | "slider"
  harAlleredeSpart?: boolean
  harTidshorisont?: boolean
  harKrPerUke?: boolean
  harPensjonVisning?: boolean
  harMålInput?: boolean
  sliderMaxFaktor?: number
}

export interface PostState {
  månedlig: number
  mål?: number | null
  alleredeSpart?: number
}

export interface FordelingState {
  lønn: number | null
  poster: Record<PostId, PostState>
  interaksjon: Record<PostId, boolean>
}

export interface FordelingViewState extends FordelingState {
  view: ViewId
  expandedPost: PostId | null
}

import type { PostId, PostState } from "@/types/fordeling"

// Standardfordeling: prosentene summerer til ~100% etter avrunding.
// Faste utgifter rundes til nærmeste 100 kr, resten til nærmeste 50 kr
// – gjøres for at summene skal se "naturlige" ut for brukeren.
const STANDARD_PROSENT: Record<PostId, number> = {
  fasteUtgifter: 0.65,
  buffer: 0.092,
  guiltFree: 0.083,
  ferie: 0.075,
  storeLivshendelser: 0.058,
  pensjon: 0.042,
}

export function beregnStandardfordeling(
  lønn: number
): Record<PostId, number> {
  const fasteUtgifter =
    Math.round((lønn * STANDARD_PROSENT.fasteUtgifter) / 100) * 100
  const buffer = Math.round((lønn * STANDARD_PROSENT.buffer) / 50) * 50
  const guiltFree = Math.round((lønn * STANDARD_PROSENT.guiltFree) / 50) * 50
  const ferie = Math.round((lønn * STANDARD_PROSENT.ferie) / 50) * 50
  const storeLivshendelser =
    Math.round((lønn * STANDARD_PROSENT.storeLivshendelser) / 50) * 50
  const pensjon = Math.round((lønn * STANDARD_PROSENT.pensjon) / 50) * 50

  const total =
    fasteUtgifter +
    buffer +
    guiltFree +
    ferie +
    storeLivshendelser +
    pensjon
  const differanse = lønn - total

  return {
    // Avrundingsdifferansen absorberes av faste utgifter (største post)
    fasteUtgifter: fasteUtgifter + differanse,
    buffer,
    guiltFree,
    ferie,
    storeLivshendelser,
    pensjon,
  }
}

// Buffer-mål: 1,5× månedslønn, avrundet til nærmeste 100 kr
export function beregnBufferMål(lønn: number): number {
  return Math.round((lønn * 1.5) / 100) * 100
}

// Guilt-free anbefalt intervall: 7–12% av lønn
export function beregnGuiltFreeRange(lønn: number): {
  min: number
  maks: number
} {
  return {
    min: Math.round((lønn * 0.07) / 50) * 50,
    maks: Math.round((lønn * 0.12) / 50) * 50,
  }
}

export function beregnMånederTilMål(
  mål: number,
  alleredeSpart: number,
  månedlig: number
): number {
  const mangler = Math.max(0, mål - alleredeSpart)
  if (mangler === 0) return 0
  if (månedlig <= 0) return Infinity
  return Math.ceil(mangler / månedlig)
}

// Omregner månedsbeløp til kr per uke: (månedlig × 12) / 52
export function beregnKrPerUke(månedlig: number): number {
  return Math.round((månedlig * 12) / 52)
}

// Skalerer alle poster unntatt fasteUtgifter proporsjonalt når
// fasteUtgifter endres av brukeren.
export function omfordelEtterFasteUtgifter(
  nyeFasteUtgifter: number,
  lønn: number,
  poster: Record<PostId, PostState>
): void {
  const tilgjengelig = lønn - nyeFasteUtgifter
  const andreIds = (Object.keys(poster) as PostId[]).filter(
    (k) => k !== "fasteUtgifter"
  )
  const nåværendeSum = andreIds.reduce(
    (s, k) => s + (poster[k].månedlig ?? 0),
    0
  )

  if (nåværendeSum === 0) {
    const perPost = Math.round(tilgjengelig / andreIds.length / 50) * 50
    andreIds.forEach((k) => {
      poster[k].månedlig = perPost
    })
  } else {
    const faktor = tilgjengelig / nåværendeSum
    andreIds.forEach((k) => {
      poster[k].månedlig =
        Math.round(((poster[k].månedlig ?? 0) * faktor) / 50) * 50
    })
  }

  poster.fasteUtgifter.månedlig = nyeFasteUtgifter
  justerTilTotal(lønn, poster)
}

// Fordeler differansen likt på valgte poster.
// Kapper negative verdier på 0 – resten håndteres av justerTilTotal.
// fasteUtgifter holdes utenfor justeringen siden den er en reell forpliktelse.
export function fordelLikt(
  differanse: number,
  andrePoster: PostId[],
  poster: Record<PostId, PostState>,
  lønn: number
): void {
  if (!andrePoster.length) return
  const perPost = differanse / andrePoster.length

  andrePoster.forEach((k) => {
    const ny = Math.max(0, (poster[k]?.månedlig ?? 0) - perPost)
    poster[k].månedlig = Math.round(ny / 50) * 50
  })

  justerTilTotal(lønn, poster, ["fasteUtgifter"])
}

// Justerer den største tillatte posten for å absorbere avrundingsfeil slik at
// total alltid er lik lønn. excludeIds angir poster som ikke skal justeres.
export function justerTilTotal(
  lønn: number,
  poster: Record<PostId, PostState>,
  excludeIds: PostId[] = []
): void {
  const total = Object.values(poster).reduce(
    (s, p) => s + (p.månedlig ?? 0),
    0
  )
  const diff = lønn - total
  if (diff === 0) return

  const sortert = (Object.entries(poster) as [PostId, PostState][])
    .filter(([k]) => !excludeIds.includes(k as PostId))
    .sort((a, b) => (b[1].månedlig ?? 0) - (a[1].månedlig ?? 0))

  if (sortert.length === 0) return
  sortert[0][1].månedlig = (sortert[0][1].månedlig ?? 0) + diff
}

export function sliderMin(): number {
  return 50
}

export function sliderMax(lønn: number, maxFaktor: number): number {
  return Math.round((lønn * maxFaktor) / 50) * 50
}

import type { PostId, PostState } from "@/types/fordeling"

// Standardfordeling: prosentene summerer til ~100% etter avrunding.
// Faste utgifter rundes til nærmeste 100 kr, resten til nærmeste 50 kr
// – gjøres for at summene skal se "naturlige" ut for brukeren.
export const STANDARD_PROSENT: Record<PostId, number> = {
  fasteUtgifter: 0.75,
  buffer: 0.066,
  guiltFree: 0.059,
  ferie: 0.054,
  storeLivshendelser: 0.041,
  pensjon: 0.030,
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

// Framtidsfri-mål: et halvt år med faste utgifter, avrundet til nærmeste 1 000 kr
export function beregnFramtidsfriMål(fasteUtgifter: number): number {
  return Math.round((fasteUtgifter * 6) / 1000) * 1000
}

// Standard ferie-mål — dekker en god ferie for de fleste
export const FERIE_MÅL = 15_000

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
  // Faste utgifter er det brukeren faktisk betaler og skal ikke avrundes —
  // restkronene havner i guilt-free (se justerTilTotal)
  justerTilTotal(lønn, poster, ["fasteUtgifter"])
}

// Fordeler differansen likt på valgte poster.
// Kapper negative verdier på 0 – resten håndteres av justerTilTotal.
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

  // Bare postene som fikk eller ga penger justeres for avrunding — ikke den
  // brukeren endret, og aldri faste utgifter
  const ikkeJuster = (Object.keys(poster) as PostId[]).filter(
    (k) => !andrePoster.includes(k)
  )
  justerTilTotal(lønn, poster, ikkeJuster)
}

// Justerer postene slik at total alltid er lik lønn etter avrunding.
// Guilt-free er «restposten»: den tar avrundingskronene først, slik at
// sparetrekkene forblir runde tall. Ellers brukes den største posten.
// Underskudd trekkes fra uten at noen post går under 0.
// excludeIds angir poster som ikke skal justeres.
export function justerTilTotal(
  lønn: number,
  poster: Record<PostId, PostState>,
  excludeIds: PostId[] = []
): void {
  let diff = lønn - sumPoster(poster)
  if (diff === 0) return

  const kandidater = (Object.entries(poster) as [PostId, PostState][])
    .filter(([k]) => !excludeIds.includes(k))
    .sort((a, b) => {
      if (a[0] === "guiltFree") return -1
      if (b[0] === "guiltFree") return 1
      return (b[1].månedlig ?? 0) - (a[1].månedlig ?? 0)
    })

  if (kandidater.length === 0) return
  if (diff > 0) {
    kandidater[0][1].månedlig = (kandidater[0][1].månedlig ?? 0) + diff
    return
  }
  for (const [, post] of kandidater) {
    const trekk = Math.min(post.månedlig ?? 0, -diff)
    post.månedlig = (post.månedlig ?? 0) - trekk
    diff += trekk
    if (diff === 0) return
  }
}

// 0 slik at en post kan skrus helt av (f.eks. når målet er nådd)
export function sliderMin(): number {
  return 0
}

export function sliderMax(lønn: number, maxFaktor: number): number {
  return Math.round((lønn * maxFaktor) / 50) * 50
}

// ─── Mål nådd ──────────────────────────────────────────────────────────────

export function erMålNådd(post: PostState): boolean {
  const mål = post.mål ?? 0
  return mål > 0 && (post.alleredeSpart ?? 0) >= mål
}

/**
 * Når et mål er nådd trenger posten ikke flere penger. Beløpet frigjøres og
 * fordeles likt på de andre sparepostene som ikke har nådd målet sitt, slik
 * at summen fortsatt er lik lønna. Faste utgifter røres aldri.
 */
export function frigjørPost(
  postId: PostId,
  lønn: number,
  poster: Record<PostId, PostState>
): void {
  const frigjort = poster[postId].månedlig ?? 0
  poster[postId].månedlig = 0
  if (frigjort === 0) return

  const mottakere = (Object.keys(poster) as PostId[]).filter(
    (k) => k !== postId && k !== "fasteUtgifter" && !erMålNådd(poster[k])
  )
  if (mottakere.length === 0) {
    // Ingen andre sparemål å gi til — la pengene stå i guilt-free
    poster.guiltFree.månedlig = (poster.guiltFree.månedlig ?? 0) + frigjort
    return
  }
  fordelLikt(-frigjort, mottakere, poster, lønn)
}

/**
 * Ny lønn: behold det brukeren har bestemt. Faste utgifter beholdes hvis
 * brukeren har satt dem selv (og de er lavere enn ny lønn), ellers brukes
 * standardandelen. Sparepostene skaleres proporsjonalt, så den relative
 * fordelingen brukeren har valgt beholdes. Mål og «allerede spart» røres ikke.
 */
export function tilpassTilNyLønn(
  nyLønn: number,
  poster: Record<PostId, PostState>,
  fasteErSattAvBruker: boolean
): void {
  const standard = beregnStandardfordeling(nyLønn)
  const gamleFaste = poster.fasteUtgifter.månedlig ?? 0
  const faste =
    fasteErSattAvBruker && gamleFaste > 0 && gamleFaste < nyLønn
      ? gamleFaste
      : standard.fasteUtgifter
  omfordelEtterFasteUtgifter(faste, nyLønn, poster)
  for (const id of Object.keys(poster) as PostId[]) {
    if (erMålNådd(poster[id])) frigjørPost(id, nyLønn, poster)
  }
}

/** Sum av alle poster — skal alltid være lik lønna. */
export function sumPoster(poster: Record<PostId, PostState>): number {
  return Object.values(poster).reduce((s, p) => s + (p.månedlig ?? 0), 0)
}

/**
 * Lager forslaget til fordeling: standardandelene, men med faste utgifter fra
 * Utgifter-verktøyet når brukeren har fylt det ut. Mål og «allerede spart» i
 * `poster` beholdes, og poster som har nådd målet sitt får 0 kr.
 */
export function lagForslag(
  lønn: number,
  poster: Record<PostId, PostState>,
  fasteFraUtgifter: number | null
): void {
  const standard = beregnStandardfordeling(lønn)
  for (const id of Object.keys(standard) as PostId[]) {
    poster[id].månedlig = standard[id]
  }
  if (fasteFraUtgifter && fasteFraUtgifter > 0 && fasteFraUtgifter < lønn) {
    omfordelEtterFasteUtgifter(fasteFraUtgifter, lønn, poster)
  }
  for (const id of Object.keys(poster) as PostId[]) {
    if (erMålNådd(poster[id])) frigjørPost(id, lønn, poster)
  }
}

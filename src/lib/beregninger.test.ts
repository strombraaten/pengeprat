import { describe, expect, it } from "vitest"
import type { PostId, PostState } from "@/types/fordeling"
import { getDefaultState } from "./fordeling-storage"
import {
  beregnMånederTilMål,
  beregnStandardfordeling,
  erMålNådd,
  fordelLikt,
  frigjørPost,
  justerTilTotal,
  lagForslag,
  omfordelEtterFasteUtgifter,
  sumPoster,
  tilpassTilNyLønn,
} from "./beregninger"

function poster(): Record<PostId, PostState> {
  return getDefaultState().poster
}

function forslag(lønn: number, faste: number | null = null) {
  const p = poster()
  lagForslag(lønn, p, faste)
  return p
}

const ingenNegative = (p: Record<PostId, PostState>) =>
  Object.values(p).every((x) => x.månedlig >= 0)

describe("standardfordeling", () => {
  it.each([12_000, 30_000, 35_000, 41_234, 100_000])("summerer til lønna (%d)", (lønn) => {
    const f = beregnStandardfordeling(lønn)
    expect(Object.values(f).reduce((a, b) => a + b, 0)).toBe(lønn)
  })

  it("runder sparepostene til nærmeste 50 kr", () => {
    const f = beregnStandardfordeling(41_234)
    for (const id of ["buffer", "guiltFree", "ferie", "storeLivshendelser", "pensjon"] as const) {
      expect(f[id] % 50).toBe(0)
    }
  })
})

describe("lagForslag", () => {
  it("bruker faste utgifter fra Utgifter når de finnes", () => {
    const p = forslag(40_000, 23_400)
    expect(p.fasteUtgifter.månedlig).toBe(23_400)
    expect(sumPoster(p)).toBe(40_000)
  })

  it("holder sparetrekkene runde når faste utgifter er et «skjevt» tall", () => {
    const p = forslag(45_000, 24_195)
    expect(p.fasteUtgifter.månedlig).toBe(24_195)
    for (const id of ["buffer", "ferie", "storeLivshendelser", "pensjon"] as const) {
      expect(p[id].månedlig % 50).toBe(0)
    }
    expect(sumPoster(p)).toBe(45_000)
    expect(ingenNegative(p)).toBe(true)
  })

  it("ignorerer faste utgifter som er høyere enn lønna", () => {
    const p = forslag(20_000, 25_000)
    expect(p.fasteUtgifter.månedlig).toBe(beregnStandardfordeling(20_000).fasteUtgifter)
  })

  it("setter poster med nådd mål til 0 og holder summen lik lønna", () => {
    const p = poster()
    p.buffer.mål = 50_000
    p.buffer.alleredeSpart = 60_000
    lagForslag(40_000, p, null)
    expect(p.buffer.månedlig).toBe(0)
    expect(sumPoster(p)).toBe(40_000)
  })
})

describe("frigjørPost (mål nådd)", () => {
  it("fordeler beløpet på andre spareposter og beholder summen", () => {
    const p = forslag(40_000)
    const faste = p.fasteUtgifter.månedlig
    p.ferie.mål = 15_000
    p.ferie.alleredeSpart = 15_000
    frigjørPost("ferie", 40_000, p)
    expect(p.ferie.månedlig).toBe(0)
    expect(p.fasteUtgifter.månedlig).toBe(faste)
    expect(sumPoster(p)).toBe(40_000)
    expect(ingenNegative(p)).toBe(true)
  })

  it("gir ikke penger til andre poster som også har nådd målet", () => {
    const p = forslag(40_000)
    p.buffer.mål = 10_000
    p.buffer.alleredeSpart = 10_000
    p.buffer.månedlig = 0
    justerTilTotal(40_000, p, ["fasteUtgifter", "buffer"])
    p.ferie.mål = 15_000
    p.ferie.alleredeSpart = 20_000
    frigjørPost("ferie", 40_000, p)
    expect(p.buffer.månedlig).toBe(0)
    expect(sumPoster(p)).toBe(40_000)
  })
})

describe("omfordeling", () => {
  it("endring i faste utgifter rører ikke beløpet brukeren satte", () => {
    const p = forslag(40_000)
    omfordelEtterFasteUtgifter(31_337, 40_000, p)
    expect(p.fasteUtgifter.månedlig).toBe(31_337)
    expect(sumPoster(p)).toBe(40_000)
    expect(ingenNegative(p)).toBe(true)
  })

  it("tåler faste utgifter nesten lik lønna uten negative poster", () => {
    const p = forslag(40_000)
    omfordelEtterFasteUtgifter(39_870, 40_000, p)
    expect(ingenNegative(p)).toBe(true)
    expect(sumPoster(p)).toBe(40_000)
  })

  it("fordelLikt holder faste utgifter utenfor", () => {
    const p = forslag(40_000)
    const faste = p.fasteUtgifter.månedlig
    p.buffer.månedlig += 1_000
    fordelLikt(1_000, ["guiltFree", "ferie", "storeLivshendelser", "pensjon"], p, 40_000)
    expect(p.fasteUtgifter.månedlig).toBe(faste)
    expect(sumPoster(p)).toBe(40_000)
  })
})

describe("tilpassTilNyLønn", () => {
  it("beholder faste utgifter brukeren har satt, og mål", () => {
    const p = forslag(40_000)
    omfordelEtterFasteUtgifter(25_000, 40_000, p)
    p.buffer.mål = 60_000
    p.buffer.alleredeSpart = 12_000
    tilpassTilNyLønn(45_000, p, true)
    expect(p.fasteUtgifter.månedlig).toBe(25_000)
    expect(p.buffer.mål).toBe(60_000)
    expect(p.buffer.alleredeSpart).toBe(12_000)
    expect(sumPoster(p)).toBe(45_000)
  })

  it("bruker standardandel når faste ikke er satt av brukeren", () => {
    const p = forslag(40_000)
    tilpassTilNyLønn(50_000, p, false)
    expect(p.fasteUtgifter.månedlig).toBe(beregnStandardfordeling(50_000).fasteUtgifter)
    expect(sumPoster(p)).toBe(50_000)
  })

  it("beholder den relative fordelingen mellom sparepostene", () => {
    const p = forslag(40_000)
    const forhold = p.buffer.månedlig / p.pensjon.månedlig
    tilpassTilNyLønn(80_000, p, false)
    expect(p.buffer.månedlig / p.pensjon.månedlig).toBeCloseTo(forhold, 0)
  })
})

describe("små hjelpere", () => {
  it("erMålNådd", () => {
    expect(erMålNådd({ månedlig: 0, mål: 100, alleredeSpart: 100 })).toBe(true)
    expect(erMålNådd({ månedlig: 0, mål: 100, alleredeSpart: 99 })).toBe(false)
    expect(erMålNådd({ månedlig: 0, mål: null, alleredeSpart: 99 })).toBe(false)
  })

  it("beregnMånederTilMål", () => {
    expect(beregnMånederTilMål(10_000, 0, 1_000)).toBe(10)
    expect(beregnMånederTilMål(10_000, 500, 1_000)).toBe(10)
    expect(beregnMånederTilMål(10_000, 10_000, 1_000)).toBe(0)
    expect(beregnMånederTilMål(10_000, 0, 0)).toBe(Infinity)
  })
})

describe("justerTilTotal", () => {
  it("legger restkroner i guilt-free", () => {
    const p = forslag(40_000)
    const før = p.guiltFree.månedlig
    p.fasteUtgifter.månedlig += 13
    justerTilTotal(40_000, p, ["fasteUtgifter"])
    expect(p.guiltFree.månedlig).toBe(før - 13)
  })

  it("rører ikke posten brukeren nettopp justerte", () => {
    const p = forslag(40_000)
    p.buffer.månedlig = 3_333
    const diff = 3_333 - forslag(40_000).buffer.månedlig
    fordelLikt(diff, ["guiltFree", "ferie", "storeLivshendelser", "pensjon"], p, 40_000)
    expect(p.buffer.månedlig).toBe(3_333)
    expect(sumPoster(p)).toBe(40_000)
  })
})

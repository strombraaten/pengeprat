import { describe, expect, it } from "vitest"
import { byggPlan, foreslåUventetFordeling, formaterFerdigMåned, lesPlan, type PlanGrunnlag } from "./plan"
import { getDefaultState } from "./fordeling-storage"
import { lagForslag } from "./beregninger"
import { tolkSparemaal } from "./sparemaal-storage"
import { NØKLER } from "./lagring"

function grunnlag(over: Partial<PlanGrunnlag> = {}): PlanGrunnlag {
  const fordeling = getDefaultState()
  fordeling.lønn = 40_000
  lagForslag(40_000, fordeling.poster, null)
  fordeling.poster.buffer.mål = 60_000
  fordeling.poster.buffer.alleredeSpart = 20_000
  return {
    fordeling,
    sparemaal: tolkSparemaal(null),
    sparemaalLagret: false,
    utgifterTotal: null,
    ...over,
  }
}

describe("byggPlan", () => {
  it("lister faste trekk uten faste utgifter", () => {
    const plan = byggPlan(grunnlag())
    expect(plan.trekk.map((t) => t.id)).not.toContain("fasteUtgifter")
    expect(plan.trekk.every((t) => t.månedlig > 0)).toBe(true)
    expect(plan.steg.fordeling).toBe(true)
    expect(plan.steg.utgifter).toBe(false)
  })

  it("regner ut tid til mål fra Fordeling", () => {
    const g = grunnlag()
    const plan = byggPlan(g)
    const buffer = plan.mål.find((m) => m.id === "buffer")!
    expect(buffer.mål).toBe(60_000)
    expect(buffer.måneder).toBe(Math.ceil(40_000 / g.fordeling!.poster.buffer.månedlig))
  })

  it("lar bekreftede mål fra Definer taket gå foran", () => {
    const sparemaal = tolkSparemaal({ buffer: { mål: 90_000, bekreftet: true } })
    const plan = byggPlan(grunnlag({ sparemaal, sparemaalLagret: true }))
    expect(plan.mål.find((m) => m.id === "buffer")!.mål).toBe(90_000)
    expect(plan.steg.sparemaal).toBe(true)
  })

  it("fungerer uten Fordeling", () => {
    const plan = byggPlan(grunnlag({ fordeling: null }))
    expect(plan.lønn).toBeNull()
    expect(plan.trekk).toEqual([])
    expect(plan.mål.find((m) => m.id === "buffer")!.måneder).toBeNull()
  })

  it("lesPlan leser fra nettleseren", () => {
    localStorage.setItem(NØKLER.fordeling, JSON.stringify(grunnlag().fordeling))
    expect(lesPlan().lønn).toBe(40_000)
  })
})

describe("foreslåUventetFordeling", () => {
  const sum = (kr: Record<string, number | undefined>) =>
    Object.values(kr).reduce<number>((a, b) => a + (b ?? 0), 0)

  it("fyller bufferen først", () => {
    const plan = byggPlan(grunnlag())
    const { kr } = foreslåUventetFordeling(30_000, plan)
    expect(kr).toEqual({ buffer: 30_000 })
  })

  it("fordeler resten etter bufferen: kos, mål og pensjon", () => {
    const plan = byggPlan(grunnlag())
    const { kr, begrunnelse } = foreslåUventetFordeling(1_000_000, plan)
    expect(kr.buffer).toBe(40_000)
    expect(kr.guiltFree).toBe(288_000)
    expect(kr.ferie).toBe(15_000)
    expect(kr.pensjon).toBeGreaterThan(0)
    expect(sum(kr)).toBe(1_000_000)
    expect(begrunnelse.length).toBeGreaterThan(1)
  })

  it("fordeler alltid hele beløpet", () => {
    const plan = byggPlan(grunnlag())
    for (const beløp of [100, 4_300, 40_100, 123_400, 777_700]) {
      expect(sum(foreslåUventetFordeling(beløp, plan).kr)).toBe(beløp)
    }
  })

  it("gir ingenting for 0 kr", () => {
    expect(foreslåUventetFordeling(0, byggPlan(grunnlag())).kr).toEqual({})
  })
})

it("formaterFerdigMåned", () => {
  expect(formaterFerdigMåned(14, new Date(2026, 9, 6))).toBe("desember 2027")
})

import { describe, expect, it } from "vitest"
import { NØKLER } from "./lagring"
import { loadState, tolkFordeling } from "./fordeling-storage"
import { lastUtgifter, lesUtgifterTotal, standardUtgifter, tolkUtgifter } from "./utgifter-storage"
import {
  lagreMålFraFordeling,
  lesBekreftedeMål,
  loadSparemaalState,
  tolkSparemaal,
} from "./sparemaal-storage"
import { tolkUventetSum } from "./uventet-sum-storage"
import { DEFAULT_CATEGORIES } from "./utgifter-data"

const sett = (nøkkel: string, verdi: unknown) =>
  localStorage.setItem(nøkkel, typeof verdi === "string" ? verdi : JSON.stringify(verdi))

describe("fordeling-lagring", () => {
  it("returnerer null for korrupt JSON", () => {
    sett(NØKLER.fordeling, "{ikke json")
    expect(loadState()).toBeNull()
  })

  it("krever positiv lønn", () => {
    expect(tolkFordeling({ lønn: 0, poster: {} })).toBeNull()
    expect(tolkFordeling({ lønn: "40000", poster: {} })).toBeNull()
  })

  it("erstatter tall med feil form og fyller inn manglende poster", () => {
    const s = tolkFordeling({
      lønn: 40_000,
      poster: { buffer: { månedlig: -5, mål: "x", alleredeSpart: 100 } },
    })!
    expect(s.poster.buffer).toEqual({ månedlig: 0, mål: null, alleredeSpart: 100 })
    expect(s.poster.ferie.mål).toBe(15_000)
    expect(s.interaksjon.buffer).toBe(false)
  })
})

describe("utgifter-lagring", () => {
  it("gir standard når ingenting er lagret", () => {
    expect(lastUtgifter()).toEqual(standardUtgifter())
  })

  it("viser nye kategorier for brukere med eldre lagring (Diverse, #50)", () => {
    const gammel = standardUtgifter()
    gammel.categories = gammel.categories.filter((c) => c.id !== "diverse")
    const utenNyeFelt: Record<string, unknown> = { ...gammel }
    delete utenNyeFelt.kjenteStandardposter
    delete utenNyeFelt.endret
    const s = tolkUtgifter(utenNyeFelt)
    const diverse = s.categories.find((c) => c.id === "diverse")
    expect(diverse).toBeDefined()
    expect(diverse!.items.every((i) => i.amount === 0)).toBe(true)
  })

  it("legger ikke tilbake standardposter brukeren har slettet", () => {
    const s = standardUtgifter()
    s.categories[0].items = s.categories[0].items.filter((i) => i.id !== "strom")
    const lastet = tolkUtgifter(JSON.parse(JSON.stringify(s)))
    expect(lastet.categories[0].items.some((i) => i.id === "strom")).toBe(false)
  })

  it("beholder egne poster og beløp", () => {
    const s = standardUtgifter()
    s.categories[0].items.push({ id: "custom-1", label: "Hytte", amount: 2_000, custom: true })
    s.categories[0].items[0].amount = 9_999
    const lastet = tolkUtgifter(JSON.parse(JSON.stringify(s)))
    expect(lastet.categories[0].items.find((i) => i.id === "custom-1")?.amount).toBe(2_000)
    expect(lastet.categories[0].items[0].amount).toBe(9_999)
  })

  it("migrerer gammelt expandedCategory-felt", () => {
    const s = tolkUtgifter({ categories: DEFAULT_CATEGORIES, expandedCategory: "bolig", selectedPreset: null })
    expect(s.expandedCategories).toEqual(["bolig"])
  })

  it("teller ikke eksempeltallene som brukerens utgifter", () => {
    sett(NØKLER.utgifter, standardUtgifter())
    expect(lesUtgifterTotal()).toBeNull()
  })

  it("gir totalen når brukeren har endret tallene", () => {
    const s = standardUtgifter()
    s.categories[0].items[0].amount += 1_000
    s.endret = true
    sett(NØKLER.utgifter, s)
    expect(lesUtgifterTotal()).toBeGreaterThan(0)
  })

  it("tåler korrupt data", () => {
    sett(NØKLER.utgifter, "null")
    expect(lastUtgifter()).toEqual(standardUtgifter())
    expect(tolkUtgifter({ categories: [null, 3, { id: "bolig", items: "x" }] }).categories.length).toBe(
      DEFAULT_CATEGORIES.length
    )
  })
})

describe("sparemål-lagring og deling med Fordeling", () => {
  it("bruker lønna fra Fordeling for buffer-forslaget", () => {
    sett(NØKLER.fordeling, {
      lønn: 40_000,
      poster: { fasteUtgifter: { månedlig: 30_000 } },
    })
    const s = loadSparemaalState()
    expect(s.buffer.mål).toBe(60_000)
    expect(s.framtidsfri.mål).toBe(180_000)
  })

  it("deler bare bekreftede mål med Fordeling", () => {
    expect(lesBekreftedeMål()).toEqual({})
    lagreMålFraFordeling("ferie", 20_000)
    expect(lesBekreftedeMål()).toEqual({ ferie: 20_000 })
    expect(loadSparemaalState().ferie).toEqual({ mål: 20_000, bekreftet: true })
  })

  it("tåler ukjent livshendelsestype og ødelagte egne mål", () => {
    const s = tolkSparemaal({
      storeLivshendelser: { type: "Romskip", mål: 5, bekreftet: true },
      egne: [{ id: "a", navn: "Sykkel", mål: 8_000 }, "x", { navn: "uten id" }],
    })
    expect(s.storeLivshendelser.type).toBe("Bil")
    expect(s.egne).toHaveLength(1)
    expect(s.egne[0].bekreftet).toBe(false)
  })
})

describe("uventet sum-lagring", () => {
  it("nullstiller gammelt prosentformat", () => {
    const s = tolkUventetSum({ beløp: 1000, kategorier: [{ id: "buffer", prosent: 50 }] })
    expect(s.beløp).toBe(0)
  })

  it("nullstiller fordeling som overstiger beløpet", () => {
    const s = tolkUventetSum({
      beløp: 1000,
      kategorier: [{ id: "buffer", navn: "Buffer", kr: 800, farge: "x" }, { id: "ferie", navn: "Ferie", kr: 800, farge: "y" }],
    })
    expect(s.kategorier.every((k) => k.kr === 0)).toBe(true)
  })
})

import { describe, expect, it } from "vitest"
import { gjenopprett, lagSikkerhetskopi } from "./sikkerhetskopi"
import { NØKLER } from "./lagring"
import { getDefaultState, loadState } from "./fordeling-storage"
import { lagForslag } from "./beregninger"

function lagreFordeling() {
  const s = getDefaultState()
  s.lønn = 40_000
  lagForslag(40_000, s.poster, null)
  localStorage.setItem(NØKLER.fordeling, JSON.stringify(s))
  return s
}

describe("sikkerhetskopi", () => {
  it("tar med data fra verktøyene som er brukt", () => {
    lagreFordeling()
    const kopi = lagSikkerhetskopi()
    expect(Object.keys(kopi.data)).toEqual(["fordeling"])
  })

  it("gjenoppretter det som ble eksportert", () => {
    const original = lagreFordeling()
    const tekst = JSON.stringify(lagSikkerhetskopi())
    localStorage.clear()
    expect(gjenopprett(tekst)).toEqual({ ok: true, verktøy: ["fordeling"] })
    expect(loadState()).toEqual(original)
  })

  it.each([
    ["ikke json", "{"],
    ["feil format", JSON.stringify({ format: "noe annet", data: {} })],
    ["nyere versjon", JSON.stringify({ format: "pengeprat-sikkerhetskopi", versjon: 99, data: {} })],
    ["tom", JSON.stringify({ format: "pengeprat-sikkerhetskopi", versjon: 1, data: {} })],
  ])("avviser %s", (_navn, tekst) => {
    const r = gjenopprett(tekst)
    expect(r.ok).toBe(false)
    expect(localStorage.length).toBe(0)
  })

  it("renser data med feil form før lagring", () => {
    const tekst = JSON.stringify({
      format: "pengeprat-sikkerhetskopi",
      versjon: 1,
      data: { fordeling: { lønn: 30_000, poster: { buffer: { månedlig: "mye" } } } },
    })
    expect(gjenopprett(tekst).ok).toBe(true)
    expect(loadState()!.poster.buffer.månedlig).toBe(0)
  })
})

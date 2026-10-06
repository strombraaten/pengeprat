import { describe, expect, it } from "vitest"
import { parseBeløp } from "./tall"

describe("parseBeløp", () => {
  it.each([
    ["35000", 35000],
    ["35 000", 35000],
    ["35\u00a0000", 35000],
    ["35.000", 35000],
    ["35,000", 35000],
    ["1.234.567", 1234567],
    ["35 000 kr", 35000],
    ["35 000,50", 35001],
    ["35000,4", 35000],
    ["12,5", 13],
  ])("tolker %j som %d", (input, forventet) => {
    expect(parseBeløp(input)).toBe(forventet)
  })

  it.each(["", "   ", "abc", "-500", "12a", "1,2,3"])("avviser %j", (input) => {
    expect(parseBeløp(input)).toBeNull()
  })
})

// Tolking av beløp brukeren skriver inn.
//
// Folk skriver tall på mange måter: "35000", "35 000", "35.000", "35 000 kr",
// "35 000,50". Regelen er: komma eller punktum etterfulgt av nøyaktig tre
// sifre er tusenskille; ellers er det desimalskille. Desimaler rundes til
// hele kroner.

export function parseBeløp(input: string): number | null {
  const renset = input
    .replace(/kr\.?/gi, "")
    .replace(/[\s\u00a0\u202f']/g, "")
  if (!renset) return null

  // Tusenskille: , eller . fulgt av nøyaktig tre sifre
  const utenTusen = renset.replace(/[.,](?=\d{3}(?:\D|$))/g, "")
  // Gjenværende komma er desimalskille
  const normalisert = utenTusen.replace(",", ".")

  if (!/^\d+(\.\d+)?$/.test(normalisert)) return null
  const tall = Number(normalisert)
  return Number.isFinite(tall) ? Math.round(tall) : null
}

export function avrundTil(n: number, steg: number): number {
  return Math.round(n / steg) * steg
}

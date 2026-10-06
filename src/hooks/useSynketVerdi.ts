import { useState } from "react"

/**
 * Lokal kopi av en verdi som kommer utenfra, f.eks. en slider som skal
 * oppdateres umiddelbart mens brukeren drar, eller et tekstfelt som bare
 * lagres ved blur. Når verdien utenfra endres (Tilbakestill, omfordeling),
 * synkes den lokale kopien.
 *
 * Følger React-mønsteret «justere state når props endres» — uten refs eller
 * effekter: https://react.dev/learn/you-might-not-need-an-effect
 */
export function useSynketVerdi<T>(ekstern: T): [T, (ny: T) => void, () => void] {
  const [lokal, setLokal] = useState(ekstern)
  const [forrige, setForrige] = useState(ekstern)

  if (!Object.is(forrige, ekstern)) {
    setForrige(ekstern)
    setLokal(ekstern)
  }

  // Tilbake til verdien utenfra, f.eks. etter at en endring ble avvist
  const tilbakestill = () => setLokal(ekstern)

  return [lokal, setLokal, tilbakestill]
}

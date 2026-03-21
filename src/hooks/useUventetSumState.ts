import { useCallback, useEffect, useState } from "react"
import type { UventetSumKategori, UventetSumState } from "@/types/uventet-sum"
import {
  klonaKategorier,
  loadUventetSumState,
  nyttFargeFraPaletten,
  saveUventetSumState,
} from "@/lib/uventet-sum-storage"

// ---------------------------------------------------------------------------
// Redistribution logic
// ---------------------------------------------------------------------------

/**
 * When the user drags a slider, that category is auto-locked. Only unlocked
 * categories absorb the change, proportionally to their current share.
 */
function normaliserProsenter(
  kategorier: UventetSumKategori[],
  endretId: string,
  nyProsent: number
): UventetSumKategori[] {
  const låsteAndre = kategorier.filter((k) => k.id !== endretId && k.locked)
  const frie = kategorier.filter((k) => k.id !== endretId && !k.locked)

  const låstTotal = låsteAndre.reduce((s, k) => s + k.prosent, 0)
  // Cap: the changed category cannot exceed what's left after locked others
  const faktiskProsent = Math.min(nyProsent, 100 - låstTotal)
  const gjenværende = 100 - låstTotal - faktiskProsent

  const friTotal = frie.reduce((s, k) => s + k.prosent, 0)

  return kategorier.map((k) => {
    if (k.id === endretId) return { ...k, prosent: faktiskProsent, locked: true }
    if (k.locked) return k
    if (frie.length === 0) return k
    // Keep prosent as float — rounding to integer here causes kr snap-to-340 jumps
    // (for e.g. 34 000 kr, 1% = 340 kr, so integer prosent = 340 kr minimum step).
    // Display code rounds for labels; Math.round(beløp * prosent / 100) recovers exact kr.
    if (friTotal === 0) return { ...k, prosent: gjenværende / frie.length }
    return { ...k, prosent: gjenværende * (k.prosent / friTotal) }
  })
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function lagInitialState(): UventetSumState {
  // SSR guard: localStorage is only available in the browser
  if (typeof window === "undefined") {
    return { beløp: 0, kategorier: klonaKategorier() }
  }
  return loadUventetSumState()
}

export function useUventetSumState() {
  const [state, setState] = useState<UventetSumState>(lagInitialState)

  // Persist on every state change
  useEffect(() => {
    saveUventetSumState(state)
  }, [state])

  const setBeløp = useCallback((beløp: number) => {
    setState((prev) => ({ ...prev, beløp }))
  }, [])

  const endreProsent = useCallback((id: string, nyProsent: number) => {
    setState((prev) => ({
      ...prev,
      kategorier: normaliserProsenter(prev.kategorier, id, nyProsent),
    }))
  }, [])

  const låsOpp = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      kategorier: prev.kategorier.map((k) =>
        k.id === id ? { ...k, locked: false } : k
      ),
    }))
  }, [])

  const endreNavn = useCallback((id: string, navn: string) => {
    setState((prev) => ({
      ...prev,
      kategorier: prev.kategorier.map((k) => (k.id === id ? { ...k, navn } : k)),
    }))
  }, [])

  const leggTilKategori = useCallback(() => {
    setState((prev) => {
      const nyKategori: UventetSumKategori = {
        id: Math.random().toString(36).slice(2, 9),
        navn: "",
        prosent: 0,
        locked: false,
        farge: nyttFargeFraPaletten(prev.kategorier.length),
      }
      return { ...prev, kategorier: [...prev.kategorier, nyKategori] }
    })
  }, [])

  const fjernKategori = useCallback((id: string) => {
    setState((prev) => {
      const gjenværende = prev.kategorier.filter((k) => k.id !== id)
      if (gjenværende.length === 0) return prev

      // After structural change (remove): reset all locks and redistribute
      // the removed category's share proportionally among survivors.
      const total = gjenværende.reduce((s, k) => s + k.prosent, 0)
      const justerte = gjenværende.map((k) => ({
        ...k,
        locked: false,
        prosent:
          total === 0
            ? Math.round(100 / gjenværende.length)
            : Math.round(k.prosent * (100 / total)),
      }))
      return { ...prev, kategorier: justerte }
    })
  }, [])

  const nullstillFordeling = useCallback(() => {
    setState((prev) => ({ ...prev, kategorier: klonaKategorier() }))
  }, [])

  return {
    state,
    setBeløp,
    endreProsent,
    låsOpp,
    endreNavn,
    leggTilKategori,
    fjernKategori,
    nullstillFordeling,
  }
}

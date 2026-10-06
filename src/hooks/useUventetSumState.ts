import { useCallback, useEffect, useState } from "react"
import type { UventetSumKategori, UventetSumState } from "@/types/uventet-sum"
import {
  klonaKategorier,
  loadUventetSumState,
  nyttFargeFraPaletten,
  saveUventetSumState,
} from "@/lib/uventet-sum-storage"

export function useUventetSumState() {
  const [state, setState] = useState<UventetSumState>(loadUventetSumState)

  useEffect(() => {
    saveUventetSumState(state)
  }, [state])

  // Entering a new amount resets all categories to 0 kr
  const setBeløp = useCallback((beløp: number) => {
    setState((prev) => ({
      beløp,
      kategorier: prev.kategorier.map((k) => ({ ...k, kr: 0 })),
    }))
  }, [])

  // Set kr for a category — capped so the total never exceeds beløp
  const endreKr = useCallback((id: string, nyKr: number) => {
    setState((prev) => {
      const andreKr = prev.kategorier
        .filter((k) => k.id !== id)
        .reduce((s, k) => s + k.kr, 0)
      const klampetKr = Math.max(0, Math.min(nyKr, prev.beløp - andreKr))
      return {
        ...prev,
        kategorier: prev.kategorier.map((k) =>
          k.id === id ? { ...k, kr: klampetKr } : k
        ),
      }
    })
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
        kr: 0,
        farge: nyttFargeFraPaletten(prev.kategorier.length),
      }
      return { ...prev, kategorier: [...prev.kategorier, nyKategori] }
    })
  }, [])

  const fjernKategori = useCallback((id: string) => {
    setState((prev) => {
      const gjenværende = prev.kategorier.filter((k) => k.id !== id)
      if (gjenværende.length === 0) return prev
      return { ...prev, kategorier: gjenværende }
    })
  }, [])

  // Resets to default categories with 0 kr each
  const nullstillFordeling = useCallback(() => {
    setState((prev) => ({ ...prev, kategorier: klonaKategorier() }))
  }, [])

  // Fyller inn et forslag (kr per kategori-id). Kategorier som mangler i
  // forslaget settes til 0; forslag til kategorier brukeren har slettet
  // blir stående som «ikke fordelt».
  const brukForslag = useCallback((kr: Partial<Record<string, number>>) => {
    setState((prev) => ({
      ...prev,
      kategorier: prev.kategorier.map((k) => ({ ...k, kr: kr[k.id] ?? 0 })),
    }))
  }, [])

  return {
    state,
    brukForslag,
    setBeløp,
    endreKr,
    endreNavn,
    leggTilKategori,
    fjernKategori,
    nullstillFordeling,
  }
}

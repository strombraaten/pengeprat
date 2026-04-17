export function formatKr(n: number | null | undefined): string {
  if (n == null) return "0 kr"
  return Math.round(n).toLocaleString("nb-NO") + " kr"
}

export function formaterTidsperiodeLang(måneder: number): string {
  if (!isFinite(måneder)) return "aldri — øk månedlig sparing"
  if (måneder <= 0) return "du allerede har nådd målet"
  const år = Math.floor(måneder / 12)
  const rest = måneder % 12
  if (år === 0) return `${måneder} måneder`
  if (rest === 0) return `${år} år`
  return `${år} år og ${rest} måneder`
}

  if (!isFinite(måneder)) return "aldri (øk månedlig sparing)"
  if (måneder <= 0) return "Mål nådd!"
  const år = Math.floor(måneder / 12)
  const rest = måneder % 12
  if (år === 0) return `~${måneder} måneder`
  if (rest === 0) return `~${år} år`
  return `~${år} år, ${rest} mnd`
}

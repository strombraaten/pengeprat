import { useState } from "react"
import { LockOpenIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { formatKr } from "@/lib/formatering"
import { useUventetSumState } from "@/hooks/useUventetSumState"
import type { UventetSumKategori } from "@/types/uventet-sum"

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function parseBeløp(str: string): number {
  const renset = str.replace(/\s/g, "").replace(/,/g, "")
  const tall = parseInt(renset, 10)
  return isNaN(tall) || tall < 0 ? 0 : tall
}

// ---------------------------------------------------------------------------
// Distribution bar
// ---------------------------------------------------------------------------

interface FordelingsBarProps {
  kategorier: UventetSumKategori[]
}

function FordelingsBar({ kategorier }: FordelingsBarProps) {
  const synlige = kategorier.filter((k) => k.prosent > 0)

  return (
    <div className="flex h-7 w-full overflow-hidden rounded-lg">
      {synlige.map((k, i) => {
        const erFørste = i === 0
        const erSiste = i === synlige.length - 1
        const visLabel = k.prosent >= 8

        return (
          <div
            key={k.id}
            className="relative flex items-center justify-center overflow-hidden transition-all duration-200"
            style={{
              width: `${k.prosent}%`,
              backgroundColor: k.farge,
              borderRadius: erFørste
                ? "0.5rem 0 0 0.5rem"
                : erSiste
                  ? "0 0.5rem 0.5rem 0"
                  : undefined,
            }}
            title={`${k.navn || "Uten navn"} — ${k.prosent}%`}
          >
            {visLabel && (
              <span className="truncate px-1 text-[10px] font-semibold text-white/90">
                {k.prosent}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Category row
// ---------------------------------------------------------------------------

interface KategoriRadProps {
  kategori: UventetSumKategori
  beløp: number
  onEndreProsent: (id: string, prosent: number) => void
  onLåsOpp: (id: string) => void
  onEndreNavn: (id: string, navn: string) => void
  onFjern: (id: string) => void
  kanFjernes: boolean
}

function KategoriRad({
  kategori,
  beløp,
  onEndreProsent,
  onLåsOpp,
  onEndreNavn,
  onFjern,
  kanFjernes,
}: KategoriRadProps) {
  const harBeløp = beløp > 0
  const krVerdi = Math.round(beløp * kategori.prosent / 100)

  return (
    <div className="space-y-2">
      {/* Header: color dot + name input + action buttons */}
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: kategori.farge }}
          aria-hidden
        />
        <input
          type="text"
          value={kategori.navn}
          onChange={(e) => onEndreNavn(kategori.id, e.target.value)}
          placeholder="Kategorinavn"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
          aria-label="Kategorinavn"
        />
        <div className="flex shrink-0 items-center gap-1">
          {kategori.locked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLåsOpp(kategori.id)}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            >
              <LockOpenIcon size={12} />
              Lås opp
            </Button>
          )}
          {kanFjernes && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFjern(kategori.id)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label={`Fjern ${kategori.navn || "kategori"}`}
            >
              <TrashIcon size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Value display */}
      <div className="text-xl font-bold tabular-nums">
        {harBeløp ? formatKr(krVerdi) : `${kategori.prosent}%`}
      </div>

      {/* Slider */}
      <Slider
        value={[kategori.prosent]}
        min={0}
        max={100}
        step={1}
        onValueChange={([v]) => onEndreProsent(kategori.id, v)}
        aria-label={`Fordeling for ${kategori.navn || "kategori"}`}
      />

      {/* Slider end labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{harBeløp ? "0 kr" : "0%"}</span>
        <span>{harBeløp ? formatKr(beløp) : "100%"}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------

export function UventetSumApp() {
  const {
    state,
    setBeløp,
    endreProsent,
    låsOpp,
    endreNavn,
    leggTilKategori,
    fjernKategori,
    nullstillFordeling,
  } = useUventetSumState()

  // Draft string for the beløp input — only commits on blur/Enter
  const [beløpDraft, setBeløpDraft] = useState(
    state.beløp > 0 ? String(state.beløp) : ""
  )

  const harBeløp = state.beløp > 0

  function commitBeløp(raw: string) {
    const parsed = parseBeløp(raw)
    setBeløp(parsed)
    setBeløpDraft(parsed > 0 ? String(parsed) : "")
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">

      {/* Page header */}
      <div className="mb-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Uventet sum
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Fått inn en uventet sum?
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Fordel beløpet mellom kategorier. Dra en slider for å låse den — de andre
          tilpasser seg automatisk.
        </p>
      </div>

      {/* Amount input */}
      <div className="mb-8 space-y-2">
        <label htmlFor="beløp-input" className="text-sm font-medium">
          Hvor mye har du fått?
        </label>
        <div className="relative max-w-xs">
          <Input
            id="beløp-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="f.eks. 50 000"
            autoComplete="off"
            value={beløpDraft}
            onChange={(e) => setBeløpDraft(e.target.value)}
            onBlur={(e) => commitBeløp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitBeløp(beløpDraft)
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            className="pr-10"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
            kr
          </span>
        </div>
      </div>

      {/* Distribution section — only visible once an amount is entered */}
      {harBeløp && (
        <div className="space-y-8">

          {/* Distribution bar */}
          <FordelingsBar kategorier={state.kategorier} />

          {/* Category sliders */}
          <div className="space-y-6">
            {state.kategorier.map((kat) => (
              <KategoriRad
                key={kat.id}
                kategori={kat}
                beløp={state.beløp}
                onEndreProsent={endreProsent}
                onLåsOpp={låsOpp}
                onEndreNavn={endreNavn}
                onFjern={fjernKategori}
                kanFjernes={state.kategorier.length > 1}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={leggTilKategori}
              className="gap-1.5"
            >
              <PlusIcon size={14} />
              Legg til kategori
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nullstillFordeling}
              className="text-muted-foreground"
            >
              Nullstill fordeling
            </Button>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Oppsummering
            </p>
            <div className="space-y-2">
              {state.kategorier
                .filter((k) => k.prosent > 0)
                .map((k) => (
                  <div key={k.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: k.farge }}
                        aria-hidden
                      />
                      <span className="text-foreground">{k.navn || "Uten navn"}</span>
                    </div>
                    <span className="tabular-nums text-sm font-medium">
                      {formatKr(Math.round(state.beløp * k.prosent / 100))}
                    </span>
                  </div>
                ))}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Totalt</span>
              <span className="tabular-nums text-sm font-bold">{formatKr(state.beløp)}</span>
            </div>
          </div>

          {/* Privacy notice */}
          <p className="text-xs text-muted-foreground/70">
            Dataene dine lagres kun lokalt i nettleseren din. Ingenting sendes til noen server.
          </p>
        </div>
      )}
    </div>
  )
}

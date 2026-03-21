import { useRef, useState } from "react"
import { ArrowCounterClockwiseIcon, ArrowRightIcon, LockOpenIcon, PlusIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
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
  ufordeltKr: number
}

function FordelingsBar({ kategorier, ufordeltKr }: FordelingsBarProps) {
  const synlige = kategorier.filter((k) => k.prosent > 0)
  const ufordeltProsent = 100 - kategorier.reduce((s, k) => s + k.prosent, 0)

  return (
    // The bar is always full-width. Colored segments take their share,
    // and the grey remainder segment (flex-1) fills whatever is left —
    // this works for all cases: fully allocated, partially allocated, and
    // float over-allocation (flex naturally clamps the remainder to 0).
    <div className="flex h-7 w-full overflow-hidden rounded-lg">
      {synlige.map((k, i) => {
        const erFørste = i === 0
        // Round only for display — internal prosent stays float for kr precision
        const prosDisplay = Math.round(k.prosent)
        const visLabel = k.prosent >= 8

        return (
          <div
            key={k.id}
            className="relative flex items-center justify-center overflow-hidden transition-all duration-200"
            style={{
              width: `${k.prosent}%`,
              backgroundColor: k.farge,
              borderRadius: erFørste ? "0.5rem 0 0 0.5rem" : undefined,
            }}
            title={`${k.navn || "Uten navn"} — ${prosDisplay}%`}
          >
            {visLabel && (
              <span className="truncate px-1 text-[10px] font-semibold text-white/90">
                {prosDisplay}%
              </span>
            )}
          </div>
        )
      })}

      {/* Grey remainder — flex-1 so it always fills the remaining width.
          Label rules: >= 25% segment AND sm: breakpoint → full text;
          >= 5% segment → "?" (fits a single char); < 5% → no label. */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden bg-muted transition-all duration-200"
        style={{
          borderRadius: synlige.length === 0 ? "0.5rem" : "0 0.5rem 0.5rem 0",
        }}
        title={ufordeltKr > 0 ? `${formatKr(ufordeltKr)} gjenstår` : undefined}
      >
        {ufordeltProsent >= 5 && (
          <span className="truncate px-1 text-[10px] font-semibold text-foreground/50">
            {/* Full text: only when segment is wide (>= 25%) AND screen is sm+ */}
            {ufordeltProsent >= 25 && (
              <span className="hidden sm:inline">{formatKr(ufordeltKr)} gjenstår</span>
            )}
            {/* Question mark: fallback when full text is hidden */}
            <span className={ufordeltProsent >= 25 ? "sm:hidden" : ""}>?</span>
          </span>
        )}
      </div>
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
  // step=1 so the slider can hit any exact kr value; precision typing is available via click-to-edit

  // Inline editing of the kr value — clicking the number opens a text input
  const [redigerer, setRedigerer] = useState(false)
  const [draft, setDraft] = useState("")
  const redigerInputRef = useRef<HTMLInputElement>(null)

  function startRedigering() {
    if (!harBeløp) return
    setDraft(String(krVerdi))
    setRedigerer(true)
    // Let the input mount before selecting its content
    setTimeout(() => redigerInputRef.current?.select(), 0)
  }

  function commitRedigering() {
    const parsed = parseInt(draft.replace(/\s/g, "").replace(/,/g, ""), 10)
    if (!isNaN(parsed) && parsed >= 0 && beløp > 0) {
      const nyProsent = Math.min(parsed, beløp) / beløp * 100
      onEndreProsent(kategori.id, nyProsent)
    }
    setRedigerer(false)
  }

  // Convert a kr slider value to a float percent and dispatch.
  // Keeping full float precision means Math.round(beløp * prosent / 100)
  // recovers the exact dragged kr value rather than snapping to beløp/100 steps.
  function handleSliderChange(krNy: number) {
    if (harBeløp) {
      onEndreProsent(kategori.id, krNy / beløp * 100)
    } else {
      onEndreProsent(kategori.id, krNy)
    }
  }

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

      {/* Editable value — click to type an exact kr amount */}
      {redigerer ? (
        <div className="relative inline-flex items-baseline gap-1">
          <input
            ref={redigerInputRef}
            type="text"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRedigering}
            onKeyDown={(e) => {
              // Trigger blur on Enter so onBlur handles the single commit path —
              // avoids double-calling commitRedigering (which would re-redistribute)
              if (e.key === "Enter") e.currentTarget.blur()
              if (e.key === "Escape") setRedigerer(false)
            }}
            className="w-36 bg-transparent text-xl font-bold tabular-nums text-foreground outline-none border-b-2 border-primary"
            aria-label={`Beløp for ${kategori.navn || "kategori"}`}
          />
          <span className="text-sm text-muted-foreground">kr</span>
        </div>
      ) : (
        <button
          onClick={harBeløp ? startRedigering : undefined}
          className={[
            "text-xl font-bold tabular-nums text-left",
            harBeløp
              ? "cursor-text text-foreground hover:text-primary transition-colors"
              : "cursor-default text-foreground",
          ].join(" ")}
          title={harBeløp ? "Klikk for å skrive inn et eksakt beløp" : undefined}
        >
          {harBeløp ? formatKr(krVerdi) : `${kategori.prosent}%`}
        </button>
      )}

      {/* Kr-based slider (step adapts to amount for clean increments) */}
      <Slider
        value={[harBeløp ? krVerdi : kategori.prosent]}
        min={0}
        max={harBeløp ? beløp : 100}
        step={1}
        onValueChange={([v]) => handleSliderChange(v)}
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

  // Kr remaining after all categories are allocated. Uses Math.round per category so
  // the result matches what the user sees in the summary (same rounding as display).
  const fordeltKr = state.kategorier.reduce(
    (s, k) => s + Math.round(state.beløp * k.prosent / 100),
    0
  )
  const ufordeltKr = state.beløp - fordeltKr

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
        {/* Input + button inline — button stays visible for re-running with a new amount */}
        <div className="flex items-center gap-2">
          <div className="relative w-40 sm:w-48">
            <Input
              id="beløp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="f.eks. 50 000"
              autoComplete="off"
              value={beløpDraft}
              onChange={(e) => setBeløpDraft(e.target.value)}
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
          <Button
            onClick={() => commitBeløp(beløpDraft)}
            disabled={parseBeløp(beløpDraft) === 0}
          >
            Se fordeling
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>

      {/* Distribution section — only visible once an amount is entered */}
      {harBeløp && (
        <div className="space-y-8">

          {/* Distribution bar + reset — reset lives here so it's close to
              the thing it affects and doesn't require scrolling past all sliders */}
          <div className="space-y-2">
            <FordelingsBar kategorier={state.kategorier} ufordeltKr={ufordeltKr} />
            <Button
              variant="outline"
              size="sm"
              onClick={nullstillFordeling}
              className="gap-1.5"
            >
              <ArrowCounterClockwiseIcon size={13} />
              Tilbakestill fordeling
            </Button>
          </div>

          {/* Alert: shown only when there are unallocated kr */}
          {ufordeltKr > 0 && (
            <Alert>
              <WarningIcon size={16} />
              <AlertTitle>{formatKr(ufordeltKr)} er ikke fordelt ennå.</AlertTitle>
              <AlertDescription>
                Lås opp en kategori eller juster en slider for å fordele resten.
              </AlertDescription>
            </Alert>
          )}

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
            {/* Unallocated row — only shown when kr remain */}
            {ufordeltKr > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden />
                  <span className="text-muted-foreground">Ikke fordelt</span>
                </div>
                <span className="tabular-nums text-sm font-medium text-muted-foreground">
                  {formatKr(ufordeltKr)}
                </span>
              </div>
            )}
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

import { useRef, useState } from "react"
import { ArrowCounterClockwiseIcon, ArrowRightIcon, CheckCircle, PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { formatKr } from "@/lib/formatering"
import { useUventetSumState } from "@/hooks/useUventetSumState"
import type { UventetSumKategori } from "@/types/uventet-sum"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseBeløp(str: string): number {
  const renset = str.replace(/\s/g, "").replace(/,/g, "")
  const tall = parseInt(renset, 10)
  return isNaN(tall) || tall < 0 ? 0 : tall
}

function avrundTilNærmeste100(n: number): number {
  return Math.round(n / 100) * 100
}

// ---------------------------------------------------------------------------
// Distribution bar
// ---------------------------------------------------------------------------

interface FordelingsBarProps {
  kategorier: UventetSumKategori[]
  beløp: number
  tilgjengeligKr: number
}

function FordelingsBar({ kategorier, beløp, tilgjengeligKr }: FordelingsBarProps) {
  const synlige = kategorier.filter((k) => k.kr > 0)
  const tilgjengeligProsent = (tilgjengeligKr / beløp) * 100

  return (
    <div className="flex h-7 w-full overflow-hidden rounded-lg">
      {synlige.map((k, i) => {
        const bredde = (k.kr / beløp) * 100
        const erFørste = i === 0
        const visLabel = bredde >= 8

        return (
          <div
            key={k.id}
            className="relative flex items-center justify-center overflow-hidden transition-all duration-150"
            style={{
              width: `${bredde}%`,
              backgroundColor: k.farge,
              borderRadius: erFørste ? "0.5rem 0 0 0.5rem" : undefined,
            }}
            title={`${k.navn || "Uten navn"} — ${formatKr(k.kr)}`}
          >
            {visLabel && (
              <span className="truncate px-1 text-[10px] font-semibold text-white/90">
                {Math.round(bredde)}%
              </span>
            )}
          </div>
        )
      })}

      {/* Grey remainder — represents unallocated funds */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden bg-muted transition-all duration-150"
        style={{
          borderRadius: synlige.length === 0 ? "0.5rem" : "0 0.5rem 0.5rem 0",
        }}
        title={tilgjengeligKr > 0 ? `${formatKr(tilgjengeligKr)} gjenstår` : undefined}
      >
        {tilgjengeligProsent >= 5 && (
          <span className="truncate px-1 text-[10px] font-semibold text-foreground/50">
            {tilgjengeligProsent >= 25 && (
              <span className="hidden sm:inline">{formatKr(tilgjengeligKr)} gjenstår</span>
            )}
            <span className={tilgjengeligProsent >= 25 ? "sm:hidden" : ""}>?</span>
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pedagogical available-funds display
// ---------------------------------------------------------------------------

interface TilgjengeligDisplayProps {
  tilgjengeligKr: number
  beløp: number
}

function TilgjengeligDisplay({ tilgjengeligKr, beløp }: TilgjengeligDisplayProps) {
  const altFordelt = tilgjengeligKr === 0

  if (altFordelt) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg bg-[oklch(0.62_0.15_140)]/10 px-4 py-3">
        <CheckCircle size={18} className="shrink-0 text-[oklch(0.62_0.15_140)]" />
        <div>
          <p className="text-sm font-medium text-foreground">Alt er fordelt</p>
          <p className="text-xs text-muted-foreground">
            Du har fordelt alle {formatKr(beløp)}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
      <p className="text-sm text-muted-foreground">Gjenstår å fordele</p>
      <p className="text-lg font-bold tabular-nums text-foreground">{formatKr(tilgjengeligKr)}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Category row
// ---------------------------------------------------------------------------

interface KategoriRadProps {
  kategori: UventetSumKategori
  beløp: number
  onEndreKr: (id: string, kr: number) => void
  onEndreNavn: (id: string, navn: string) => void
  onFjern: (id: string) => void
  kanFjernes: boolean
}

function KategoriRad({
  kategori,
  beløp,
  onEndreKr,
  onEndreNavn,
  onFjern,
  kanFjernes,
}: KategoriRadProps) {
  const [redigerer, setRedigerer] = useState(false)
  const [draft, setDraft] = useState("")
  const redigerInputRef = useRef<HTMLInputElement>(null)

  function startRedigering() {
    setDraft(String(kategori.kr))
    setRedigerer(true)
    setTimeout(() => redigerInputRef.current?.select(), 0)
  }

  function commitRedigering() {
    const parsed = parseInt(draft.replace(/\s/g, "").replace(/,/g, ""), 10)
    if (!isNaN(parsed) && parsed >= 0) {
      onEndreKr(kategori.id, avrundTilNærmeste100(Math.min(parsed, beløp)))
    }
    setRedigerer(false)
  }

  return (
    <div className="space-y-2">
      {/* Header: color dot + name input + delete button */}
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
        {kanFjernes && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onFjern(kategori.id)}
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Fjern ${kategori.navn || "kategori"}`}
          >
            <TrashIcon size={14} />
          </Button>
        )}
      </div>

      {/* Editable kr value */}
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
          onClick={startRedigering}
          className="text-xl font-bold tabular-nums text-left cursor-text text-foreground hover:text-primary transition-colors"
          title="Klikk for å skrive inn et eksakt beløp"
        >
          {formatKr(kategori.kr)}
        </button>
      )}

      <Slider
        value={[kategori.kr]}
        min={0}
        max={beløp}
        step={100}
        onValueChange={([v]) => onEndreKr(kategori.id, v)}
        aria-label={`Fordeling for ${kategori.navn || "kategori"}`}
      />

      {/* Slider end labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0 kr</span>
        <span>{formatKr(beløp)}</span>
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
    endreKr,
    endreNavn,
    leggTilKategori,
    fjernKategori,
    nullstillFordeling,
  } = useUventetSumState()

  const [beløpDraft, setBeløpDraft] = useState(
    state.beløp > 0 ? String(state.beløp) : ""
  )

  const harBeløp = state.beløp > 0

  const fordeltKr = state.kategorier.reduce((s, k) => s + k.kr, 0)
  const tilgjengeligKr = state.beløp - fordeltKr

  function commitBeløp(raw: string) {
    const parsed = parseBeløp(raw)
    const rundet = parsed > 0 ? avrundTilNærmeste100(parsed) : 0
    setBeløp(rundet)
    setBeløpDraft(rundet > 0 ? String(rundet) : "")
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
          Her har du en mulighet til å gjøre framtids-deg en tjeneste. Ikke vent
          til pengene nesten er brukt opp før du setter av noe til sparing. Start
          her med å velge hvor mye som skal gå til hvert formål, og sett av en
          dedikert sum til hygge (også kjent som guiltfree spending).
        </p>
      </div>

      {/* Amount input */}
      <div className="mb-8 space-y-2">
        <label htmlFor="beløp-input" className="text-sm font-medium">
          Hvor mye har du fått?
        </label>
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
            Start fordeling
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          For enkelhets skyld runder vi av summen til nærmeste hundre kroner.
        </p>
      </div>

      {/* Distribution section — only visible once an amount is entered */}
      {harBeløp && (
        <div className="space-y-8">

          {/* Available-funds display */}
          <TilgjengeligDisplay tilgjengeligKr={tilgjengeligKr} beløp={state.beløp} />

          {/* Distribution bar + reset */}
          <div className="space-y-2">
            <FordelingsBar
              kategorier={state.kategorier}
              beløp={state.beløp}
              tilgjengeligKr={tilgjengeligKr}
            />
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

          {/* Category sliders */}
          <div className="space-y-6">
            {state.kategorier.map((kat) => (
              <KategoriRad
                key={kat.id}
                kategori={kat}
                beløp={state.beløp}
                onEndreKr={endreKr}
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
                .filter((k) => k.kr > 0)
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
                    <span className="tabular-nums text-sm font-medium">{formatKr(k.kr)}</span>
                  </div>
                ))}
            </div>
            {tilgjengeligKr > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden />
                  <span className="text-muted-foreground">Ikke fordelt</span>
                </div>
                <span className="tabular-nums text-sm font-medium text-muted-foreground">
                  {formatKr(tilgjengeligKr)}
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
            Tallene lagres ikke eksternt hos noen store, shady selskaper. Det lagres bare lokalt der du ser på nettsida.
          </p>
        </div>
      )}
    </div>
  )
}

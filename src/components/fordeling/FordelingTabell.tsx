import { useState, useId, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { KATEGORIER } from "@/lib/kategorier"
import { formatKr, formaterTidshorisont } from "@/lib/formatering"
import {
  beregnKrPerUke,
  beregnMånederTilMål,
  sliderMin,
  sliderMax,
} from "@/lib/beregninger"
import type { PostId, PostState, Kategori } from "@/types/fordeling"

interface FordelingTabellProps {
  lønn: number
  poster: Record<PostId, PostState>
  activePost: PostId | null
  onSelectPost: (id: PostId | null) => void
  onEndrePost: (id: PostId, verdi: number) => void
  onEndreFasteUtgifter: (verdi: number) => void
  onTilbakestill: () => void
  onBekreft: () => void
}

// ─── FasteUtgifter input ───────────────────────────────────────────────────

function parseNummer(str: string): number | null {
  const renset = str.replace(/\s/g, "").replace(/,/g, "")
  const tall = parseInt(renset, 10)
  return isNaN(tall) ? null : tall
}

// Controlled input for fasteUtgifter that uses a local draft string so the
// field stays editable while typing, but only flushes on blur or Enter.
// This avoids the "input won't update after Tilbakestill" bug with defaultValue.
function FasteUtgifterInput({
  månedlig,
  lønn,
  onChange,
}: {
  månedlig: number
  lønn: number
  onChange: (ny: number) => void
}) {
  const [draft, setDraft] = useState(() => String(månedlig))

  // Flush draft to parent state on blur or Enter
  function flush() {
    const ny = parseNummer(draft)
    if (ny && ny > 0 && ny < lønn) {
      onChange(ny)
    } else {
      // Reset to last valid value if input is out of range
      setDraft(String(månedlig))
    }
  }

  // Sync draft when monthly amount changes from outside (e.g. Tilbakestill)
  // We compare to avoid resetting mid-edit
  const prevMånedlig = useRef(månedlig)
  if (prevMånedlig.current !== månedlig) {
    prevMånedlig.current = månedlig
    setDraft(String(månedlig))
  }

  return (
    <div className="relative w-[120px]">
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={flush}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur()
          }
        }}
        className="pr-8 text-right tabular-nums"
        aria-label="Faste månedlige utgifter i kroner"
      />
      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
        kr
      </span>
    </div>
  )
}

// ─── Mobile inline expansion ───────────────────────────────────────────────

// Shows a full-width slider + contextual info when a mobile row is tapped.
// Uses grid-template-rows animation (0fr → 1fr) to avoid max-height snap.
function MobileEkspansjon({
  kat,
  post,
  lønn,
  onEndrePost,
  onEndreFasteUtgifter,
  sliderId,
}: {
  kat: Kategori
  post: PostState
  lønn: number
  onEndrePost: (verdi: number) => void
  onEndreFasteUtgifter: (verdi: number) => void
  sliderId: string
}) {
  const månedlig = post.månedlig ?? 0
  // Local optimistic display value — updated immediately on drag
  const [visVerdi, setVisVerdi] = useState(månedlig)

  // Sync with external state (e.g. after Tilbakestill or another post change)
  const prevMånedlig = useRef(månedlig)
  if (prevMånedlig.current !== månedlig && visVerdi === prevMånedlig.current) {
    prevMånedlig.current = månedlig
    setVisVerdi(månedlig)
  } else {
    prevMånedlig.current = månedlig
  }

  const min = sliderMin()
  const max = sliderMax(lønn, kat.sliderMaxFaktor ?? 0.2)

  return (
    <div className="px-4 pb-4 space-y-4 border-t border-border">
      {kat.inputType === "tekst" ? (
        <div className="pt-3 space-y-1.5">
          <label className="text-sm font-medium">Månedlige faste utgifter</label>
          <FasteUtgifterInput
            månedlig={månedlig}
            lønn={lønn}
            onChange={onEndreFasteUtgifter}
          />
        </div>
      ) : (
        <div className="pt-3 space-y-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tabular-nums">{formatKr(visVerdi)}</span>
            <span className="text-sm text-muted-foreground">/mnd</span>
          </div>
          <Slider
            id={sliderId}
            value={[visVerdi]}
            min={min}
            max={max}
            step={50}
            // Instant visual feedback on drag
            onValueChange={([ny]) => setVisVerdi(ny)}
            // Only propagate to budget redistribution logic when drag ends
            onValueCommit={([ny]) => onEndrePost(ny)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatKr(min)}</span>
            <span>{formatKr(max)}</span>
          </div>
        </div>
      )}

      {/* Contextual explanation */}
      <p className="text-sm text-muted-foreground leading-relaxed">{kat.forklaring}</p>

      {/* Derived stats */}
      {kat.harKrPerUke && (
        <p className="text-xs text-muted-foreground">
          Ca. <span className="font-semibold text-foreground">{formatKr(beregnKrPerUke(visVerdi))}</span> per uke
        </p>
      )}
      {kat.harTidshorisont && (post.mål ?? 0) > 0 && (
        <p className="text-xs text-muted-foreground">
          Tid til mål:{" "}
          <span className="font-semibold text-foreground">
            {formaterTidshorisont(beregnMånederTilMål(post.mål!, post.alleredeSpart ?? 0, visVerdi))}
          </span>
        </p>
      )}
      {kat.harPensjonVisning && visVerdi * 12 < 15000 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Under 1 250 kr/mnd utnytter du ikke hele IPS-fradraget
        </p>
      )}
    </div>
  )
}

// ─── Main table ────────────────────────────────────────────────────────────

export function FordelingTabell({
  lønn,
  poster,
  activePost,
  onSelectPost,
  onEndrePost,
  onEndreFasteUtgifter,
  onTilbakestill,
  onBekreft,
}: FordelingTabellProps) {
  const baseId = useId()
  // Track which row is expanded on mobile (mutually exclusive)
  const [mobileExpanded, setMobileExpanded] = useState<PostId | null>(null)

  // Sum of all posts for footer display
  const fordeltTotal = KATEGORIER.reduce(
    (sum, k) => sum + (poster[k.id]?.månedlig ?? 0),
    0
  )
  const gjenstår = lønn - fordeltTotal
  const erBalansert = Math.abs(gjenstår) < 10  // within rounding tolerance

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Table: CSS grid with semantic ARIA roles */}
      <div role="table" aria-label="Budsjettfordeling">

        {/* Header row */}
        <div
          role="row"
          className="hidden lg:grid grid-cols-[4px_1fr_auto_auto_minmax(0,200px)] items-center gap-x-4 px-4 py-2 border-b border-border bg-muted/40"
        >
          <div role="columnheader" aria-label="Kategori-farge" />
          <div role="columnheader" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Kategori
          </div>
          <div role="columnheader" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
            Beløp/mnd
          </div>
          <div role="columnheader" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
            Andel
          </div>
          <div role="columnheader" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Juster
          </div>
        </div>

        {/* Data rows */}
        {KATEGORIER.map((kat) => {
          const post = poster[kat.id]
          const månedlig = post?.månedlig ?? 0
          const prosent = lønn > 0 ? Math.round((månedlig / lønn) * 100) : 0
          const erAktiv = activePost === kat.id
          const sliderId = `${baseId}-slider-${kat.id}`
          const navnId = `${baseId}-navn-${kat.id}`

          // Local optimistic value for desktop slider — updates on drag,
          // commits to state only on drag-end (onValueCommit)
          const [visVerdi, setVisVerdi] = useState(månedlig)
          const prevMånedlig = useRef(månedlig)
          if (prevMånedlig.current !== månedlig && visVerdi === prevMånedlig.current) {
            prevMånedlig.current = månedlig
            setVisVerdi(månedlig)
          } else {
            prevMånedlig.current = månedlig
          }

          const min = sliderMin()
          const max = sliderMax(lønn, kat.sliderMaxFaktor ?? 0.2)

          // Toggle mobile expansion
          function handleMobileToggle() {
            setMobileExpanded((prev) => (prev === kat.id ? null : kat.id))
          }

          return (
            <Collapsible
              key={kat.id}
              open={mobileExpanded === kat.id}
              onOpenChange={handleMobileToggle}
            >
              <div
                role="row"
                className={[
                  "border-b border-border last:border-b-0 transition-colors",
                  erAktiv ? "bg-muted/30" : "hover:bg-muted/20",
                ].join(" ")}
              >
                {/* Main row content */}
                <div className="grid grid-cols-[8px_1fr_auto_auto] lg:grid-cols-[8px_1fr_auto_auto_minmax(0,200px)] items-center gap-x-4 px-4 py-3">

                  {/* Color stripe — wider when active */}
                  <div
                    role="cell"
                    className="self-stretch rounded-full transition-[width] duration-200"
                    style={{
                      backgroundColor: kat.farge,
                      width: erAktiv ? "6px" : "4px",
                    }}
                  />

                  {/* Category name — clickable to open panel (desktop) or expand (mobile) */}
                  <div role="rowheader" id={navnId} className="min-w-0">
                    {/* Desktop: clicking name opens side panel */}
                    <button
                      type="button"
                      onClick={() => onSelectPost(erAktiv ? null : kat.id)}
                      className="hidden lg:block text-left w-full"
                    >
                      <span className="text-sm font-medium">{kat.navn}</span>
                      <span className="block text-xs text-muted-foreground truncate mt-0.5">
                        {kat.beskrivelse}
                      </span>
                    </button>
                    {/* Mobile: clicking name expands inline */}
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="lg:hidden text-left w-full"
                      >
                        <span className="text-sm font-medium">{kat.navn}</span>
                        <span className="block text-xs text-muted-foreground truncate mt-0.5">
                          {kat.beskrivelse}
                        </span>
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  {/* Amount — monospace, right-aligned */}
                  <div
                    role="cell"
                    className="text-right pointer-events-none"
                    aria-label={`${formatKr(månedlig)} per måned`}
                  >
                    <span className="text-sm font-semibold tabular-nums font-mono">
                      {formatKr(månedlig)}
                    </span>
                    <span className="text-xs text-muted-foreground">/mnd</span>
                  </div>

                  {/* Share % — muted, right-aligned */}
                  <div
                    role="cell"
                    className="text-right text-sm text-muted-foreground tabular-nums pointer-events-none"
                    aria-label={`${prosent} prosent av lønnen`}
                  >
                    {prosent}%
                  </div>

                  {/* Adjust control — desktop only */}
                  <div role="cell" className="hidden lg:block">
                    {kat.inputType === "tekst" ? (
                      <FasteUtgifterInput
                        månedlig={månedlig}
                        lønn={lønn}
                        onChange={onEndreFasteUtgifter}
                      />
                    ) : (
                      <Slider
                        id={sliderId}
                        value={[visVerdi]}
                        min={min}
                        max={max}
                        step={50}
                        onValueChange={([ny]) => setVisVerdi(ny)}
                        onValueCommit={([ny]) => onEndrePost(kat.id, ny)}
                        aria-labelledby={navnId}
                      />
                    )}
                  </div>
                </div>

                {/* Mobile inline expansion */}
                <CollapsibleContent className="lg:hidden data-[state=open]:animate-none overflow-hidden">
                  {/* grid-template-rows animation: 0fr → 1fr avoids max-height snap */}
                  <MobileEkspansjon
                    kat={kat}
                    post={post}
                    lønn={lønn}
                    onEndrePost={(verdi) => onEndrePost(kat.id, verdi)}
                    onEndreFasteUtgifter={onEndreFasteUtgifter}
                    sliderId={sliderId}
                  />
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}

        {/* Footer row: totals */}
        <div
          role="row"
          className="grid grid-cols-[8px_1fr_auto_auto] lg:grid-cols-[8px_1fr_auto_auto_minmax(0,200px)] items-center gap-x-4 px-4 py-3 bg-muted/30 border-t border-border"
        >
          <div role="cell" />
          <div role="cell" className="text-sm font-semibold">Fordelt</div>
          <div
            role="cell"
            className={[
              "text-right text-sm font-semibold tabular-nums font-mono",
              erBalansert ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
            ].join(" ")}
          >
            {formatKr(fordeltTotal)}
          </div>
          <div
            role="cell"
            className={[
              "text-right text-xs tabular-nums",
              gjenstår === 0
                ? "text-muted-foreground"
                : gjenstår < 0
                  ? "text-destructive"
                  : "text-muted-foreground",
            ].join(" ")}
          >
            {gjenstår > 0
              ? `${formatKr(gjenstår)} gjenstår`
              : gjenstår < 0
                ? `${formatKr(Math.abs(gjenstår))} over`
                : ""}
          </div>
          <div role="cell" className="hidden lg:block" />
        </div>

      </div>

      {/* Action row */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 px-4 py-4 border-t border-border">
        <Button variant="outline" onClick={onTilbakestill}>
          Tilbakestill til forslag
        </Button>
        <Button onClick={onBekreft}>
          Bekreft fordeling <ArrowRightIcon />
        </Button>
      </div>

    </div>
  )
}

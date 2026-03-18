import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { XIcon, WarningIcon } from "@phosphor-icons/react"
import { KATEGORIER } from "@/lib/kategorier"
import { formatKr, formaterTidshorisont } from "@/lib/formatering"
import {
  beregnKrPerUke,
  beregnMånederTilMål,
} from "@/lib/beregninger"
import type { PostId, PostState } from "@/types/fordeling"

interface FordelingPanelProps {
  post: PostId | null
  lønn: number
  poster: Record<PostId, PostState>
  onClose: () => void
  onEndreMål: (id: PostId, verdi: number | null) => void
  onEndreAlleredeSpart: (id: PostId, verdi: number) => void
}

function parseNummer(str: string): number | null {
  const renset = str.replace(/\s/g, "").replace(/,/g, "")
  const tall = parseInt(renset, 10)
  return isNaN(tall) ? null : tall
}

// Controlled number input that flushes to state only on blur or Enter.
// Syncs draft when the external value changes (e.g. after Tilbakestill).
function NumberInput({
  value,
  placeholder,
  ariaLabel,
  onChange,
}: {
  value: number | null | undefined
  placeholder: string
  ariaLabel: string
  onChange: (ny: number | null) => void
}) {
  const [draft, setDraft] = useState(() => (value ? String(value) : ""))
  const prevValue = useRef(value)

  if (prevValue.current !== value) {
    prevValue.current = value
    setDraft(value ? String(value) : "")
  }

  function flush() {
    const parsed = parseNummer(draft)
    onChange(parsed && parsed > 0 ? parsed : null)
  }

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={placeholder}
        autoComplete="off"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={flush}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
        }}
        className="pr-8"
        aria-label={ariaLabel}
      />
      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
        kr
      </span>
    </div>
  )
}

export function FordelingPanel({
  post: activePostId,
  lønn,
  poster,
  onClose,
  onEndreMål,
  onEndreAlleredeSpart,
}: FordelingPanelProps) {
  // Focus the close button when the panel opens.
  // This is required so keyboard users aren't left stranded in the main content.
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (activePostId) {
      // Small delay lets the CSS width transition start before we steal focus
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [activePostId])

  // Resolve the active category and post state
  const kat = activePostId ? KATEGORIER.find((k) => k.id === activePostId) : null
  const post: PostState | undefined = activePostId ? poster[activePostId] : undefined
  const månedlig = post?.månedlig ?? 0
  const prosent = lønn > 0 ? Math.round((månedlig / lønn) * 100) : 0

  // Progress towards savings goal
  const spareProsent =
    kat?.harTidshorisont && (post?.mål ?? 0) > 0
      ? Math.min(100, Math.round(((post?.alleredeSpart ?? 0) / post!.mål!) * 100))
      : 0

  const månederTilMål =
    kat?.harTidshorisont && (post?.mål ?? 0) > 0
      ? beregnMånederTilMål(post!.mål!, post?.alleredeSpart ?? 0, månedlig)
      : null

  return (
    // The panel slides in/out by animating its width.
    // overflow-hidden ensures content doesn't bleed out during the animation.
    // will-change: width hints to the browser to prepare the compositing layer.
    <div
      className="transition-[width] duration-300 ease-in-out overflow-hidden border-l border-border bg-card shrink-0"
      style={{
        width: activePostId ? "var(--panel-width, 300px)" : "0px",
        willChange: "width",
      }}
      // lg: 300px, xl: 360px — set via CSS custom property below
    >
      {/* Panel content — kept in DOM when closed so the slide-out animation
          has content to show. Pointer events disabled when hidden. */}
      <div
        className={[
          "w-[300px] xl:w-[360px] flex flex-col h-full",
          activePostId ? "" : "pointer-events-none",
        ].join(" ")}
        // Match the CSS custom property to the actual rendered width
        style={{ ["--panel-width" as string]: kat ? undefined : "0px" }}
      >
        {kat && post ? (
          <>
            {/* ─── Panel header ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              {/* Category color stripe */}
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ backgroundColor: kat.farge }}
              />
              <h2 className="flex-1 text-sm font-semibold">{kat.navn}</h2>
              <Button
                ref={closeButtonRef}
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Lukk panel"
                className="shrink-0 -mr-2"
              >
                <XIcon size={18} />
              </Button>
            </div>

            {/* ─── Scrollable content ───────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Large amount + percentage */}
              <div>
                <p className="text-4xl font-extrabold tabular-nums leading-none">
                  {formatKr(månedlig)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {prosent}% av lønnen · {formatKr(lønn * 12 / 12 - månedlig)} igjen til andre poster
                </p>
              </div>

              {/* Goal progress (buffer, ferie, storeLivshendelser) */}
              {kat.harTidshorisont && (post.mål ?? 0) > 0 && (
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Spart</span>
                    <span className="tabular-nums">
                      {formatKr(post.alleredeSpart ?? 0)} av {formatKr(post.mål!)}
                    </span>
                  </div>
                  <Progress value={spareProsent} className="h-1.5" />
                  {månederTilMål !== null && (
                    <p className="text-xs text-muted-foreground text-right">
                      {formaterTidshorisont(månederTilMål)} til mål
                    </p>
                  )}
                </div>
              )}

              <Separator />

              {/* Explanation */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Om denne posten
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {kat.forklaring}
                </p>
              </div>

              <Separator />

              {/* Key figures — derived stats from beregninger.ts */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nøkkeltall
                </p>

                {/* Guilt-free: weekly amount */}
                {kat.harKrPerUke && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">Ca. per uke</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatKr(beregnKrPerUke(månedlig))}
                    </span>
                  </div>
                )}

                {/* Pension: annual amount + IPS warning */}
                {kat.harPensjonVisning && (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Pr. år</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatKr(månedlig * 12)}
                      </span>
                    </div>
                    {månedlig * 12 < 15000 && (
                      <div className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
                        <WarningIcon size={14} className="mt-0.5 shrink-0" />
                        <p className="text-xs leading-relaxed">
                          Under 1 250 kr/mnd utnytter du ikke hele IPS-fradraget (15 000 kr/år)
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Goals with time horizon */}
                {kat.harTidshorisont && månederTilMål !== null && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">Tid til mål</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formaterTidshorisont(månederTilMål)}
                    </span>
                  </div>
                )}
              </div>

              {/* Hint box with category-colored left border */}
              <div
                className="rounded-lg bg-muted/30 px-4 py-3 border-l-4"
                style={{ borderLeftColor: kat.farge }}
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {kat.beskrivelse}
                </p>
              </div>

              {/* Goal input (storeLivshendelser) */}
              {kat.harMålInput && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Hva er målet ditt?</label>
                  <NumberInput
                    value={post.mål}
                    placeholder="f.eks. 150000"
                    ariaLabel="Sparemål i kroner"
                    onChange={(verdi) => onEndreMål(kat.id, verdi)}
                  />
                </div>
              )}

              {/* Already saved input */}
              {kat.harAlleredeSpart && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Allerede spart</label>
                  <NumberInput
                    value={post.alleredeSpart}
                    placeholder="0"
                    ariaLabel="Allerede spart beløp i kroner"
                    onChange={(verdi) => onEndreAlleredeSpart(kat.id, verdi ?? 0)}
                  />
                </div>
              )}

            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

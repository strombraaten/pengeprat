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
  // Separate refs for desktop and mobile close buttons so focus targets
  // the visible button based on the current viewport width.
  const desktopCloseRef = useRef<HTMLButtonElement>(null)
  const mobileCloseRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (activePostId) {
      const timer = setTimeout(() => {
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches
        const ref = isDesktop ? desktopCloseRef : mobileCloseRef
        ref.current?.focus()
      }, 50)
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

  // Renders the panel header + scrollable body. Accepts a ref for the
  // close button so focus management works in both desktop and mobile contexts.
  function renderContent(closeButtonRef: React.RefObject<HTMLButtonElement | null>) {
    if (!kat || !post) return null
    return (
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
    )
  }

  return (
    <>
      {/* ── Desktop: side panel (lg+) ─────────────────────────────────────
          Width is controlled via Tailwind responsive classes directly on the
          outer div — not a CSS custom property — so the inner div can safely
          use w-full without any mismatch causing overflow-hidden clipping. */}
      <div
        className={[
          "hidden lg:block transition-[width] duration-300 ease-in-out overflow-hidden border-l border-border bg-card shrink-0",
          activePostId ? "lg:w-[360px] xl:w-[440px]" : "w-0",
        ].join(" ")}
        style={{ willChange: "width" }}
      >
        <div
          className={[
            "w-full flex flex-col h-full",
            activePostId ? "" : "pointer-events-none",
          ].join(" ")}
        >
          {renderContent(desktopCloseRef)}
        </div>
      </div>

      {/* ── Mobile: bottom sheet (<lg) ────────────────────────────────────
          Fixed overlay that slides up from the bottom. The backdrop closes
          the panel on tap. pointer-events-none when closed prevents invisible
          tap targets from blocking the underlying UI. */}
      <div
        className={[
          "lg:hidden fixed inset-0 z-50 flex flex-col justify-end",
          activePostId ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!activePostId}
      >
        {/* Backdrop — fades in/out */}
        <div
          className={[
            "absolute inset-0 bg-black/50 transition-opacity duration-300",
            activePostId ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={onClose}
        />

        {/* Sheet — slides up from the bottom */}
        <div
          className={[
            "relative bg-card border-t border-border rounded-t-2xl",
            "max-h-[85svh] flex flex-col w-full",
            "transition-transform duration-300 ease-in-out",
            activePostId ? "translate-y-0" : "translate-y-full",
          ].join(" ")}
        >
          {renderContent(mobileCloseRef)}
        </div>
      </div>
    </>
  )
}

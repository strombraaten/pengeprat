import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TooltipProvider } from "@/components/ui/tooltip"
import { formatKr } from "@/lib/formatering"
import { parseBeløp } from "@/lib/tall"
import { lesUtgifterTotal } from "@/lib/utgifter-storage"
import { FordelingBar } from "./FordelingBar"
import { FordelingTabell } from "./FordelingTabell"
import { FordelingPanel } from "./FordelingPanel"
import type { PostId, PostState } from "@/types/fordeling"

interface FordelingDashboardProps {
  lønn: number
  poster: Record<PostId, PostState>
  onEndrePost: (postId: PostId, nyVerdi: number) => void
  onEndreFasteUtgifter: (nyVerdi: number) => void
  onEndreAlleredeSpart: (postId: PostId, verdi: number) => void
  onEndreMål: (postId: PostId, verdi: number | null) => void
  onTilbakestill: () => void
  onEndreLønn: (nyLønn: number) => void
  onBekreft: () => void
}

export function FordelingDashboard({
  lønn,
  poster,
  onEndrePost,
  onEndreFasteUtgifter,
  onEndreAlleredeSpart,
  onEndreMål,
  onTilbakestill,
  onEndreLønn,
  onBekreft,
}: FordelingDashboardProps) {
  // Local UI state — which category's side panel is open.
  // Not persisted: resetting to null when user navigates away is correct behavior.
  const [activePost, setActivePost] = useState<PostId | null>(null)
  const [redigererLønn, setRedigererLønn] = useState(false)

  // Kobling til Månedlige utgifter: foreslå summen derfra hvis den avviker
  const [utgifterTotal] = useState(lesUtgifterTotal)
  const fasteNå = poster.fasteUtgifter.månedlig
  const visUtgifterForslag =
    utgifterTotal != null && utgifterTotal < lønn && utgifterTotal !== fasteNå

  return (
    <TooltipProvider>
      {/* Outer flex row: main content (flex-1) + sliding side panel */}
      <div className="flex min-h-[calc(100svh-3.5rem)]">

        {/* ─── Main content column ─────────────────────────────── */}
        <div className="flex-1 min-w-0 p-5 lg:p-8 flex flex-col gap-5">

          {/* Salary header — income on the left, "Endre lønn" alongside */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Fordeling
            </p>
            {redigererLønn ? (
              <LønnRedigering
                lønn={lønn}
                onLagre={(ny) => {
                  onEndreLønn(ny)
                  setRedigererLønn(false)
                }}
                onAvbryt={() => setRedigererLønn(false)}
              />
            ) : (
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-extrabold tabular-nums">
                  {formatKr(lønn)}
                </span>
                <span className="text-sm text-muted-foreground">/ mnd</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRedigererLønn(true)}
                  className="ml-auto lg:ml-0"
                >
                  Endre lønn
                </Button>
              </div>
            )}
          </div>

          {visUtgifterForslag && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                I Månedlige utgifter har du lagt inn{" "}
                <strong className="text-foreground">{formatKr(utgifterTotal)}</strong>,
                men her står det {formatKr(fasteNå)}.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEndreFasteUtgifter(utgifterTotal!)}
              >
                Bruk {formatKr(utgifterTotal)}
              </Button>
            </div>
          )}

          {/* Distribution bar — segments clickable to open/close side panel */}
          <FordelingBar
            lønn={lønn}
            poster={poster}
            activePost={activePost}
            onSelectPost={setActivePost}
          />

          {/* Budget table — inline sliders + row click opens side panel */}
          <FordelingTabell
            lønn={lønn}
            poster={poster}
            activePost={activePost}
            onSelectPost={setActivePost}
            onEndrePost={onEndrePost}
            onEndreFasteUtgifter={onEndreFasteUtgifter}
            onTilbakestill={onTilbakestill}
            onBekreft={onBekreft}
          />

        </div>

        {/* ─── Side panel — desktop sidebar + mobile bottom sheet ─── */}
        {/* FordelingPanel handles both layouts internally */}
        <FordelingPanel
          post={activePost}
          lønn={lønn}
          poster={poster}
          onClose={() => setActivePost(null)}
          onEndreMål={onEndreMål}
          onEndreAlleredeSpart={onEndreAlleredeSpart}
        />

      </div>
    </TooltipProvider>
  )
}

// Lønn redigeres direkte i oversikten. Mål, «allerede spart» og faste
// utgifter du har satt selv beholdes (se tilpassTilNyLønn i beregninger.ts).
function LønnRedigering({
  lønn,
  onLagre,
  onAvbryt,
}: {
  lønn: number
  onLagre: (ny: number) => void
  onAvbryt: () => void
}) {
  const [draft, setDraft] = useState(String(lønn))
  const parsed = parseBeløp(draft)
  const gyldig = parsed !== null && parsed >= 1000

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (gyldig) onLagre(parsed)
      }}
    >
      <div className="relative w-40">
        <Input
          autoFocus
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onAvbryt()
          }}
          className="pr-10 text-lg font-bold tabular-nums"
          aria-label="Månedslønn etter skatt"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
          kr
        </span>
      </div>
      <Button type="submit" size="sm" disabled={!gyldig}>
        Lagre
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onAvbryt}>
        Avbryt
      </Button>
    </form>
  )
}

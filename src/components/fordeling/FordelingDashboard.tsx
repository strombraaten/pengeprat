import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { KATEGORIER } from "@/lib/kategorier"
import { formatKr } from "@/lib/formatering"
import { KategoriSeksjon } from "./KategoriSeksjon"
import { OppsummeringPanel } from "./OppsummeringPanel"
import { FordelingBar } from "./FordelingBar"
import type { PostId, PostState } from "@/types/fordeling"

interface FordelingDashboardProps {
  lønn: number
  poster: Record<PostId, PostState>
  interaksjon: Record<PostId, boolean>
  expandedPost: PostId | null
  onToggleExpanded: (postId: PostId) => void
  onEndrePost: (postId: PostId, nyVerdi: number) => void
  onEndreFasteUtgifter: (nyVerdi: number) => void
  onEndreAlleredeSpart: (postId: PostId, verdi: number) => void
  onEndreMål: (postId: PostId, verdi: number | null) => void
  onTilbakestill: () => void
  onEndreLønn: () => void
  onBekreft: () => void
}

export function FordelingDashboard({
  lønn,
  poster,
  expandedPost,
  onToggleExpanded,
  onEndrePost,
  onEndreFasteUtgifter,
  onEndreAlleredeSpart,
  onEndreMål,
  onTilbakestill,
  onEndreLønn,
  onBekreft,
}: FordelingDashboardProps) {
  return (
    <TooltipProvider>
      <div className="space-y-5">

        {/* Inntekts-header */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Månedsinntekt etter skatt
            </p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {formatKr(lønn)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onEndreLønn}>
            Endre
          </Button>
        </div>

        {/* Fordelingsbar */}
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Fordeling
          </p>
          <FordelingBar lønn={lønn} poster={poster} />
        </div>

        {/* Tokolonnet layout: kategorier venstre, oppsummering høyre */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">

          {/* Venstre: kategoriseksjoner */}
          <div className="space-y-3">
            {KATEGORIER.map((kat) => (
              <KategoriSeksjon
                key={kat.id}
                kat={kat}
                post={poster[kat.id]}
                lønn={lønn}
                isExpanded={expandedPost === kat.id}
                onToggle={() => onToggleExpanded(kat.id)}
                onEndrePost={(nyVerdi) => onEndrePost(kat.id, nyVerdi)}
                onEndreFasteUtgifter={onEndreFasteUtgifter}
                onEndreAlleredeSpart={(verdi) => onEndreAlleredeSpart(kat.id, verdi)}
                onEndreMål={(verdi) => onEndreMål(kat.id, verdi)}
              />
            ))}

            {/* Tilbakestill */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onTilbakestill}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Tilbakestill til forslaget
              </button>
            </div>
          </div>

          {/* Høyre: sticky oppsummering */}
          <div className="lg:sticky lg:top-20">
            <OppsummeringPanel
              lønn={lønn}
              poster={poster}
              onBekreft={onBekreft}
              onEndreLønn={onEndreLønn}
            />
          </div>

        </div>
      </div>
    </TooltipProvider>
  )
}

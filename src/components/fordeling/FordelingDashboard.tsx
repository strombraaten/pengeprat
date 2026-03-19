import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { formatKr } from "@/lib/formatering"
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
  onEndreLønn: () => void
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
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-extrabold tabular-nums">
                {formatKr(lønn)}
              </span>
              <span className="text-sm text-muted-foreground">/ mnd</span>
              <Button
                variant="outline"
                size="sm"
                onClick={onEndreLønn}
                className="ml-auto lg:ml-0"
              >
                Endre lønn
              </Button>
            </div>
          </div>

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

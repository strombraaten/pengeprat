import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { KATEGORIER } from "@/lib/kategorier"
import { formatKr } from "@/lib/formatering"
import type { PostId, PostState } from "@/types/fordeling"

interface FordelingBarProps {
  lønn: number
  poster: Record<PostId, PostState>
  // When set, the matching segment is highlighted and others are dimmed
  activePost?: PostId | null
  // Called when the user clicks a segment to open/close the side panel
  onSelectPost?: (id: PostId | null) => void
}

export function FordelingBar({
  lønn,
  poster,
  activePost,
  onSelectPost,
}: FordelingBarProps) {
  const segmenter = KATEGORIER.map((kat) => {
    const beløp = poster[kat.id]?.månedlig ?? 0
    const prosent = lønn > 0 ? (beløp / lønn) * 100 : 0
    return { kat, beløp, prosent }
  }).filter((s) => s.prosent > 0)

  const harAktivPost = activePost != null

  return (
    // overflow-visible allows the scale-y transform on the active segment to
    // render outside the bar bounds without being clipped
    <div className="overflow-visible">
      <div className="flex h-7 w-full overflow-visible rounded-lg">
        {segmenter.map(({ kat, prosent }, i) => {
          const visLabel = prosent >= 8
          const erFørste = i === 0
          const erSiste = i === segmenter.length - 1
          const erAktiv = activePost === kat.id
          const erInteraktiv = onSelectPost != null

          return (
            <Tooltip key={kat.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={
                    erInteraktiv
                      ? () => onSelectPost(erAktiv ? null : kat.id)
                      : undefined
                  }
                  className={[
                    "relative flex items-center justify-center overflow-hidden transition-all duration-200 select-none",
                    // Only apply cursor-pointer when the bar is interactive
                    erInteraktiv ? "cursor-pointer" : "cursor-default",
                    // Dim inactive segments when any segment is active
                    harAktivPost && !erAktiv
                      ? "opacity-40 saturate-50"
                      : "",
                    // Scale up and highlight the active segment
                    erAktiv
                      ? "scale-y-[1.3] z-10 ring-2 ring-white drop-shadow-md"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    width: `${prosent}%`,
                    backgroundColor: kat.farge,
                    borderRadius: erFørste
                      ? "0.5rem 0 0 0.5rem"
                      : erSiste
                        ? "0 0.5rem 0.5rem 0"
                        : undefined,
                  }}
                  aria-pressed={erAktiv}
                  aria-label={`${kat.navn} — ${Math.round(prosent)}%, ${formatKr(poster[kat.id]?.månedlig ?? 0)}/mnd`}
                >
                  {visLabel && (
                    // Counter-scale the label so text stays the same visual
                    // size even though the parent segment uses scale-y-[1.3]
                    <span
                      className={[
                        "text-[10px] font-semibold text-white/90 px-1 truncate",
                        erAktiv ? "scale-y-[0.769]" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {Math.round(prosent)}%
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <span className="font-medium">{kat.navn}</span>
                {" — "}
                {formatKr(poster[kat.id]?.månedlig ?? 0)}/mnd ({Math.round(prosent)}%)
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

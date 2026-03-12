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
}

export function FordelingBar({ lønn, poster }: FordelingBarProps) {
  const segmenter = KATEGORIER.map((kat) => {
    const beløp = poster[kat.id]?.månedlig ?? 0
    const prosent = lønn > 0 ? (beløp / lønn) * 100 : 0
    return { kat, beløp, prosent }
  }).filter((s) => s.prosent > 0)

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex h-7 w-full overflow-hidden rounded-lg">
        {segmenter.map(({ kat, prosent }, i) => {
          const visLabel = prosent >= 8
          const erFørste = i === 0
          const erSiste = i === segmenter.length - 1
          return (
            <Tooltip key={kat.id}>
              <TooltipTrigger asChild>
                <div
                  className="relative flex items-center justify-center overflow-hidden transition-all duration-300 cursor-default select-none"
                  style={{
                    width: `${prosent}%`,
                    backgroundColor: kat.farge,
                    borderRadius: erFørste
                      ? "0.5rem 0 0 0.5rem"
                      : erSiste
                        ? "0 0.5rem 0.5rem 0"
                        : undefined,
                  }}
                >
                  {visLabel && (
                    <span className="text-[10px] font-semibold text-white/90 px-1 truncate">
                      {Math.round(prosent)}%
                    </span>
                  )}
                </div>
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

      {/* Legende */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segmenter.map(({ kat, prosent }) => (
          <div key={kat.id} className="flex items-center gap-1.5">
            <div
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: kat.farge }}
            />
            <span className="text-xs text-muted-foreground">{kat.navn}</span>
            <span className="text-xs font-medium text-foreground">
              {Math.round(prosent)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

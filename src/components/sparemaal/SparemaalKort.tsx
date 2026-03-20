import { ArrowCounterClockwise, ArrowRight, CheckCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { formatKr } from "@/lib/formatering"

interface SparemaalKortProps {
  id: string
  navn: string
  /** OKLCH accent color string, e.g. "oklch(0.62 0.15 185)" */
  farge: string
  beskrivelse?: string
  mål: number | null
  bekreftet: boolean
  isOpen: boolean
  onToggle: () => void
  onSave: () => void
  /** If provided, shows "Tilbakestill til forslag" link */
  defaultMål?: number | null
  onReset?: () => void
  children: React.ReactNode
}

/**
 * Generic accordion card for a savings goal.
 * Displays a colored left stripe, header with name/amount, and collapsible content.
 */
export function SparemaalKort({
  navn,
  farge,
  beskrivelse,
  mål,
  bekreftet,
  isOpen,
  onToggle,
  onSave,
  defaultMål,
  onReset,
  children,
}: SparemaalKortProps) {
  const hasChanged = defaultMål != null && mål !== defaultMål
  const canSave = mål != null && mål > 0

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Header — always visible, acts as toggle trigger */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-muted/40 transition-colors"
          >
            {/* Colored vertical stripe — same pattern as FordelingPanel */}
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: farge }}
            />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">{navn}</span>
                {bekreftet && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <CheckCircle weight="fill" size={13} />
                    Lagret
                  </span>
                )}
              </div>
              {beskrivelse && (
                <span className="text-xs text-muted-foreground leading-snug">
                  {beskrivelse}
                </span>
              )}
            </div>
            <div className="ml-auto flex-shrink-0 text-right">
              {mål != null ? (
                <span className="text-sm font-medium tabular-nums">
                  {formatKr(mål)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Ikke satt</span>
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Collapsible body */}
        <CollapsibleContent>
          <div className="px-4 pb-4 flex flex-col gap-4 border-t border-border pt-4">
            {/* Slot for formula box, input, and any extra content */}
            {children}

            {/* Save + reset actions */}
            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="button"
                className="w-full"
                disabled={!canSave}
                onClick={onSave}
              >
                Lagre
                <ArrowRight weight="bold" />
              </Button>

              {onReset && hasChanged && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={onReset}
                >
                  <ArrowCounterClockwise />
                  Tilbakestill til forslag
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

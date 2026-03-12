import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { KATEGORIER } from "@/lib/kategorier"
import { formatKr } from "@/lib/formatering"
import type { PostId, PostState } from "@/types/fordeling"

interface OppsummeringPanelProps {
  lønn: number
  poster: Record<PostId, PostState>
  onBekreft: () => void
  onEndreLønn: () => void
}

const KONTO_TYPE: Partial<Record<PostId, string>> = {
  pensjon: "IPS (pensjonssparing)",
  guiltFree: "forbrukskonto",
}

const OVERFØRINGS_POSTER: PostId[] = [
  "buffer",
  "guiltFree",
  "ferie",
  "storeLivshendelser",
  "pensjon",
]

export function OppsummeringPanel({
  lønn,
  poster,
  onBekreft,
  onEndreLønn,
}: OppsummeringPanelProps) {
  const [bekreftSteg, setBekreftSteg] = useState<1 | 2>(1)

  const overføringer = KATEGORIER.filter(
    (k) => OVERFØRINGS_POSTER.includes(k.id) && (poster[k.id]?.månedlig ?? 0) > 0
  )

  const sparingTotal = KATEGORIER.filter(
    (k) => k.id !== "fasteUtgifter" && k.id !== "guiltFree"
  ).reduce((sum, k) => sum + (poster[k.id]?.månedlig ?? 0), 0)

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3.5 bg-muted/40 border-b border-border">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Oppsummering
          </p>
          <button
            type="button"
            onClick={onEndreLønn}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Endre lønn
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Beløp-oversikt */}
        <div className="space-y-2">
          <SummaryRow
            label="Månedsinntekt"
            value={formatKr(lønn)}
            highlight
          />
          <Separator />
          {KATEGORIER.map((kat) => {
            const beløp = poster[kat.id]?.månedlig ?? 0
            if (beløp === 0) return null
            return (
              <SummaryRow
                key={kat.id}
                dot={kat.farge}
                label={kat.navn}
                value={formatKr(beløp)}
              />
            )
          })}
          <Separator />
          <SummaryRow
            label="Sparing totalt"
            value={formatKr(sparingTotal)}
            highlight
          />
        </div>

        {/* Faste trekk */}
        {overføringer.length > 0 && (
          <div className="rounded-lg bg-muted/50 border border-border/60 p-3 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dine faste trekk
            </p>
            {overføringer.map((kat) => {
              const beløp = poster[kat.id]?.månedlig ?? 0
              const konto = KONTO_TYPE[kat.id] ?? "sparekonto"
              return (
                <div
                  key={kat.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="text-muted-foreground shrink-0">→ {kat.navn}</span>
                  <span className="text-right tabular-nums text-xs">
                    <span className="font-medium text-foreground">{formatKr(beløp)}/mnd</span>
                    <br />
                    <span className="text-muted-foreground">({konto})</span>
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Bekreft-knapp */}
        <div className="pt-1 space-y-3">
          {bekreftSteg === 1 ? (
            <Button
              onClick={() => setBekreftSteg(2)}
              className="w-full"
            >
              Ferdig, har satt opp de faste trekkene
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Er du sikker? Hvis ikke fortjener du ikke det som kommer.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setBekreftSteg(1)}
                  className="flex-1"
                >
                  Tilbake
                </Button>
                <Button onClick={onBekreft} className="flex-1">
                  Ja, jeg er klar!
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  dot,
  highlight,
}: {
  label: string
  value: string
  dot?: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        {dot && (
          <div
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: dot }}
          />
        )}
        <span className={highlight ? "font-medium text-foreground" : "text-muted-foreground"}>
          {label}
        </span>
      </div>
      <span className={`tabular-nums shrink-0 ${highlight ? "font-semibold text-foreground" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  )
}

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { KATEGORIER } from "@/lib/kategorier"
import { formatKr } from "@/lib/formatering"
import type { PostId, PostState } from "@/types/fordeling"

// Posts that require manual bank transfers — fasteUtgifter is excluded
// because it's not a savings transfer, just existing spending
const OVERFØRINGS_POSTER: PostId[] = [
  "buffer",
  "guiltFree",
  "ferie",
  "storeLivshendelser",
  "pensjon",
]

// Account type labels shown alongside each post — defaults to "sparekonto"
const KONTO_TYPE: Partial<Record<PostId, string>> = {
  pensjon: "IPS (pensjonssparing)",
  guiltFree: "forbrukskonto",
}

interface FasteTreekkProps {
  lønn: number
  poster: Record<PostId, PostState>
  onTilbake: () => void
  onFullført: () => void
}

export function FasteTrekk({
  poster,
  onTilbake,
  onFullført,
}: FasteTreekkProps) {
  // Local checkbox state — not persisted, resets if user navigates away
  const [huketAv, setHuketAv] = useState<Record<PostId, boolean>>(
    () =>
      Object.fromEntries(
        OVERFØRINGS_POSTER.map((id) => [id, false])
      ) as Record<PostId, boolean>
  )

  const alleHuketAv = OVERFØRINGS_POSTER.every((id) => huketAv[id])

  function togglePost(id: PostId) {
    setHuketAv((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Én ting gjenstår</h1>
          <p className="text-muted-foreground leading-relaxed">
            Sett opp faste trekk i nettbanken din — huk av etter hvert som du
            gjør det.
          </p>
        </div>

        {/* Checklist card */}
        <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
          {OVERFØRINGS_POSTER.map((id) => {
            const kat = KATEGORIER.find((k) => k.id === id)!
            const post = poster[id]
            const konto = KONTO_TYPE[id] ?? "sparekonto"
            const erHuketAv = huketAv[id]

            return (
              <label
                key={id}
                className="flex items-center gap-4 px-4 py-3.5 cursor-pointer select-none transition-opacity"
                style={{ opacity: erHuketAv ? 0.5 : 1 }}
              >
                {/* Color indicator matching the budget bar */}
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: kat.farge }}
                />

                <Checkbox
                  checked={erHuketAv}
                  onCheckedChange={() => togglePost(id)}
                />

                {/* Category name + account type */}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-sm font-medium leading-none"
                    style={{
                      textDecoration: erHuketAv ? "line-through" : "none",
                    }}
                  >
                    {kat.navn}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1.5">
                    ({konto})
                  </span>
                </div>

                {/* Amount — monospace for alignment */}
                <span className="text-sm font-semibold font-mono tabular-nums whitespace-nowrap">
                  {formatKr(post.månedlig)}/mnd
                </span>
              </label>
            )
          })}
        </div>

        {/* Info box: sparekonto vs ASK — brief, not exhaustive */}
        <div className="rounded-lg border-l-4 border-l-muted bg-muted/30 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tips
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For buffer og kortsiktig sparing (ferie, livshendelser): vanlig
            sparekonto. For langsiktig sparing over 5+ år: aksjesparekonto
            (ASK) gir bedre avkastning over tid.
          </p>
        </div>

        <Separator />

        {/* Action buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
          <Button variant="outline" onClick={onTilbake}>
            ← Tilbake til fordeling
          </Button>
          <Button disabled={!alleHuketAv} onClick={onFullført}>
            {alleHuketAv ? "Ferdig! →" : "Gå videre"}
          </Button>
        </div>

      </div>
    </div>
  )
}

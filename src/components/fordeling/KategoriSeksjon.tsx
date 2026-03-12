import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { CaretDown } from "@phosphor-icons/react"
import { formatKr, formaterTidshorisont } from "@/lib/formatering"
import { beregnKrPerUke, beregnMånederTilMål, sliderMax, sliderMin } from "@/lib/beregninger"
import type { Kategori, PostState } from "@/types/fordeling"

interface KategoriSeksjonProps {
  kat: Kategori
  post: PostState
  lønn: number
  isExpanded: boolean
  onToggle: () => void
  onEndrePost: (nyVerdi: number) => void
  onEndreFasteUtgifter: (nyVerdi: number) => void
  onEndreAlleredeSpart: (verdi: number) => void
  onEndreMål: (verdi: number | null) => void
}

function parseNummer(str: string): number | null {
  const renset = str.replace(/\s/g, "").replace(/,/g, "")
  const tall = parseInt(renset, 10)
  return isNaN(tall) ? null : tall
}

export function KategoriSeksjon({
  kat,
  post,
  lønn,
  isExpanded,
  onToggle,
  onEndrePost,
  onEndreFasteUtgifter,
  onEndreAlleredeSpart,
  onEndreMål,
}: KategoriSeksjonProps) {
  const månedlig = post.månedlig ?? 0

  const målNådd =
    kat.harTidshorisont &&
    (post.mål ?? 0) > 0 &&
    (post.alleredeSpart ?? 0) >= (post.mål ?? 0)

  const min = målNådd ? 0 : sliderMin()
  const max = sliderMax(lønn, kat.sliderMaxFaktor ?? 0.2)

  // Progress-prosent til sparemål
  const spareProsent =
    kat.harTidshorisont && (post.mål ?? 0) > 0
      ? Math.min(100, Math.round(((post.alleredeSpart ?? 0) / post.mål!) * 100))
      : 0

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

        {/* Header — alltid synlig */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            {/* Farget prikk */}
            <div
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: kat.farge }}
            />

            {/* Navn og beskrivelse */}
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold text-foreground">{kat.navn}</span>
              {!isExpanded && (
                <span className="block truncate text-xs text-muted-foreground mt-0.5">
                  {kat.beskrivelse}
                </span>
              )}
            </div>

            {/* Beløp */}
            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {formatKr(månedlig)}
              <span className="font-normal text-muted-foreground">/mnd</span>
            </span>

            {/* Chevron */}
            <CaretDown
              size={16}
              className={`shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>

        {/* Innhold — kun synlig når utvidet */}
        <CollapsibleContent>
          <div className="border-t border-border px-4 py-4 space-y-4">

            {/* Forklaring */}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {kat.forklaring}
            </p>

            {/* Faste utgifter: direkte tekstinput */}
            {kat.inputType === "tekst" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Dine månedlige faste utgifter
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    defaultValue={månedlig || ""}
                    onChange={(e) => {
                      const ny = parseNummer(e.target.value)
                      if (ny && ny > 0 && ny < lønn) {
                        onEndreFasteUtgifter(ny)
                      }
                    }}
                    className="pr-10"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                    kr
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Når du endrer dette, justeres de andre postene automatisk for å
                  balansere budsjettet.
                </p>
              </div>
            )}

            {/* Spareposter: slider */}
            {kat.inputType === "slider" && (
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Månedlig sparing
                </label>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tabular-nums text-foreground">
                      {formatKr(månedlig)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mnd</span>
                  </div>
                  <Slider
                    value={[månedlig]}
                    min={min}
                    max={max}
                    step={50}
                    onValueChange={([ny]) => onEndrePost(ny)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatKr(min)}</span>
                    <span>{formatKr(max)}</span>
                  </div>
                </div>
                {månedlig <= sliderMin() && !målNådd && (
                  <p className="text-xs text-muted-foreground">
                    En lav fast spareavtale er lettere å justere opp eller ned
                    enn å starte på nytt.
                  </p>
                )}
              </div>
            )}

            {/* Allerede spart */}
            {kat.harAlleredeSpart && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Har du noe spart allerede?
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    autoComplete="off"
                    defaultValue={
                      (post.alleredeSpart ?? 0) > 0 ? post.alleredeSpart : ""
                    }
                    onChange={(e) => {
                      const verdi = parseNummer(e.target.value) ?? 0
                      onEndreAlleredeSpart(verdi)
                    }}
                    className="pr-10"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                    kr
                  </span>
                </div>
              </div>
            )}

            {/* Målbeløp-input (storeLivshendelser) */}
            {kat.harMålInput && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Hva er målet ditt?</label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="f.eks. 150000"
                    autoComplete="off"
                    defaultValue={post.mål ?? ""}
                    onChange={(e) => {
                      const verdi = parseNummer(e.target.value)
                      onEndreMål(verdi)
                    }}
                    className="pr-10"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                    kr
                  </span>
                </div>
              </div>
            )}

            {/* Tidshorisont + progresjon */}
            {kat.harTidshorisont && (post.mål ?? 0) > 0 && (
              <div className="rounded-lg bg-muted/50 border border-border/60 p-3 space-y-3">
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Spart</span>
                    <span className="tabular-nums">
                      {formatKr(post.alleredeSpart ?? 0)} av {formatKr(post.mål!)}
                    </span>
                  </div>
                  <Progress value={spareProsent} className="h-1.5" />
                  <p className="text-xs text-muted-foreground text-right">
                    {spareProsent}%
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <StatPill
                    label={kat.id === "buffer" ? "Buffermål" : "Mål"}
                    value={formatKr(post.mål!)}
                    accent
                  />
                  <StatPill
                    label="Tid til mål"
                    value={formaterTidshorisont(
                      beregnMånederTilMål(
                        post.mål!,
                        post.alleredeSpart ?? 0,
                        månedlig
                      )
                    )}
                    accent={!målNådd}
                  />
                </div>
              </div>
            )}

            {/* Guilt-free: kr per uke */}
            {kat.harKrPerUke && (
              <div className="rounded-lg bg-muted/50 border border-border/60 p-3">
                <StatPill
                  label="Ca. per uke"
                  value={formatKr(beregnKrPerUke(månedlig))}
                  accent
                />
              </div>
            )}

            {/* Pensjon: årsbeløp + advarsel */}
            {kat.harPensjonVisning && (
              <div className="rounded-lg bg-muted/50 border border-border/60 p-3 space-y-2">
                <StatPill
                  label="Årlig sum"
                  value={`${formatKr(månedlig * 12)}/år`}
                />
                {månedlig < 1250 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠ Under 1 250 kr/mnd utnytter du ikke hele IPS-fradraget
                  </p>
                )}
              </div>
            )}

          </div>
        </CollapsibleContent>

      </div>
    </Collapsible>
  )
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  )
}

import { useRef, useState } from "react"
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CircleIcon,
  DownloadSimpleIcon,
  PrinterIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatKr } from "@/lib/formatering"
import { formaterFerdigMåned, lesPlan, type Plan, type PlanMål } from "@/lib/plan"
import { filnavn, gjenopprett, lagSikkerhetskopi } from "@/lib/sikkerhetskopi"

// «Min plan» samler resultatet av alle stegene i Pengeprat på ett sted:
// hva som går til hva hver måned, sparemålene og når du er i mål.
// Logikken ligger i lib/plan.ts — denne komponenten viser den bare.

export function PlanApp() {
  const [plan, setPlan] = useState<Plan>(lesPlan)

  const harStartet = plan.steg.utgifter || plan.steg.fordeling || plan.steg.sparemaal

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Min plan
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Planen din</h1>
        <p className="leading-relaxed text-muted-foreground">
          Alt fra pengepraten med deg selv, samlet på ett sted. Planen bygges
          opp av stegene under — jo flere du gjør, jo mer komplett blir den.
        </p>
      </div>

      <Steg plan={plan} />

      {harStartet ? (
        <>
          {plan.lønn != null && <HverMåned plan={plan} />}
          <Sparemål mål={plan.mål} harFordeling={plan.steg.fordeling} />
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Du har ikke startet ennå. Begynn med{" "}
          <a href="/utgifter" className="font-medium text-foreground underline">
            å kartlegge utgiftene dine
          </a>
          .
        </div>
      )}

      <TaVarePå onGjenopprettet={() => setPlan(lesPlan())} harData={harStartet} />
    </div>
  )
}

// ─── Stegene ───────────────────────────────────────────────────────────────

function Steg({ plan }: { plan: Plan }) {
  const steg = [
    {
      ferdig: plan.steg.utgifter,
      navn: "Kartlegg utgiftene",
      detalj: plan.utgifterTotal != null ? `${formatKr(plan.utgifterTotal)} i måneden` : null,
      href: "/utgifter",
    },
    {
      ferdig: plan.steg.fordeling,
      navn: "Fordel lønna",
      detalj: plan.lønn != null ? `${formatKr(plan.lønn)} fordelt` : null,
      href: "/fordeling",
    },
    {
      ferdig: plan.steg.fasteTrekk,
      navn: "Sett opp faste trekk",
      detalj: plan.fasteTrekkFullført
        ? `Satt opp ${new Date(plan.fasteTrekkFullført).toLocaleDateString("nb-NO")}`
        : null,
      href: "/fordeling",
    },
    {
      ferdig: plan.steg.sparemaal,
      navn: "Definer taket for sparemålene",
      detalj: null,
      href: "/sparemaal",
    },
  ]
  const nesteIndeks = steg.findIndex((s) => !s.ferdig)

  return (
    <ol className="divide-y divide-border rounded-xl border border-border bg-card">
      {steg.map((s, i) => (
        <li key={s.navn} className="flex items-center gap-3 px-4 py-3">
          {s.ferdig ? (
            <CheckCircleIcon size={20} weight="fill" className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CircleIcon size={20} className="shrink-0 text-muted-foreground/50" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {i + 1}. {s.navn}
            </p>
            {s.detalj && <p className="text-xs text-muted-foreground">{s.detalj}</p>}
          </div>
          {i === nesteIndeks ? (
            <Button asChild size="sm" className="print:hidden">
              <a href={s.href}>
                Gjør nå <ArrowRightIcon data-icon="inline-end" />
              </a>
            </Button>
          ) : (
            <a
              href={s.href}
              className="text-xs text-muted-foreground underline hover:text-foreground print:hidden"
            >
              {s.ferdig ? "Endre" : "Åpne"}
            </a>
          )}
        </li>
      ))}
    </ol>
  )
}

// ─── Hver måned ────────────────────────────────────────────────────────────

function HverMåned({ plan }: { plan: Plan }) {
  const tilSparing = plan.trekk
    .filter((t) => t.id !== "guiltFree")
    .reduce((s, t) => s + t.månedlig, 0)
  const fasteFraUtgifter =
    plan.utgifterTotal != null && plan.utgifterTotal === plan.fasteUtgifter

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Hver måned</h2>
      <div className="divide-y divide-border rounded-xl border border-border bg-card text-sm">
        <Rad navn="Lønn etter skatt" beløp={plan.lønn!} sterk />
        <Rad
          navn="Faste utgifter"
          detalj={fasteFraUtgifter ? "fra Månedlige utgifter" : "brukskonto"}
          beløp={plan.fasteUtgifter ?? 0}
        />
        {plan.trekk.map((t) => (
          <Rad key={t.id} navn={t.navn} detalj={t.konto} beløp={t.månedlig} farge={t.farge} />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Du setter av <strong className="text-foreground">{formatKr(tilSparing)}</strong> til
        sparing hver måned — {formatKr(tilSparing * 12)} i året.
        {!plan.steg.fasteTrekk && (
          <>
            {" "}
            Sett opp beløpene som faste trekk i nettbanken, så skjer det av seg selv.
          </>
        )}
      </p>
    </section>
  )
}

function Rad({
  navn,
  detalj,
  beløp,
  farge,
  sterk,
}: {
  navn: string
  detalj?: string
  beløp: number
  farge?: string
  sterk?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: farge ?? "transparent" }}
        aria-hidden
      />
      <span className={sterk ? "flex-1 font-semibold" : "flex-1"}>
        {navn}
        {detalj && <span className="ml-1.5 text-xs text-muted-foreground">({detalj})</span>}
      </span>
      <span className={["font-mono tabular-nums", sterk ? "font-semibold" : ""].join(" ")}>
        {formatKr(beløp)}
      </span>
    </div>
  )
}

// ─── Sparemål ──────────────────────────────────────────────────────────────

function Sparemål({ mål, harFordeling }: { mål: PlanMål[]; harFordeling: boolean }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Sparemålene dine</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {mål.map((m) => (
          <MålKort key={m.id} m={m} />
        ))}
      </div>
      {!harFordeling && (
        <p className="text-sm text-muted-foreground">
          <a href="/fordeling" className="underline hover:text-foreground">
            Fordel lønna
          </a>{" "}
          for å se når du når målene.
        </p>
      )}
    </section>
  )
}

function MålKort({ m }: { m: PlanMål }) {
  const prosent =
    m.mål && m.alleredeSpart != null ? Math.min(100, Math.round((m.alleredeSpart / m.mål) * 100)) : null

  let når: string | null = null
  if (m.måneder === 0) når = "Målet er nådd 🎉"
  else if (m.måneder === Infinity) når = "Du sparer ikke til dette hver måned ennå"
  else if (m.måneder != null) når = `I mål ${formaterFerdigMåned(m.måneder)}`

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4 break-inside-avoid">
      <div className="w-1 shrink-0 self-stretch rounded-full" style={{ backgroundColor: m.farge }} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">{m.navn}</p>
          {!m.bekreftet && m.mål != null && (
            <Badge variant="outline" className="shrink-0">
              forslag
            </Badge>
          )}
        </div>
        <p className="font-mono text-lg font-bold tabular-nums">
          {m.mål != null ? formatKr(m.mål) : "Ikke satt"}
        </p>
        {prosent != null && (
          <div className="space-y-1">
            <Progress value={prosent} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {formatKr(m.alleredeSpart)} spart
              {m.månedlig ? ` · ${formatKr(m.månedlig)}/mnd` : ""}
            </p>
          </div>
        )}
        {når && <p className="text-xs font-medium">{når}</p>}
      </div>
    </div>
  )
}

// ─── Utskrift og sikkerhetskopi ────────────────────────────────────────────

function TaVarePå({
  onGjenopprettet,
  harData,
}: {
  onGjenopprettet: () => void
  harData: boolean
}) {
  const filInput = useRef<HTMLInputElement>(null)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  function lastNed() {
    const blob = new Blob([JSON.stringify(lagSikkerhetskopi(), null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filnavn()
    a.click()
    URL.revokeObjectURL(url)
  }

  async function lesFil(fil: File) {
    if (
      harData &&
      !window.confirm("Sikkerhetskopien erstatter dataene du har i denne nettleseren nå. Vil du fortsette?")
    ) {
      return
    }
    const resultat = gjenopprett(await fil.text())
    if (resultat.ok) {
      setMelding({ ok: true, tekst: "Planen er gjenopprettet." })
      onGjenopprettet()
    } else {
      setMelding({ ok: false, tekst: resultat.feil })
    }
  }

  return (
    <section className="space-y-3 print:hidden">
      <h2 className="text-lg font-semibold tracking-tight">Ta vare på planen</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Planen ligger bare i denne nettleseren. Skriv den ut, eller last ned en
        sikkerhetskopi du kan hente inn igjen på en annen enhet. Filen sendes
        ingen steder.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.print()} disabled={!harData}>
          <PrinterIcon data-icon="inline-start" /> Skriv ut
        </Button>
        <Button variant="outline" onClick={lastNed} disabled={!harData}>
          <DownloadSimpleIcon data-icon="inline-start" /> Last ned sikkerhetskopi
        </Button>
        <Button variant="outline" onClick={() => filInput.current?.click()}>
          <UploadSimpleIcon data-icon="inline-start" /> Hent inn sikkerhetskopi
        </Button>
        <input
          ref={filInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const fil = e.target.files?.[0]
            if (fil) void lesFil(fil)
            e.target.value = ""
          }}
        />
      </div>
      {melding && (
        <p
          role="status"
          className={melding.ok ? "text-sm text-emerald-600 dark:text-emerald-400" : "text-sm text-destructive"}
        >
          {melding.tekst}
        </p>
      )}
    </section>
  )
}

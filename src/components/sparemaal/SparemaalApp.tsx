import { useState } from "react"
import { ArrowLeft, ArrowSquareOut, Plus } from "@phosphor-icons/react"
import type { EgetMaal, LivehendelsesEntry, SparemaalEntry, SparemaalState } from "@/types/sparemaal"
import { loadSparemaalState, saveSparemaalState } from "@/lib/sparemaal-storage"
import { Button } from "@/components/ui/button"
import { SparemaalKort } from "./SparemaalKort"
import { SparemaalBelopInput } from "./SparemaalBelopInput"
import { LivshendelsesKort } from "./LivshendelsesKort"
import { EgetMaalKort } from "./EgetMaalKort"

// --- Colors from kategorier.ts + framtidsfri (new category) ---
const FARGE = {
  buffer: "oklch(0.62 0.15 185)",
  ferie: "oklch(0.63 0.15 30)",
  framtidsfri: "oklch(0.61 0.19 278)",
  storeLivshendelser: "oklch(0.53 0.19 295)",
  pensjon: "oklch(0.62 0.15 140)",
}

// Palette for user-defined goals (rotates)
const EGNE_FARGER = [
  "oklch(0.65 0.14 70)",
  "oklch(0.60 0.18 320)",
  "oklch(0.65 0.15 200)",
  "oklch(0.62 0.16 15)",
  "oklch(0.66 0.12 100)",
]

// Ordered list of fixed card IDs (excluding egne + pensjon)
const KORT_REKKEFOLGE = ["buffer", "ferie", "framtidsfri", "storeLivshendelser"] as const

function buildSSRState(): SparemaalState {
  return {
    buffer: { mål: 82_500, bekreftet: false },
    ferie: { mål: 15_000, bekreftet: false },
    framtidsfri: { mål: 210_000, bekreftet: false },
    storeLivshendelser: { type: "Bil", mål: null, bekreftet: false },
    egne: [],
  }
}

/** Read fordeling state to get personalized defaults for buffer and framtidsfri */
function readSuggestions(): { buffer: number; framtidsfri: number } {
  try {
    const raw = localStorage.getItem("pengeprat_v2")
    if (!raw) return { buffer: 82_500, framtidsfri: 210_000 }
    const parsed = JSON.parse(raw)
    const lønn: number | null = parsed?.lønn ?? null
    const faste: number = parsed?.poster?.fasteUtgifter?.månedlig ?? 0
    return {
      buffer: lønn ? Math.round(lønn * 1.5) : 82_500,
      framtidsfri: faste > 0 ? Math.round(faste * 6) : 210_000,
    }
  } catch {
    return { buffer: 82_500, framtidsfri: 210_000 }
  }
}

/**
 * Root component for the Sparemål tool.
 * Renders accordion cards for each savings goal in priority order.
 */
export function SparemaalApp() {
  const [state, setState] = useState<SparemaalState>(() => {
    if (typeof window === "undefined") return buildSSRState()
    return loadSparemaalState()
  })

  // Suggestions computed once at mount (for "Tilbakestill til forslag")
  const [suggestions] = useState<{ buffer: number; framtidsfri: number }>(() => {
    if (typeof window === "undefined") return { buffer: 82_500, framtidsfri: 210_000 }
    return readSuggestions()
  })

  // One open card at a time — start with first unconfirmed, else buffer
  const [openId, setOpenId] = useState<string>(() => {
    if (typeof window === "undefined") return "buffer"
    const s = loadSparemaalState()
    const first = KORT_REKKEFOLGE.find((id) => !s[id].bekreftet)
    if (first) return first
    const firstEget = s.egne.find((e) => !e.bekreftet)
    if (firstEget) return firstEget.id
    return "buffer"
  })

  function updateState(next: SparemaalState) {
    setState(next)
    saveSparemaalState(next)
  }

  /** After saving a card, advance openId to the next unconfirmed one */
  function openNext(savedId: string, nextState: SparemaalState) {
    const allIds = [
      ...KORT_REKKEFOLGE,
      ...nextState.egne.map((e) => e.id),
    ]
    const idx = allIds.indexOf(savedId)
    for (let i = idx + 1; i < allIds.length; i++) {
      const id = allIds[i]
      const isFixed = (KORT_REKKEFOLGE as readonly string[]).includes(id)
      if (isFixed) {
        if (!nextState[id as keyof Pick<SparemaalState, "buffer" | "ferie" | "framtidsfri" | "storeLivshendelser">].bekreftet) {
          setOpenId(id)
          return
        }
      } else {
        const eget = nextState.egne.find((e) => e.id === id)
        if (eget && !eget.bekreftet) {
          setOpenId(id)
          return
        }
      }
    }
    // All confirmed — keep current open
    setOpenId(savedId)
  }

  function saveEntry(id: "buffer" | "ferie" | "framtidsfri", mål: number | null) {
    const next: SparemaalState = {
      ...state,
      [id]: { ...state[id], mål, bekreftet: true },
    }
    updateState(next)
    openNext(id, next)
  }

  function resetEntry(id: "buffer" | "ferie" | "framtidsfri", defaultMål: number) {
    setState((prev) => ({
      ...prev,
      [id]: { ...prev[id], mål: defaultMål },
    }))
  }

  function saveLivshendelser(updated: LivehendelsesEntry) {
    const next: SparemaalState = {
      ...state,
      storeLivshendelser: { ...updated, bekreftet: true },
    }
    updateState(next)
    openNext("storeLivshendelser", next)
  }

  function saveEget(updated: EgetMaal) {
    const next: SparemaalState = {
      ...state,
      egne: state.egne.map((e) => (e.id === updated.id ? updated : e)),
    }
    updateState(next)
    openNext(updated.id, next)
  }

  function deleteEget(id: string) {
    const next: SparemaalState = {
      ...state,
      egne: state.egne.filter((e) => e.id !== id),
    }
    updateState(next)
    if (openId === id) setOpenId("buffer")
  }

  function addEget() {
    const id = `eget-${Date.now()}`
    const farge = EGNE_FARGER[state.egne.length % EGNE_FARGER.length]
    const nytt: EgetMaal = {
      id,
      navn: "",
      mål: null,
      farge,
      bekreftet: false,
    }
    const next: SparemaalState = {
      ...state,
      egne: [...state.egne, nytt],
    }
    updateState(next)
    setOpenId(id)
  }

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? "" : id))
  }

  // Local draft state for simple numeric cards (buffer, ferie, framtidsfri)
  // We use a sub-component pattern to isolate draft from the outer state
  return (
    <div className="flex flex-col gap-3">
      {/* Back link */}
      <a
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-1"
      >
        <ArrowLeft size={15} />
        Pengeprat
      </a>

      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold tracking-tight">Hva er nok?</h1>
        <p className="text-sm text-muted-foreground mt-1">
          De fleste sparemål har et tak. En øvre grense for hvor mye du trenger å spare. Ved å definere en konkret sum for din blir det mye lettere å få en følelse av kontroll over egen økonomi.
        </p>
      </div>

      {/* Priority note */}
      <div className="rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
        <strong className="text-foreground">Alltid start med bufferen.</strong>
        {" "}Å kunne betale uventede regninger uten å røre kredittkortet er på en måte grunnmuren som holder resten stødig.
      </div>

      {/* Kredittgjeld disclaimer */}
      <div className="text-xs text-muted-foreground px-0.5">
        Har du kredittgjeld eller forbrukslån? I så fall lønner det seg å betale ned det aller først.
      </div>

      {/* 1. Buffer */}
      <BufferKort
        farge={FARGE.buffer}
        entry={state.buffer}
        suggestion={suggestions.buffer}
        isOpen={openId === "buffer"}
        onToggle={() => toggle("buffer")}
        onSave={(mål) => saveEntry("buffer", mål)}
        onReset={() => resetEntry("buffer", suggestions.buffer)}
      />

      {/* 2. Ferie og opplevelser */}
      <FerieKort
        farge={FARGE.ferie}
        entry={state.ferie}
        isOpen={openId === "ferie"}
        onToggle={() => toggle("ferie")}
        onSave={(mål) => saveEntry("ferie", mål)}
        onReset={() => resetEntry("ferie", 15_000)}
      />

      {/* 3. Framtidsfri */}
      <FramtidsfriKort
        farge={FARGE.framtidsfri}
        entry={state.framtidsfri}
        suggestion={suggestions.framtidsfri}
        isOpen={openId === "framtidsfri"}
        onToggle={() => toggle("framtidsfri")}
        onSave={(mål) => saveEntry("framtidsfri", mål)}
        onReset={() => resetEntry("framtidsfri", suggestions.framtidsfri)}
      />

      {/* 4. Store livshendelser */}
      <LivshendelsesKort
        farge={FARGE.storeLivshendelser}
        data={state.storeLivshendelser}
        isOpen={openId === "storeLivshendelser"}
        onToggle={() => toggle("storeLivshendelser")}
        onSave={saveLivshendelser}
      />

      {/* 5. Pensjon — always visible, no save */}
      <PensjonKort farge={FARGE.pensjon} />

      {/* 6. Egne mål */}
      {state.egne.map((eget) => (
        <EgetMaalKort
          key={eget.id}
          data={eget}
          isOpen={openId === eget.id}
          onToggle={() => toggle(eget.id)}
          onSave={saveEget}
          onDelete={deleteEget}
        />
      ))}

      {/* Add custom goal */}
      <Button
        type="button"
        variant="outline"
        className="w-full mt-6"
        onClick={addEget}
      >
        <Plus />
        Legg til eget mål
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline sub-components for the three simple numeric cards
// (keeps draft state local without extra files)
// ---------------------------------------------------------------------------

function BufferKort({
  farge,
  entry,
  suggestion,
  isOpen,
  onToggle,
  onSave,
  onReset,
}: {
  farge: string
  entry: SparemaalEntry
  suggestion: number
  isOpen: boolean
  onToggle: () => void
  onSave: (mål: number | null) => void
  onReset: () => void
}) {
  const [mål, setMål] = useState<number | null>(entry.mål)

  return (
    <SparemaalKort
      id="buffer"
      navn="Buffer"
      farge={farge}
      beskrivelse="For uventede utgifter"
      mål={mål}
      bekreftet={entry.bekreftet}
      isOpen={isOpen}
      onToggle={onToggle}
      onSave={() => onSave(mål)}
      defaultMål={suggestion}
      onReset={() => {
        setMål(suggestion)
        onReset()
      }}
    >
      <div className="rounded-md bg-muted px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
        Vi foreslår{" "}
        <strong className="text-foreground">1,5 × månedsinntekten din = {suggestion.toLocaleString("nb-NO")} kr</strong>.
        {" "}Det dekker de fleste uventede utgifter for en gjennomsnittlig husholdning.
      </div>
      <SparemaalBelopInput
        value={mål}
        onChange={setMål}
        placeholder="f.eks. 82 500"
        ariaLabel="Buffer-mål i kroner"
      />
      <p className="text-xs text-muted-foreground">
        Har du hus, hytte, barn og bil? Vurder 2–3× av en månedslønn. Er du singel og leier en leilighet? 1–1,5× er nok og plenty.
      </p>
    </SparemaalKort>
  )
}

function FerieKort({
  farge,
  entry,
  isOpen,
  onToggle,
  onSave,
  onReset,
}: {
  farge: string
  entry: SparemaalEntry
  isOpen: boolean
  onToggle: () => void
  onSave: (mål: number | null) => void
  onReset: () => void
}) {
  const [mål, setMål] = useState<number | null>(entry.mål)
  const DEFAULT_FERIE = 15_000

  return (
    <SparemaalKort
      id="ferie"
      navn="Ferie og opplevelser"
      farge={farge}
      beskrivelse="Spar jevnlig, bruk pengene når du vil, og fortsett sparinga til neste opplevelse"
      mål={mål}
      bekreftet={entry.bekreftet}
      isOpen={isOpen}
      onToggle={onToggle}
      onSave={() => onSave(mål)}
      defaultMål={DEFAULT_FERIE}
      onReset={() => {
        setMål(DEFAULT_FERIE)
        onReset()
      }}
    >
      <div className="rounded-md bg-muted px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
        Dette målet skiller seg fra de andre, siden pengene er ment til å brukes fortløpende – den hytteturen med vennene dine, den Gran Canaria-turen for å unngå høstdepresjonen. Alle de summene der tar du fra denne kontoen. Også fyller du det opp igjen.
      </div>
      <SparemaalBelopInput
        value={mål}
        onChange={setMål}
        placeholder="f.eks. 15 000"
        ariaLabel="Ferie-mål i kroner"
      />
      <p className="text-xs text-muted-foreground">
        15 000 kr dekker de fleste reiser og opplevelser. Reiser du ofte eller langt, juster oppover.
      </p>
    </SparemaalKort>
  )
}

function FramtidsfriKort({
  farge,
  entry,
  suggestion,
  isOpen,
  onToggle,
  onSave,
  onReset,
}: {
  farge: string
  entry: SparemaalEntry
  suggestion: number
  isOpen: boolean
  onToggle: () => void
  onSave: (mål: number | null) => void
  onReset: () => void
}) {
  const [mål, setMål] = useState<number | null>(entry.mål)

  return (
    <SparemaalKort
      id="framtidsfri"
      navn="Framtidsfri"
      farge={farge}
      beskrivelse="Friheten til å velge noe annet"
      mål={mål}
      bekreftet={entry.bekreftet}
      isOpen={isOpen}
      onToggle={onToggle}
      onSave={() => onSave(mål)}
      defaultMål={suggestion}
      onReset={() => {
        setMål(suggestion)
        onReset()
      }}
    >
      <div className="rounded-md bg-muted px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
        Vi foreslår{" "}
        <strong className="text-foreground">6 × faste utgifter = {suggestion.toLocaleString("nb-NO")} kr</strong>.
        {" "}Det gir deg et halvt år med fast livsstandard i ryggen — friheten til å si nei, bytte jobb, eller ta en pause.
      </div>
      <SparemaalBelopInput
        value={mål}
        onChange={setMål}
        placeholder="f.eks. 210 000"
        ariaLabel="Framtidsfri-mål i kroner"
      />
      <p className="text-xs text-muted-foreground">
        Basert på 35 000 kr/mnd i faste utgifter. Vil du ha et helt år fri? Sett 420 000 kr.
      </p>
    </SparemaalKort>
  )
}

function PensjonKort({ farge }: { farge: string }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          {/* Colored vertical stripe — same pattern as SparemaalKort */}
          <div
            className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
            style={{ backgroundColor: farge }}
          />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm text-foreground">Pensjon</span>
            <span className="text-xs text-muted-foreground">
              Langsiktig sparing
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Hvor mye du burde spare til pensjon avhenger av flere ting – alderen din (antall år som gjenstår før du skal bruke pengene), hvor mye som er spart opp gjennom jobben, trygden fra staten, livsstilen, og utgiftene dine.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Heldigvis har folka i Kron (Storebrand) lagd en enkel kalkulator hvor du kan regne det ut. Husk at det er en veiledning, ikke en fasit, så du må bare gjøre det beste du kan.
        </p>
        <Button variant="outline" asChild className="w-full">
          <a
            href="https://kron.no/app/tester/pensjonssjekk/start"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pensjonskalkulator
            <ArrowSquareOut />
          </a>
        </Button>
      </div>
    </div>
  )
}

import { useState } from "react"
import React from "react"
import type { LivehendelsesEntry, LivehendelsesType } from "@/types/sparemaal"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SparemaalKort } from "./SparemaalKort"
import { SparemaalBelopInput } from "./SparemaalBelopInput"

interface LivshendelsesKortProps {
  farge: string
  data: LivehendelsesEntry
  isOpen: boolean
  onToggle: () => void
  onSave: (updated: LivehendelsesEntry) => void
}

type TypeConfig = {
  formula: React.ReactNode
  hint: string
  placeholder: string
}

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="text-primary font-medium">{children}</span>
)

const TYPE_CONFIG: Record<LivehendelsesType, TypeConfig> = {
  Bil: {
    formula: (
      <>
        En bruktbil kan koste fra <Highlight>50 000–500 000 kr</Highlight>, mens nye biler koster
        jo enda mer. Hva ser du for deg?
      </>
    ),
    hint: "Tenk på forsikring og vedlikehold i tillegg til selve kjøpsprisen.",
    placeholder: "f.eks. 200 000",
  },
  Bryllup: {
    formula: (
      <>
        Bryllup kan koste alt fra <Highlight>20 000</Highlight> til over{" "}
        <Highlight>250 000 kr</Highlight> — avhengig av størrelse og ambisjonsnivå.
      </>
    ),
    hint: "Snakk med partneren din om hva som føles riktig for dere to.",
    placeholder: "f.eks. 80 000",
  },
  Egenkapital: {
    formula: (
      <>
        Banken krever minst <Highlight>10% av boligprisen</Highlight> i egenkapital. Vil du kjøpe
        for 4 millioner? Da blir regnestykket: 4 000 000 × 10% ={" "}
        <Highlight>400 000 kr</Highlight>.
      </>
    ),
    hint: "Regn ut hva du trenger: boligpris × 10% = egenkapital.",
    placeholder: "f.eks. 400 000",
  },
  Annet: {
    formula: "Hva sparer du mot? Skriv inn beløpet som føles riktig for deg akkurat nå.",
    hint: "Du kan endre dette når livet endrer seg.",
    placeholder: "Skriv inn beløp",
  },
}

const TYPER: LivehendelsesType[] = ["Bil", "Bryllup", "Egenkapital", "Annet"]

/**
 * Savings goal card for "Store livshendelser" with a type picker.
 * Selecting a type updates the formula hint and placeholder.
 */
export function LivshendelsesKort({
  farge,
  data,
  isOpen,
  onToggle,
  onSave,
}: LivshendelsesKortProps) {
  const [draft, setDraft] = useState<LivehendelsesEntry>({ ...data })

  // Sync draft when external data changes (e.g. after reset or external save)
  if (draft.type !== data.type && !isOpen) {
    setDraft({ ...data })
  }

  const config = TYPE_CONFIG[draft.type]

  function handleTypeChange(type: LivehendelsesType) {
    setDraft((prev) => ({ ...prev, type, mål: null }))
  }

  function handleMålChange(mål: number | null) {
    setDraft((prev) => ({ ...prev, mål }))
  }

  function handleSave() {
    onSave(draft)
  }

  return (
    <SparemaalKort
      id="storeLivshendelser"
      navn="Store livshendelser"
      farge={farge}
      beskrivelse="F. eks bryllup, bil, egenkapital osv."
      mål={draft.mål}
      bekreftet={data.bekreftet}
      isOpen={isOpen}
      onToggle={onToggle}
      onSave={handleSave}
    >
      {/* Type selector */}
      <ToggleGroup
        type="single"
        value={draft.type}
        onValueChange={(val) => { if (val) handleTypeChange(val as LivehendelsesType) }}
        variant="outline"
        size="sm"
        className="flex-wrap justify-start w-full"
      >
        {TYPER.map((type) => (
          <ToggleGroupItem key={type} value={type}>
            {type}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Formula box — unique text per type */}
      <div className="rounded-md bg-muted px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
        {config.formula}
      </div>

      {/* Amount input */}
      <SparemaalBelopInput
        value={draft.mål}
        onChange={handleMålChange}
        placeholder={config.placeholder}
        ariaLabel={`Sparemål for ${draft.type} i kroner`}
      />

      {/* Per-type hint below input */}
      <p className="text-xs text-muted-foreground">{config.hint}</p>
    </SparemaalKort>
  )
}

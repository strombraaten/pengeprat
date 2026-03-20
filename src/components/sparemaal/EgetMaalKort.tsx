import { useState } from "react"
import { Trash } from "@phosphor-icons/react"
import type { EgetMaal } from "@/types/sparemaal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SparemaalKort } from "./SparemaalKort"
import { SparemaalBelopInput } from "./SparemaalBelopInput"

interface EgetMaalKortProps {
  data: EgetMaal
  isOpen: boolean
  onToggle: () => void
  onSave: (updated: EgetMaal) => void
  onDelete: (id: string) => void
}

/**
 * User-defined custom savings goal card.
 * Allows setting a name, optional description, and target amount.
 */
export function EgetMaalKort({
  data,
  isOpen,
  onToggle,
  onSave,
  onDelete,
}: EgetMaalKortProps) {
  const [navn, setNavn] = useState(data.navn)
  const [beskrivelse, setBeskrivelse] = useState(data.beskrivelse ?? "")
  const [mål, setMål] = useState<number | null>(data.mål)

  const canSave = navn.trim().length > 0 && mål != null && mål > 0

  function handleSave() {
    if (!canSave) return
    onSave({
      ...data,
      navn: navn.trim(),
      beskrivelse: beskrivelse.trim() || undefined,
      mål,
      bekreftet: true,
    })
  }

  return (
    <SparemaalKort
      id={data.id}
      navn={navn || "Eget mål"}
      farge={data.farge}
      beskrivelse={beskrivelse || undefined}
      mål={mål}
      bekreftet={data.bekreftet}
      isOpen={isOpen}
      onToggle={onToggle}
      onSave={handleSave}
    >
      {/* Name field */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground" htmlFor={`navn-${data.id}`}>
          Navn på mål
        </label>
        <Input
          id={`navn-${data.id}`}
          type="text"
          placeholder="f.eks. Drømmereise til Japan"
          value={navn}
          onChange={(e) => setNavn(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Optional description */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs font-medium text-foreground"
          htmlFor={`beskrivelse-${data.id}`}
        >
          Beskrivelse{" "}
          <span className="font-normal text-muted-foreground">(valgfritt)</span>
        </label>
        <Input
          id={`beskrivelse-${data.id}`}
          type="text"
          placeholder="Hva er dette sparemålet til?"
          value={beskrivelse}
          onChange={(e) => setBeskrivelse(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Amount input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">Målbeløp</label>
        <SparemaalBelopInput
          value={mål}
          onChange={setMål}
          placeholder="Skriv inn beløp"
          ariaLabel={`Sparemål for ${navn || "eget mål"} i kroner`}
        />
      </div>

      {/* Delete action */}
      <div className="pt-1 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(data.id)}
        >
          <Trash />
          Slett dette målet
        </Button>
      </div>
    </SparemaalKort>
  )
}

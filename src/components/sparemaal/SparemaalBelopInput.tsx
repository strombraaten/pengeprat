import { useState } from "react"
import { Input } from "@/components/ui/input"

interface SparemaalBelopInputProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  /** Optional label for screen readers */
  ariaLabel?: string
}

function parseNummer(str: string): number | null {
  const renset = str.replace(/\s/g, "").replace(/,/g, "")
  const tall = parseInt(renset, 10)
  return isNaN(tall) ? null : tall
}

function formatNummer(n: number | null): string {
  return n != null ? n.toLocaleString("nb-NO") : ""
}

/**
 * Number input with Norwegian formatting (space as thousands separator).
 * Shows the formatted prop value when unfocused, switches to a free-form
 * draft while focused — flushing to parent only on blur/Enter.
 */
export function SparemaalBelopInput({
  value,
  onChange,
  placeholder = "Skriv inn beløp",
  ariaLabel,
}: SparemaalBelopInputProps) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState("")

  const displayValue = focused ? draft : formatNummer(value)

  function handleFocus() {
    setDraft(formatNummer(value))
    setFocused(true)
  }

  function handleBlur() {
    setFocused(false)
    flush()
  }

  function flush() {
    const parsed = parseNummer(draft)
    const next = parsed != null && parsed > 0 ? parsed : null
    onChange(next)
  }

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9 ]*"
        autoComplete="off"
        placeholder={placeholder}
        value={displayValue}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
        }}
        className="pr-8"
      />
      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
        kr
      </span>
    </div>
  )
}

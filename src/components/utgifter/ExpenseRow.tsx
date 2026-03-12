import type React from "react"
import { Button } from "@/components/ui/button"
import { X } from "@phosphor-icons/react"

interface ExpenseRowProps {
  label: string
  amount: number
  onAmountChange: (amount: number) => void
  onDelete: () => void
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({
  label,
  amount,
  onAmountChange,
  onDelete,
}) => {
  return (
    <div className="flex items-center gap-3 border-b border-border/50 py-2 last:border-b-0">
      <span className="flex-1 text-sm text-foreground">{label}</span>

      {/* Amount input */}
      <div className="relative w-28">
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(parseInt(e.target.value) || 0)}
          min="0"
          step="100"
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-right text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label={`${label}, beløp i kroner`}
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          kr
        </span>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 w-8 p-0"
        aria-label={`Fjern ${label}`}
      >
        <X size={16} />
      </Button>
    </div>
  )
}

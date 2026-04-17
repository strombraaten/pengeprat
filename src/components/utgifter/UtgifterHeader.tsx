import type React from "react"
import { formatKr, calculateGrandTotal } from "@/lib/utgifter-utils"
import type { ExpenseCategory } from "@/types/utgifter"

interface UtgifterHeaderProps {
  categories: ExpenseCategory[]
}

export const UtgifterHeader: React.FC<UtgifterHeaderProps> = ({ categories }) => {
  const total = calculateGrandTotal(categories)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Månedlige faste utgifter</h1>
          <p className="text-sm text-muted-foreground">Privatøkonomi-oversikt for Norge</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Totalt per måned
          </div>
          <div className="text-3xl font-bold text-foreground">{formatKr(total)}</div>
        </div>
      </div>
    </div>
  )
}

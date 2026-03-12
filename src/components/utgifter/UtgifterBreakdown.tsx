import type React from "react"
import {
  calculateGrandTotal,
  calculatePercentage,
  formatKr,
  formatAnnual,
  getCategoriesWithData,
} from "@/lib/utgifter-utils"
import type { ExpenseCategory } from "@/types/utgifter"
import { CATEGORY_COLORS } from "@/lib/utgifter-data"
import { Separator } from "@/components/ui/separator"

interface UtgifterBreakdownProps {
  categories: ExpenseCategory[]
}

export const UtgifterBreakdown: React.FC<UtgifterBreakdownProps> = ({ categories }) => {
  const total = calculateGrandTotal(categories)
  const categoriesWithData = getCategoriesWithData(categories)

  return (
    <div className="lg:sticky lg:top-20 space-y-4">
      {/* Fordeling card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Fordeling per kategori</h2>

        {total === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Legg inn beløp for å se fordeling.
          </p>
        ) : (
          <div className="space-y-4">
            {categoriesWithData.map((cat, index) => {
              const percentage = calculatePercentage(cat.total, total)
              const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]

              return (
                <div key={cat.id}>
                  {/* Row with name and amount */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-muted-foreground truncate">{cat.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground flex-shrink-0">
                      {formatKr(cat.total)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>

                  {/* Percentage text */}
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              )
            })}

            {/* Separator */}
            <Separator className="my-3" />

            {/* Annual stat pill */}
            <div className="rounded-lg bg-surface p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Totalt per år
              </div>
              <div className="text-lg font-bold text-foreground">{formatAnnual(total)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

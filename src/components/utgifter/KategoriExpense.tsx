import type React from "react"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ExpenseRow } from "./ExpenseRow"
import { calculateCategoryTotal, formatKr } from "@/lib/utgifter-utils"
import type { ExpenseCategory, ExpenseItemId } from "@/types/utgifter"
import { CaretDown, Plus } from "@phosphor-icons/react"
import * as PhosphorIcons from "@phosphor-icons/react"

interface KategoriExpenseProps {
  category: ExpenseCategory
  isExpanded: boolean
  onToggleExpand: () => void
  onAmountChange: (itemId: ExpenseItemId, amount: number) => void
  onRemoveItem: (itemId: ExpenseItemId) => void
  onAddItem: (label: string, amount: number) => void
}

// Type-safe icon mapping
type PhosphorIconComponent = React.FC<{ size?: number; weight?: string; className?: string }>

const ICON_MAP: Record<string, PhosphorIconComponent> = {
  House: PhosphorIcons.House,
  CreditCard: PhosphorIcons.CreditCard,
  Car: PhosphorIcons.Car,
  Phone: PhosphorIcons.Phone,
  Shield: PhosphorIcons.Shield,
  ShoppingCart: PhosphorIcons.ShoppingCart,
  Smiley: PhosphorIcons.Smiley,
  Baby: PhosphorIcons.Baby,
}

export const KategoriExpense: React.FC<KategoriExpenseProps> = ({
  category,
  isExpanded,
  onToggleExpand,
  onAmountChange,
  onRemoveItem,
  onAddItem,
}) => {
  const [newItemLabel, setNewItemLabel] = useState("")
  const [newItemAmount, setNewItemAmount] = useState(0)

  const total = calculateCategoryTotal(category)
  const IconComponent = ICON_MAP[category.icon] as PhosphorIconComponent | undefined

  const handleAddItem = () => {
    if (newItemLabel.trim()) {
      onAddItem(newItemLabel, newItemAmount)
      setNewItemLabel("")
      setNewItemAmount(0)
    }
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between gap-3 border-b border-border bg-muted px-5 py-3 hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-3">
              {IconComponent && <IconComponent size={20} className="text-primary" />}
              <span className="font-semibold text-foreground">{category.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {total > 0 && (
                <span className="text-sm font-semibold text-foreground">{formatKr(total)}</span>
              )}
              <CaretDown
                size={16}
                className="transition-transform duration-200"
                style={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Body */}
        <CollapsibleContent className="px-5 py-4">
          <div className="space-y-2">
            {/* Expense items */}
            {category.items.map((item) => (
              <ExpenseRow
                key={item.id}
                label={item.label}
                amount={item.amount}
                onAmountChange={(amount) => onAmountChange(item.id, amount)}
                onDelete={() => onRemoveItem(item.id)}
              />
            ))}

            {/* Add new item row */}
            <div className="border-t border-dashed border-border/50 pt-3 mt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ny post…"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  className="flex-1 rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Navn på ny utgiftspost"
                />
                <input
                  type="number"
                  placeholder="0"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(parseInt(e.target.value) || 0)}
                  min="0"
                  step="100"
                  className="w-24 rounded-md border border-dashed border-border bg-background px-3 py-2 text-right text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Beløp for ny post i kroner"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddItem}
                  className="gap-1"
                >
                  <Plus size={16} />
                  Legg til
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

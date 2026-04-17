import type { ExpenseCategory, Presets } from "@/types/utgifter"

// ═══════════════════════════════════════════════════════════════════════════════
// Default Categories with Expense Items
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  {
    id: "bolig",
    name: "Bolig",
    icon: "House",
    items: [
      { id: "boliglan", label: "Boliglån / Husleie", amount: 12000 },
      { id: "strom", label: "Strøm", amount: 1200 },
      { id: "kommunale", label: "Kommunale avgifter", amount: 400 },
    ],
  },
  {
    id: "lan",
    name: "Lån",
    icon: "CreditCard",
    items: [
      { id: "studielan", label: "Studielån (Lånekassen)", amount: 4500 },
      { id: "forbrukslan", label: "Forbrukslån / Kreditt", amount: 0 },
    ],
  },
  {
    id: "transport",
    name: "Transport",
    icon: "Car",
    items: [
      { id: "kollektiv", label: "Månedskort kollektivt", amount: 800 },
      { id: "billaan", label: "Billån / leasing", amount: 0 },
      { id: "drivstoff", label: "Drivstoff & parkering", amount: 800 },
      { id: "bilforsikring", label: "Bilforsikring", amount: 600 },
    ],
  },
  {
    id: "kommunikasjon",
    name: "Kommunikasjon",
    icon: "Phone",
    items: [
      { id: "internett", label: "Internett (bredbånd)", amount: 499 },
      { id: "mobil", label: "Mobilabonnement", amount: 349 },
    ],
  },
  {
    id: "forsikringer",
    name: "Forsikringer",
    icon: "Shield",
    items: [
      { id: "innbo", label: "Innboforsikring", amount: 200 },
      { id: "reise", label: "Reiseforsikring", amount: 150 },
    ],
  },
  {
    id: "mat",
    name: "Mat og husholdning",
    icon: "ShoppingCart",
    items: [
      { id: "dagligvarer", label: "Dagligvarer", amount: 3500 },
      { id: "restaurant", label: "Restaurant/takeaway", amount: 500 },
    ],
  },
  {
    id: "fritid",
    name: "Abonnementer",
    icon: "Smiley",
    items: [
      { id: "treningssenter", label: "Treningssenter", amount: 399 },
      { id: "netflix", label: "Netflix", amount: 179 },
      { id: "spotify", label: "Spotify", amount: 119 },
      { id: "viaplay", label: "Viaplay / Max / andre", amount: 0 },
    ],
  },
  {
    id: "barn",
    name: "Barn",
    icon: "Baby",
    items: [
      { id: "barnehage", label: "Barnehage (maks.pris 2024)", amount: 0 },
      { id: "sfo", label: "SFO / AKS", amount: 0 },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// Preset Scenarios
// ═══════════════════════════════════════════════════════════════════════════════

export const PRESETS: Presets = {
  student: {
    boliglan: 6500,
    strom: 600,
    kommunale: 180,
    internett: 399,
    studielan: 4500,
    forbrukslan: 0,
    kollektiv: 800,
    billaan: 0,
    drivstoff: 0,
    bilforsikring: 0,
    mobil: 199,
    innbo: 149,
    reise: 0,
    dagligvarer: 2500,
    restaurant: 250,
    treningssenter: 0,
    netflix: 59,
    spotify: 119,
    viaplay: 0,
    barnehage: 0,
    sfo: 0,
  },
  singel: {
    boliglan: 9500,
    strom: 850,
    kommunale: 300,
    internett: 499,
    studielan: 3000,
    forbrukslan: 0,
    kollektiv: 800,
    billaan: 0,
    drivstoff: 0,
    bilforsikring: 0,
    mobil: 349,
    innbo: 200,
    reise: 150,
    dagligvarer: 3000,
    restaurant: 600,
    treningssenter: 399,
    netflix: 179,
    spotify: 119,
    viaplay: 0,
    barnehage: 0,
    sfo: 0,
  },
  par: {
    boliglan: 14500,
    strom: 1400,
    kommunale: 600,
    internett: 599,
    studielan: 2000,
    forbrukslan: 0,
    kollektiv: 0,
    billaan: 3500,
    drivstoff: 1200,
    bilforsikring: 750,
    mobil: 349,
    innbo: 280,
    reise: 200,
    dagligvarer: 5500,
    restaurant: 1000,
    treningssenter: 399,
    netflix: 199,
    spotify: 119,
    viaplay: 149,
    barnehage: 0,
    sfo: 0,
  },
  familie: {
    boliglan: 16000,
    strom: 2000,
    kommunale: 800,
    internett: 599,
    studielan: 0,
    forbrukslan: 0,
    kollektiv: 0,
    billaan: 4500,
    drivstoff: 1800,
    bilforsikring: 900,
    mobil: 349,
    innbo: 350,
    reise: 350,
    dagligvarer: 7500,
    restaurant: 1200,
    treningssenter: 0,
    netflix: 199,
    spotify: 119,
    viaplay: 149,
    barnehage: 3315,
    sfo: 2500,
  },
  snartpensjonist: {
    boliglan: 7000,
    strom: 1600,
    kommunale: 600,
    internett: 499,
    studielan: 0,
    forbrukslan: 0,
    kollektiv: 400,
    billaan: 1500,
    drivstoff: 1200,
    bilforsikring: 700,
    mobil: 349,
    innbo: 280,
    reise: 400,
    dagligvarer: 5500,
    restaurant: 1200,
    treningssenter: 450,
    netflix: 199,
    spotify: 119,
    viaplay: 149,
    barnehage: 0,
    sfo: 0,
  },
  pensjonist: {
    boliglan: 3500,
    strom: 1600,
    kommunale: 700,
    internett: 499,
    studielan: 0,
    forbrukslan: 0,
    kollektiv: 800,
    billaan: 0,
    drivstoff: 800,
    bilforsikring: 500,
    mobil: 299,
    innbo: 280,
    reise: 600,
    dagligvarer: 5500,
    restaurant: 1800,
    treningssenter: 350,
    netflix: 179,
    spotify: 99,
    viaplay: 0,
    barnehage: 0,
    sfo: 0,
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category Colors (for breakdown visualization)
// ═══════════════════════════════════════════════════════════════════════════════

export const CATEGORY_COLORS = [
  "oklch(0.62 0.10 250)",  // slate-blue
  "oklch(0.65 0.10 65)",   // amber
  "oklch(0.62 0.13 295)",  // purple
  "oklch(0.64 0.11 22)",   // orange-red
  "oklch(0.64 0.09 210)",  // sky-blue
  "oklch(0.63 0.12 340)",  // rose-pink
  "oklch(0.62 0.10 140)",  // yellow-green
  "oklch(0.60 0.09 175)",  // teal
]

// ═══════════════════════════════════════════════════════════════════════════════
// Preset Display Labels
// ═══════════════════════════════════════════════════════════════════════════════

export const PRESET_LABELS: Record<string, string> = {
  student: "🎓 Student",
  singel: "🏠 Singel/leietaker",
  par: "👫 Par med boliglån",
  familie: "👨‍👩‍👧 Barnefamilie",
  snartpensjonist: "🏡 Snart pensjonist",
  pensjonist: "🌿 Pensjonist",
}

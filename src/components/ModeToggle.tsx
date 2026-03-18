import * as React from "react"
import { Sun, Moon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const [, setTheme] = React.useState<"light" | "dark">("light")

  // Sync React state to match what the inline <head> script already applied
  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  function toggle() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      document.documentElement.classList[next === "dark" ? "add" : "remove"]("dark")
      localStorage.setItem("theme", next)
      return next
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Bytt fargetema"
      className="text-muted-foreground hover:text-foreground"
    >
      {/* Sol: synlig i lys modus, skjult i mørk */}
      <Sun
        size={18}
        className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 absolute"
      />
      {/* Måne: skjult i lys modus, synlig i mørk */}
      <Moon
        size={18}
        className="scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 absolute"
      />
      <span className="sr-only">Bytt fargetema</span>
    </Button>
  )
}

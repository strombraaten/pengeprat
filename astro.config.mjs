// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"

// https://astro.build/config
export default defineConfig({
  site: "https://pengeprat.simenlager.no",
  vite: {
    // @tailwindcss/vite bruker en nyere Vite enn Astro 5, så typene er ikke
    // helt like. Pluginen fungerer fint — castingen skjuler bare typeavviket.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
  integrations: [react()],
})

# Pengeprat – Prosjektminne

## Prosjektstruktur
- Astro + Preact-app: `src/` (eksisterende, ikke aktiv utvikling)
- **Aktiv MVP**: `sparekalkulator/` – vanilla HTML/CSS/JS, single-file SPA
- Spec: `documentation/sparekalkulator_spec.md`

## Sparekalkulator MVP (sparekalkulator/)
Bygget fra scratch som vanilla HTML/CSS/JS etter spec.

**Filer:**
- `index.html` – alle 4 views som `<section class="view">`
- `style.css` – portert fra Astro-prosjektets global.css + view-switching
- `js/state.js` – mutable state-objekt + localStorage (key: `pengeprat_sparekalkulator_v3`)
- `js/beregninger.js` – KATEGORIER-config, beregningsfunksjoner, omfordeling
- `js/router.js` – `visView(id)` med cachede DOM-refs
- `js/main.js` – event listeners, render-funksjoner, init

**4 views:** `inngang` → `oversikt` → `detalj` (dynamisk, én for alle 6 poster) → `oppsummering`

**State-modell:** Kronerbasert (`månedlig`), ikke prosent-basert
**Standardfordeling:** 65% faste, 9.2% buffer, 8.3% guiltFree, 7.5% ferie, 5.8% storeLivshendelser, 4.2% pensjon
**Avrunding:** Faste utgifter → nærmeste 100 kr, øvrige → nærmeste 50 kr

## Fase 1 (MVP) – implementert
- Inngangsside med `type="text" inputmode="numeric"` lønn-input
- Oversikt med fargebar + 6 klikkbare kort
- Detaljsider: slider (eller tekstinput for faste), alleredeSpart, tidshorisont
- Oppsummering med "Kopier til utklippstavle"
- Omfordeling: fordelLikt + justerTilTotal (fasteUtgifter-endring: proporsjonal)
- localStorage-lagring ved hver endring

## Fase 2 (ikke implementert)
- Kredittkortgjeld-modal (`<dialog>`)
- "La meg velge" for omfordeling
- Mål nådd-logikk
- Storlivshendelser-checkboxer (bryllup/barn/bil)
- Advarsler og validering (seksjon 6.3 og 9 i spec)

## Dev-server
`.claude/launch.json` – kjøres med `npx serve sparekalkulator -p 4321`

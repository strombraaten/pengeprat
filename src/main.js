// ─── Designsystemet – felles entry-point for alle tre sider ──────────────────
//
// Denne filen importeres av index.html, pengeprat/index.html og
// uventet-sum/index.html via <script type="module" src="/src/main.js">.
//
// Rekkefølgen på importene er KRITISK:
//   1. reset.css  → @layer pengeprat.reset (lavest prioritet – taper mot DS)
//   2. Web components (registrerer <ds-field>, <ds-tabs> etc. globalt)
//   3. Tema-CSS (setter --ds-color-*, --ds-size-* og andre tokens)
//   4. Komponent-CSS (.ds-button, .ds-input etc.)
//
// reset.css MÅ importeres FØR DS fordi CSS-lag som erklæres tidligere
// i kilden har LAVERE prioritet enn lag erklært senere.
// Dermed: @layer pengeprat.reset < @layer ds.* – DS-komponenter vinner.

// Basis-reset i et lavprioritets-lag (se src/reset.css for forklaring)
import './reset.css';

// Registrerer alle <ds-*> web components og polyfills én gang
import '@digdir/designsystemet-web';

// Digdir-standardtema: CSS custom properties for farger, størrelser og typografi.
// Aktiveres via data-ds-color-mode="light" på <html>-elementet.
// Eksportert som "./theme.css" i pakken sin exports-konfig.
import '@digdir/designsystemet-css/theme.css';

// CSS-klasser for alle komponenter i Designsystemet (.ds-button, .ds-input, .ds-card etc.)
// Eksportert som "." (default) i pakken sin exports-konfig.
import '@digdir/designsystemet-css';

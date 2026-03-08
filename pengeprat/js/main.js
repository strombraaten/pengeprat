import { state, lagreState, lastState, tilbakestillState } from './state.js';
import {
  KATEGORIER,
  formatKr,
  formaterTidshorisont,
  beregnStandardfordeling,
  beregnBufferMål,
  beregnGuiltFreeRange,
  beregnMånederTilMål,
  beregnKrPerUke,
  omfordelEtterFasteUtgifter,
  fordelLikt,
  sliderMin,
  sliderMax,
} from './beregninger.js';
import { visView } from './router.js';

// ─── UI-state (ikke del av app-state) ────────────────────────────────────────

let aktivPost = null;

// ─── DOM-referanser (cachede) ────────────────────────────────────────────────

const el = {
  // Inngang
  lønnInput: document.getElementById('lønn-input'),
  startKnapp: document.getElementById('start-knapp'),

  // Oversikt
  oversiktLønn: document.getElementById('oversikt-lønn'),
  oversiktBar: document.getElementById('oversikt-bar'),
  oversiktKort: document.getElementById('oversikt-kort'),
  oversiktTotal: document.getElementById('oversikt-total'),
  endreLønnKnapp: document.getElementById('endre-lønn-knapp'),
  seOppsummeringKnapp: document.getElementById('se-oppsummering-knapp'),
  tilbakestillKnapp: document.getElementById('tilbakestill-knapp'),

  // Detalj
  detaljTilbakeKnapp: document.getElementById('detalj-tilbake-knapp'),
  detaljTittel: document.getElementById('detalj-tittel'),
  detaljBeløp: document.getElementById('detalj-beløp'),
  detaljForklaring: document.getElementById('detalj-forklaring'),

  detaljFasteGruppe: document.getElementById('detalj-faste-gruppe'),
  detaljFasteInput: document.getElementById('detalj-faste-input'),

  detaljSliderGruppe: document.getElementById('detalj-slider-gruppe'),
  detaljSlider: document.getElementById('detalj-slider'),
  detaljSliderVerdi: document.getElementById('detalj-slider-verdi'),
  detaljSliderMin: document.getElementById('detalj-slider-min'),
  detaljSliderMax: document.getElementById('detalj-slider-max'),

  detaljSpartGruppe: document.getElementById('detalj-spart-gruppe'),
  detaljSpartInput: document.getElementById('detalj-spart-input'),

  detaljMålInputGruppe: document.getElementById('detalj-mål-input-gruppe'),
  detaljMålInput: document.getElementById('detalj-mål-input'),

  detaljTidshorisonGruppe: document.getElementById('detalj-tidshorisont-gruppe'),
  detaljMålLabel: document.getElementById('detalj-mål-label'),
  detaljMålVerdi: document.getElementById('detalj-mål-verdi'),
  detaljMangler: document.getElementById('detalj-mangler'),
  detaljTid: document.getElementById('detalj-tid'),

  detaljUkeGruppe: document.getElementById('detalj-uke-gruppe'),
  detaljPerUke: document.getElementById('detalj-per-uke'),

  detaljPensjonGruppe: document.getElementById('detalj-pensjon-gruppe'),
  detaljPensjonÅr: document.getElementById('detalj-pensjon-år'),
  detaljPensjonAdvarsel: document.getElementById('detalj-pensjon-advarsel'),

  detaljLagreKnapp: document.getElementById('detalj-lagre-knapp'),

  // Oppsummering
  oppsummeringOverføringer: document.getElementById('oppsummering-overføringer'),
  oppsummeringKontekstTekst: document.getElementById('oppsummering-kontekst-tekst'),
  tilbakeTilOversiktKnapp: document.getElementById('tilbake-til-oversikt-knapp'),
  bekreftWrapper: document.getElementById('bekreft-wrapper'),
  bekreftKnapp1: document.getElementById('bekreft-knapp-1'),
  bekreftSteg2: document.getElementById('bekreft-steg-2'),
  bekreftKnapp2: document.getElementById('bekreft-knapp-2'),

  // Feiring
  feiringTilbakeKnapp: document.getElementById('feiring-tilbake-knapp'),
};

// ─── Inngang: event listeners ────────────────────────────────────────────────

el.lønnInput.addEventListener('input', () => {
  const verdi = parseNummer(el.lønnInput.value);
  el.startKnapp.disabled = !(verdi >= 1000);
});

el.lønnInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !el.startKnapp.disabled) {
    startMedLønn();
  }
});

el.startKnapp.addEventListener('click', startMedLønn);

function startMedLønn() {
  const lønn = parseNummer(el.lønnInput.value);
  if (!lønn || lønn < 1000) return;

  state.lønn = lønn;

  const fordeling = beregnStandardfordeling(lønn);
  for (const [key, beløp] of Object.entries(fordeling)) {
    state.poster[key].månedlig = beløp;
  }

  // Sett avledede verdier
  state.poster.buffer.mål = beregnBufferMål(lønn);
  const range = beregnGuiltFreeRange(lønn);
  state.poster.guiltFree.anbefaltMin = range.min;
  state.poster.guiltFree.anbefaltMaks = range.maks;

  lagreState();
  rendreOversikt();
  visView('oversikt');
}

// ─── Oversikt: event listeners ───────────────────────────────────────────────

el.endreLønnKnapp.addEventListener('click', () => {
  el.lønnInput.value = state.lønn ?? '';
  el.startKnapp.disabled = false;
  visView('inngang');
  el.lønnInput.focus();
});

el.seOppsummeringKnapp.addEventListener('click', () => {
  rendreOppsummering();
  visView('oppsummering');
});

// Delegert klikk på kortene
el.oversiktKort.addEventListener('click', (e) => {
  const kort = e.target.closest('[data-post-id]');
  if (kort) åpneDetalj(kort.dataset.postId);
});

el.tilbakestillKnapp.addEventListener('click', () => {
  const fordeling = beregnStandardfordeling(state.lønn);
  for (const [key, beløp] of Object.entries(fordeling)) {
    state.poster[key].månedlig = beløp;
  }
  for (const key of Object.keys(state.interaksjon)) {
    state.interaksjon[key] = false;
  }
  lagreState();
  rendreOversikt();
});

// ─── Detalj: event listeners ─────────────────────────────────────────────────

el.detaljTilbakeKnapp.addEventListener('click', gåTilOversikt);
el.detaljLagreKnapp.addEventListener('click', gåTilOversikt);

el.detaljFasteInput.addEventListener('input', () => {
  const ny = parseNummer(el.detaljFasteInput.value);
  if (!ny || ny <= 0 || ny >= state.lønn) return;

  omfordelEtterFasteUtgifter(ny, state.lønn, state.poster);
  state.interaksjon.fasteUtgifter = true;
  lagreState();
  oppdaterDetaljVisning();
});

el.detaljSlider.addEventListener('input', () => {
  const ny = Number(el.detaljSlider.value);
  if (!aktivPost) return;

  const gammel = state.poster[aktivPost].månedlig;
  const differanse = ny - gammel;
  state.poster[aktivPost].månedlig = ny;

  const andrePoster = Object.keys(state.poster).filter(
    (k) => k !== aktivPost && k !== 'fasteUtgifter'
  );
  fordelLikt(differanse, andrePoster, state.poster, state.lønn);

  state.interaksjon[aktivPost] = true;
  lagreState();
  oppdaterDetaljVisning();
});

el.detaljSpartInput.addEventListener('input', () => {
  if (!aktivPost) return;
  const verdi = parseNummer(el.detaljSpartInput.value) ?? 0;
  state.poster[aktivPost].alleredeSpart = verdi;
  lagreState();
  oppdaterDetaljVisning();
});

el.detaljMålInput.addEventListener('input', () => {
  if (aktivPost !== 'storeLivshendelser') return;
  const verdi = parseNummer(el.detaljMålInput.value) ?? null;
  state.poster.storeLivshendelser.mål = verdi;
  lagreState();
  oppdaterDetaljVisning();
});

// ─── Oppsummering: event listeners ───────────────────────────────────────────

el.tilbakeTilOversiktKnapp.addEventListener('click', gåTilOversikt);

el.bekreftKnapp1.addEventListener('click', () => {
  el.bekreftKnapp1.classList.add('hidden');
  el.bekreftSteg2.classList.remove('hidden');
});

el.bekreftKnapp2.addEventListener('click', async () => {
  const { default: confetti } = await import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.module.mjs');
  confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } }), 250);
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } }), 400);
  setTimeout(() => visView('feiring'), 1200);
});

el.feiringTilbakeKnapp.addEventListener('click', () => {
  rendreOppsummering();
  visView('oppsummering');
});

// ─── Navigasjon ───────────────────────────────────────────────────────────────

function gåTilOversikt() {
  rendreOversikt();
  visView('oversikt');
}

// ─── Render: Oversikt ─────────────────────────────────────────────────────────

function rendreOversikt() {
  el.oversiktLønn.textContent = formatKr(state.lønn);
  el.oversiktTotal.textContent = formatKr(state.lønn);

  // Bar
  el.oversiktBar.innerHTML = KATEGORIER.map((kat) => {
    const beløp = state.poster[kat.id]?.månedlig ?? 0;
    const prosent = state.lønn > 0 ? (beløp / state.lønn) * 100 : 0;
    return `<div class="bar-segment" style="width:${prosent}%;background:${kat.farge};"></div>`;
  }).join('');

  // Kort
  el.oversiktKort.innerHTML = KATEGORIER.map((kat) => {
    const beløp = state.poster[kat.id]?.månedlig ?? 0;
    const interagert = state.interaksjon[kat.id];
    return `
      <div class="project-item" data-post-id="${kat.id}">
        <div class="project-dot" style="background:${kat.farge};"></div>
        <div class="project-content">
          <span class="project-name">${kat.navn}</span>
          <span class="project-beskrivelse">${kat.beskrivelse}</span>
        </div>
        <span class="project-beløp">${formatKr(beløp)}/mnd</span>
        <span class="project-arrow">${interagert ? '✓' : '→'}</span>
      </div>
    `;
  }).join('');

  // Vis/skjul tilbakestill-knapp
  const harEndringer = Object.values(state.interaksjon).some((v) => v);
  if (harEndringer) {
    el.tilbakestillKnapp.classList.remove('hidden');
  } else {
    el.tilbakestillKnapp.classList.add('hidden');
  }
}

// ─── Render: Detalj ───────────────────────────────────────────────────────────

function åpneDetalj(postId) {
  aktivPost = postId;
  const kat = KATEGORIER.find((k) => k.id === postId);
  const post = state.poster[postId];

  // Tekst
  el.detaljTittel.textContent = kat.navn;
  el.detaljForklaring.textContent = kat.forklaring;

  // Skjul alle betingede seksjoner
  el.detaljFasteGruppe.classList.add('hidden');
  el.detaljSliderGruppe.classList.add('hidden');
  el.detaljSpartGruppe.classList.add('hidden');
  el.detaljMålInputGruppe.classList.add('hidden');
  el.detaljTidshorisonGruppe.classList.add('hidden');
  el.detaljUkeGruppe.classList.add('hidden');
  el.detaljPensjonGruppe.classList.add('hidden');

  if (kat.inputType === 'tekst') {
    el.detaljFasteInput.value = post.månedlig ?? '';
    el.detaljFasteGruppe.classList.remove('hidden');
  } else {
    const min = sliderMin();
    const max = sliderMax(state.lønn, kat.sliderMaxFaktor);
    el.detaljSlider.min = min;
    el.detaljSlider.max = max;
    el.detaljSlider.value = post.månedlig ?? 0;
    el.detaljSliderMin.textContent = formatKr(min);
    el.detaljSliderMax.textContent = formatKr(max);
    el.detaljSliderGruppe.classList.remove('hidden');
  }

  if (kat.harAlleredeSpart) {
    el.detaljSpartInput.value = post.alleredeSpart > 0 ? post.alleredeSpart : '';
    el.detaljSpartGruppe.classList.remove('hidden');
  }

  if (kat.harMålInput) {
    el.detaljMålInput.value = post.mål ?? '';
    el.detaljMålInputGruppe.classList.remove('hidden');
  }

  if (kat.harKrPerUke) {
    el.detaljUkeGruppe.classList.remove('hidden');
  }

  if (kat.harPensjonVisning) {
    el.detaljPensjonGruppe.classList.remove('hidden');
  }

  oppdaterDetaljVisning();
  visView('detalj');
}

function oppdaterDetaljVisning() {
  if (!aktivPost) return;
  const kat = KATEGORIER.find((k) => k.id === aktivPost);
  const post = state.poster[aktivPost];
  const månedlig = post.månedlig ?? 0;

  // Beløp-visning (både header og slider-verdi)
  el.detaljBeløp.textContent = formatKr(månedlig);
  if (kat.inputType === 'slider') {
    el.detaljSliderVerdi.textContent = formatKr(månedlig);
    el.detaljSlider.value = månedlig;
  }

  // Tidshorisont
  if (kat.harTidshorisont) {
    const mål = post.mål;
    const alleredeSpart = post.alleredeSpart ?? 0;

    if (mål && mål > 0) {
      const mangler = Math.max(0, mål - alleredeSpart);
      const måneder = beregnMånederTilMål(mål, alleredeSpart, månedlig);

      el.detaljMålLabel.textContent = aktivPost === 'buffer' ? 'Buffermål (1,5× lønn)' : 'Mål';
      el.detaljMålVerdi.textContent = formatKr(mål);
      el.detaljMangler.textContent = alleredeSpart >= mål ? '—' : formatKr(mangler);
      el.detaljTid.textContent = formaterTidshorisont(måneder);
      el.detaljTidshorisonGruppe.classList.remove('hidden');
    } else {
      el.detaljTidshorisonGruppe.classList.add('hidden');
    }
  }

  // Guilt-free: kr per uke
  if (kat.harKrPerUke) {
    el.detaljPerUke.textContent = formatKr(beregnKrPerUke(månedlig));
  }

  // Pensjon: årssum + advarsel
  if (kat.harPensjonVisning) {
    el.detaljPensjonÅr.textContent = formatKr(månedlig * 12) + '/år';
    if (månedlig < 1250) {
      el.detaljPensjonAdvarsel.classList.remove('hidden');
    } else {
      el.detaljPensjonAdvarsel.classList.add('hidden');
    }
  }
}

// ─── Render: Oppsummering ─────────────────────────────────────────────────────

function rendreOppsummering() {
  // Neste steg: bare spareposter og pensjon
  const overføringsPoster = KATEGORIER.filter((k) =>
    ['buffer', 'guiltFree', 'ferie', 'storeLivshendelser', 'pensjon'].includes(k.id)
  );

  el.oppsummeringOverføringer.innerHTML = overføringsPoster
    .map((kat) => {
      const beløp = state.poster[kat.id]?.månedlig ?? 0;
      if (beløp === 0) return '';
      const kontoType =
        kat.id === 'pensjon' ? 'IPS (pensjonssparing)' :
        kat.id === 'guiltFree' ? 'forbrukskonto' :
        'sparekonto';
      return `
        <div class="result-row">
          <span class="result-label">→ ${kat.navn}</span>
          <span class="result-value">${formatKr(beløp)}/mnd <span class="text-muted small-text">(${kontoType})</span></span>
        </div>
      `;
    })
    .join('');

  // Tilbakestill bekreft-seksjonen
  el.bekreftKnapp1.classList.remove('hidden');
  el.bekreftSteg2.classList.add('hidden');
  if (!el.bekreftWrapper.contains(el.bekreftKnapp1)) {
    el.bekreftWrapper.innerHTML = '';
    el.bekreftWrapper.appendChild(el.bekreftKnapp1);
    el.bekreftWrapper.appendChild(el.bekreftSteg2);
  }

  // Kontekstuell oppsummeringstekst
  const lønn = formatKr(state.lønn);
  const faste = formatKr(state.poster.fasteUtgifter.månedlig);
  const guiltFree = formatKr(state.poster.guiltFree.månedlig);
  el.oppsummeringKontekstTekst.textContent =
    `Dette er basert på at månedslønnen din er ${lønn}, at du har ${faste} i faste utgifter, ` +
    `og at du bruker ${guiltFree} til hygge og livets opphold den måneden.`;
}

function byggKopierTekst() {
  const linjer = [
    `Pengeprat`,
    ``,
    `Månedslønn: ${formatKr(state.lønn)}`,
    ``,
    ...KATEGORIER.map((kat) => {
      const beløp = state.poster[kat.id]?.månedlig ?? 0;
      return `${kat.navn.padEnd(22)} ${formatKr(beløp)}/mnd`;
    }),
    ``,
    `─────────────────────────────`,
    ``,
    `Neste steg: sett opp faste overføringer i nettbanken`,
    ...KATEGORIER.filter((k) =>
      ['buffer', 'guiltFree', 'ferie', 'storeLivshendelser', 'pensjon'].includes(k.id)
    )
      .filter((kat) => (state.poster[kat.id]?.månedlig ?? 0) > 0)
      .map((kat) => {
        const beløp = state.poster[kat.id]?.månedlig ?? 0;
        return `→ ${formatKr(beløp)} til ${kat.navn}`;
      }),
  ];
  return linjer.join('\n');
}

// ─── Hjelpefunksjoner ─────────────────────────────────────────────────────────

function parseNummer(str) {
  if (!str) return null;
  const renset = String(str).replace(/\s/g, '').replace(/,/g, '');
  const tall = parseInt(renset, 10);
  return isNaN(tall) ? null : tall;
}

// ─── Initialisering ───────────────────────────────────────────────────────────

function init() {
  if (lastState() && state.lønn) {
    el.lønnInput.value = state.lønn;
    el.startKnapp.disabled = false;
    rendreOversikt();
    visView('oversikt');
  } else {
    visView('inngang');
  }
}

init();

// ─── Kategori-konfigurasjon ───────────────────────────────────────────────────

export const KATEGORIER = [
  {
    id: 'fasteUtgifter',
    navn: 'Faste utgifter',
    farge: '#636363',
    beskrivelse: 'Husleie/lån, strøm, forsikring, mat, transport, abonnementer.',
    forklaring:
      'Vi har antatt at dette er 65% av lønna di, men du kan justere det hvis det ikke stemmer. Dette inkluderer alt du er forpliktet til å betale hver måned – husleie eller boliglån, strøm, forsikring, mat, transport og faste abonnementer.',
    inputType: 'tekst',
  },
  {
    id: 'buffer',
    navn: 'Buffer',
    farge: '#6a9fb5',
    beskrivelse: 'Penger på sparekonto for uforutsette utgifter.',
    forklaring:
      'Buffer er nødfondet ditt – pengene du har tilgjengelig hvis noe uventet skjer. Målet er å ha 1,5× månedsinntekten din stående. Dette dekker de fleste uventede utgifter uten at du må ta opp lån eller bruke kredittkort.',
    inputType: 'slider',
    harAlleredeSpart: true,
    harTidshorisont: true,
    sliderMaxFaktor: 0.22,
  },
  {
    id: 'guiltFree',
    navn: 'Guilt-free spending',
    farge: '#b5916a',
    beskrivelse: 'Penger du bruker uten dårlig samvittighet — kaffe, klær, hobbyer, uteliv.',
    forklaring:
      'Dette er pengene du kan bruke uten dårlig samvittighet – en øl på byen, takeaway, en gadget. Dette er ikke grådighet, det er bærekraft. Hvis budsjettet føles som et fengsel, holder du det ikke.',
    inputType: 'slider',
    harKrPerUke: true,
    sliderMaxFaktor: 0.18,
  },
  {
    id: 'ferie',
    navn: 'Ferie',
    farge: '#6ab5a5',
    beskrivelse: 'Spare jevnlig til ferie i stedet for å bruke kredittkort i juni.',
    forklaring:
      'Spare jevnlig til ferie i stedet for å finansiere den med kredittkort. Målet er å ha nok på konto til en skikkelig ferie uten å stresse. Anbefalt sum: 15 000 kr – det dekker en god ferie for de fleste.',
    inputType: 'slider',
    harAlleredeSpart: true,
    harTidshorisont: true,
    sliderMaxFaktor: 0.15,
  },
  {
    id: 'storeLivshendelser',
    navn: 'Store livshendelser',
    farge: '#8a6ab5',
    beskrivelse: 'Bryllup, barn, bil, eller andre store utgifter.',
    forklaring:
      'Dette er pengene du sparer til ting som bryllup, barn, bil, eller andre større utgifter. Statistisk sett kommer mange til å gifte seg, få barn og kjøpe bil. Ved å sette av litt jevnlig slipper du å ta opp forbrukslån når livet skjer.',
    inputType: 'slider',
    harAlleredeSpart: true,
    harTidshorisont: true,
    harMålInput: true,
    sliderMaxFaktor: 0.20,
  },
  {
    id: 'pensjon',
    navn: 'Pensjon',
    farge: '#7ab56a',
    beskrivelse: 'Langsiktig sparing du ikke rører før pensjonsalder.',
    forklaring:
      'Jobbpensjonen dekker sjelden nok – typisk 50–66% av lønna i pensjon. Egen sparing tetter gapet. Jo tidligere du starter, jo mer gjør renters rente for deg. Skattefordel: Du kan spare opptil 15 000 kr/år i individuell pensjonssparing (IPS) og få skattefradrag.',
    inputType: 'slider',
    harPensjonVisning: true,
    sliderMaxFaktor: 0.12,
  },
];

// ─── Formatering ──────────────────────────────────────────────────────────────

export function formatKr(n) {
  if (!n && n !== 0) return '0 kr';
  return Math.round(n).toLocaleString('nb-NO') + ' kr';
}

export function formaterTidshorisont(måneder) {
  if (!isFinite(måneder)) return 'aldri (øk månedlig sparing)';
  if (måneder <= 0) return 'Mål nådd!';
  const år = Math.floor(måneder / 12);
  const rest = måneder % 12;
  if (år === 0) return `~${måneder} måneder`;
  if (rest === 0) return `~${år} år`;
  return `~${år} år, ${rest} mnd`;
}

// ─── Beregning: standardfordeling ────────────────────────────────────────────

export function beregnStandardfordeling(lønn) {
  const fasteUtgifter = Math.round((lønn * 0.65) / 100) * 100;
  const buffer = Math.round((lønn * 0.092) / 50) * 50;
  const guiltFree = Math.round((lønn * 0.083) / 50) * 50;
  const ferie = Math.round((lønn * 0.075) / 50) * 50;
  const storeLivshendelser = Math.round((lønn * 0.058) / 50) * 50;
  const pensjon = Math.round((lønn * 0.042) / 50) * 50;

  const total = fasteUtgifter + buffer + guiltFree + ferie + storeLivshendelser + pensjon;
  const differanse = lønn - total;

  return {
    fasteUtgifter: fasteUtgifter + differanse, // absorber avrundingsdiff
    buffer,
    guiltFree,
    ferie,
    storeLivshendelser,
    pensjon,
  };
}

// ─── Beregning: avledede verdier ──────────────────────────────────────────────

export function beregnBufferMål(lønn) {
  return Math.round((lønn * 1.5) / 100) * 100;
}

export function beregnGuiltFreeRange(lønn) {
  return {
    min: Math.round((lønn * 0.07) / 50) * 50,
    maks: Math.round((lønn * 0.12) / 50) * 50,
  };
}

export function beregnMånederTilMål(mål, alleredeSpart, månedlig) {
  const mangler = Math.max(0, mål - alleredeSpart);
  if (månedlig <= 0) return Infinity;
  return Math.ceil(mangler / månedlig);
}

export function beregnKrPerUke(månedlig) {
  return Math.round((månedlig * 12) / 52);
}

// ─── Beregning: omfordeling ───────────────────────────────────────────────────

/**
 * Skalerer alle poster unntatt fasteUtgifter proporsjonalt når
 * fasteUtgifter endres.
 */
export function omfordelEtterFasteUtgifter(nyeFasteUtgifter, lønn, poster) {
  const tilgjengelig = lønn - nyeFasteUtgifter;
  const andreIds = Object.keys(poster).filter((k) => k !== 'fasteUtgifter');
  const nåværendeSum = andreIds.reduce((s, k) => s + (poster[k].månedlig ?? 0), 0);

  if (nåværendeSum === 0) {
    // Fordel likt dersom alle andre er 0
    const perPost = Math.round(tilgjengelig / andreIds.length / 50) * 50;
    andreIds.forEach((k) => { poster[k].månedlig = perPost; });
  } else {
    const faktor = tilgjengelig / nåværendeSum;
    andreIds.forEach((k) => {
      poster[k].månedlig = Math.round(((poster[k].månedlig ?? 0) * faktor) / 50) * 50;
    });
  }

  poster.fasteUtgifter.månedlig = nyeFasteUtgifter;
  justerTilTotal(lønn, poster);
}

/**
 * Fordeler differansen likt på valgte poster (tar fra dem hvis differanse > 0).
 * Kapper negative verdier på 0 – resten håndteres av justerTilTotal.
 */
export function fordelLikt(differanse, andrePoster, poster, lønn) {
  if (!andrePoster.length) return;
  const perPost = differanse / andrePoster.length;

  andrePoster.forEach((k) => {
    const ny = Math.max(0, (poster[k]?.månedlig ?? 0) - perPost);
    poster[k].månedlig = Math.round(ny / 50) * 50;
  });

  justerTilTotal(lønn, poster);
}

/**
 * Justerer den største posten for å absorbere avrundingsfeil slik at
 * total alltid er lik lønn.
 */
export function justerTilTotal(lønn, poster) {
  const total = Object.values(poster).reduce((s, p) => s + (p.månedlig ?? 0), 0);
  const diff = lønn - total;
  if (diff === 0) return;

  const størstPost = Object.entries(poster).sort(
    (a, b) => (b[1].månedlig ?? 0) - (a[1].månedlig ?? 0)
  )[0];
  størstPost[1].månedlig = (størstPost[1].månedlig ?? 0) + diff;
}

// ─── Slider-hjelpere ─────────────────────────────────────────────────────────

export function sliderMin() {
  return 50;
}

export function sliderMax(lønn, maxFaktor) {
  return Math.round((lønn * maxFaktor) / 50) * 50;
}

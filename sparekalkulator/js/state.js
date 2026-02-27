const STORAGE_KEY = 'pengeprat_sparekalkulator_v3';

export const state = {
  lønn: null,

  poster: {
    fasteUtgifter: {
      månedlig: null,
      standardProsent: 65,
      redigerbar: true,
      harMål: false,
      type: 'utgift',
    },
    buffer: {
      månedlig: null,
      standardProsent: 9.2,
      mål: null,
      alleredeSpart: 0,
      redigerbar: true,
      harMål: true,
      type: 'sparing',
    },
    guiltFree: {
      månedlig: null,
      standardProsent: 8.3,
      anbefaltMin: null,
      anbefaltMaks: null,
      redigerbar: true,
      harMål: false,
      type: 'løpende',
    },
    ferie: {
      månedlig: null,
      standardProsent: 7.5,
      mål: 15000,
      alleredeSpart: 0,
      redigerbar: true,
      harMål: true,
      type: 'sparing',
    },
    storeLivshendelser: {
      månedlig: null,
      standardProsent: 5.8,
      mål: null,
      alleredeSpart: 0,
      redigerbar: true,
      harMål: true,
      type: 'sparing',
    },
    pensjon: {
      månedlig: null,
      standardProsent: 4.2,
      årligMaks: 15000,
      redigerbar: true,
      harMål: false,
      type: 'løpende',
    },
  },

  interaksjon: {
    fasteUtgifter: false,
    buffer: false,
    guiltFree: false,
    ferie: false,
    storeLivshendelser: false,
    pensjon: false,
  },
};

export function lagreState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage utilgjengelig – fortsett uten lagring
  }
}

export function lastState() {
  try {
    const lagret = localStorage.getItem(STORAGE_KEY);
    if (!lagret) return false;

    const parsed = JSON.parse(lagret);
    if (!parsed || typeof parsed.lønn !== 'number' || !parsed.poster) return false;

    // Merge inn lagret data uten å miste nye felt i default-state
    state.lønn = parsed.lønn;
    for (const [key, post] of Object.entries(parsed.poster)) {
      if (state.poster[key]) {
        Object.assign(state.poster[key], post);
      }
    }
    if (parsed.interaksjon) {
      Object.assign(state.interaksjon, parsed.interaksjon);
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function tilbakestillState() {
  localStorage.removeItem(STORAGE_KEY);

  state.lønn = null;

  const defaults = {
    fasteUtgifter: { månedlig: null },
    buffer: { månedlig: null, mål: null, alleredeSpart: 0 },
    guiltFree: { månedlig: null, anbefaltMin: null, anbefaltMaks: null },
    ferie: { månedlig: null, mål: 15000, alleredeSpart: 0 },
    storeLivshendelser: { månedlig: null, mål: null, alleredeSpart: 0 },
    pensjon: { månedlig: null },
  };

  for (const [key, vals] of Object.entries(defaults)) {
    Object.assign(state.poster[key], vals);
  }

  for (const key of Object.keys(state.interaksjon)) {
    state.interaksjon[key] = false;
  }
}

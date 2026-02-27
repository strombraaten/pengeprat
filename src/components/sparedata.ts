export const STORAGE_KEY = 'pengeprat_sparekalkulator_v2';

export const COLORS: Record<string, string> = {
  utgifter: '#636363',
  buffer: '#6a9fb5',
  pensjon: '#7ab56a',
  guiltfree: '#b5916a',
  livshendelser: '#8a6ab5',
  ferie: '#6ab5a5',
};

export interface CategoryConfig {
  id: string;
  name: string;
  defaultPercent: number;
  color: string;
  description: string;
  explanation: string;
  targetLabel?: string;
  targetDefault?: number | 'auto-buffer';
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'utgifter',
    name: 'Faste utgifter',
    defaultPercent: 50,
    color: COLORS.utgifter,
    description: 'Husleie/lån, strøm, forsikring, mat, transport, abonnementer.',
    explanation:
      'Utgangspunktet er at omtrent halvparten av lønna går til faste utgifter. Dette varierer mye — bor du i Oslo med høy husleie kan det fort bli 60 %, mens det i andre deler av landet kan ligge lavere. Juster til det som passer din situasjon.',
  },
  {
    id: 'buffer',
    name: 'Buffer',
    defaultPercent: 15,
    color: COLORS.buffer,
    description: 'Penger på sparekonto for uforutsette utgifter.',
    explanation:
      'Anbefalt størrelse: 1,5 × månedsinntekt. Dette tar utgangspunkt i at du eier bolig men ikke har bil eller barn — altså nok til å dekke f.eks. at oppvaskmaskin og vaskemaskin ryker på kort varsel, en uventet tannlegeregning, eller en måned med uforutsett inntektsbortfall. Har du bil, barn eller andre forpliktelser bør bufferen være større.',
    targetLabel: 'Buffermål',
    targetDefault: 'auto-buffer',
  },
  {
    id: 'pensjon',
    name: 'Pensjon',
    defaultPercent: 10,
    color: COLORS.pensjon,
    description: 'Langsiktig sparing du ikke rører før pensjonsalder.',
    explanation:
      'De fleste har en pensjonsordning gjennom jobb, men den alene gir deg typisk 50–66 % av lønna i pensjon. Egen sparing tetter gapet. Jo tidligere du starter, jo mer gjør renters rente for deg. Selv små beløp over mange år blir betydelige.',
  },
  {
    id: 'guiltfree',
    name: 'Guilt-free spending',
    defaultPercent: 10,
    color: COLORS.guiltfree,
    description: 'Penger du bruker uten dårlig samvittighet — kaffe, klær, hobbyer, uteliv.',
    explanation:
      'Dette er posten som gjør at budsjettet faktisk fungerer i praksis. Uten en bevisst post for fri bruk ender man gjerne opp med å «låne» fra sparing. Ved å sette av et bestemt beløp kan du bruke det med god samvittighet — det er innbakt i planen.',
  },
  {
    id: 'livshendelser',
    name: 'Store livshendelser',
    defaultPercent: 10,
    color: COLORS.livshendelser,
    description: 'Bryllup, barn, bil, eller andre store milepæler.',
    explanation:
      'Statistisk sett kommer mange til å gifte seg i løpet av livet. Et bryllup koster gjerne mellom 50 000 og 250 000 kr avhengig av omfang. Første barn innebærer utstyr, permisjon med redusert inntekt, og økte løpende utgifter. En bruktbil koster fort 100 000–200 000 kr. Ved å sette av litt jevnlig slipper du å ta opp forbrukslån når livet skjer.',
    targetLabel: 'Målbeløp',
    targetDefault: 100000,
  },
  {
    id: 'ferie',
    name: 'Ferie',
    defaultPercent: 5,
    color: COLORS.ferie,
    description: 'Reiser og ferieopplevelser.',
    explanation:
      'En utenlandsferie for én person koster typisk 5 000–20 000 kr avhengig av destinasjon og lengde. Ved å spare jevnlig gjennom året slipper du å finansiere ferien med kredittkort i juni.',
    targetLabel: 'Årlig feriebudsjett',
    targetDefault: 15000,
  },
];

export interface SpareState {
  income: number;
  percents: Record<string, number>;
  targets: Record<string, number>;
}

export function defaultState(): SpareState {
  const percents: Record<string, number> = {};
  const targets: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    percents[cat.id] = cat.defaultPercent;
    if (cat.targetDefault === 'auto-buffer') {
      targets[cat.id] = 0;
    } else if (typeof cat.targetDefault === 'number') {
      targets[cat.id] = cat.targetDefault;
    }
  }
  return { income: 0, percents, targets };
}

export function loadState(): SpareState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.income === 'number' && parsed.percents) {
        return parsed;
      }
    }
  } catch {}
  return defaultState();
}

export function saveState(state: SpareState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
  // Also clean up old key from previous version
  localStorage.removeItem('pengeprat_sparekalkulator');
}

export function formatKr(n: number): string {
  if (!n && n !== 0) return '0 kr';
  return Math.round(n).toLocaleString('nb-NO') + ' kr';
}

export function getBufferTarget(income: number): number {
  return income > 0 ? Math.round(income * 1.5) : 0;
}

export function getTarget(state: SpareState, catId: string): number | null {
  const config = CATEGORIES.find((c) => c.id === catId);
  if (!config || config.targetDefault === undefined) return null;
  if (config.targetDefault === 'auto-buffer') return getBufferTarget(state.income);
  return state.targets[catId] ?? 0;
}

export function getMonthly(state: SpareState, catId: string): number {
  const percent = state.percents[catId] ?? 0;
  return Math.round(state.income * (percent / 100));
}

export function normalizePercents(
  percents: Record<string, number>,
  changedId: string,
  newPercent: number,
): Record<string, number> {
  const result = { ...percents };
  const otherIds = Object.keys(result).filter((id) => id !== changedId);
  const oldOthersTotal = otherIds.reduce((s, id) => s + result[id], 0);
  const remaining = Math.max(0, 100 - newPercent);

  result[changedId] = newPercent;

  for (const id of otherIds) {
    if (oldOthersTotal === 0) {
      result[id] = Math.round(remaining / otherIds.length);
    } else {
      const ratio = result[id] / oldOthersTotal;
      result[id] = Math.round(remaining * ratio);
    }
  }

  return result;
}

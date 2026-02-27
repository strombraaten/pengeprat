import { useState, useEffect } from 'preact/hooks';

const STORAGE_KEY = 'pengeprat_uventet_sum';

interface Category {
  id: string;
  name: string;
  percent: number;
  color: string;
}

interface FormState {
  amount: number;
  source: string;
  categories: Category[];
}

const COLORS = [
  '#6a9fb5',
  '#7ab56a',
  '#b5916a',
  '#b56a8a',
  '#8a6ab5',
  '#6ab5a5',
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'buffer', name: 'Nødfond / buffer', percent: 30, color: COLORS[0] },
  { id: 'gjeld', name: 'Nedbetale gjeld', percent: 20, color: COLORS[1] },
  { id: 'sparing', name: 'Langsiktig sparing', percent: 30, color: COLORS[2] },
  { id: 'gøy', name: 'Noe gøy', percent: 20, color: COLORS[3] },
];

function loadState(): FormState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    amount: 0,
    source: '',
    categories: DEFAULT_CATEGORIES,
  };
}

function saveState(state: FormState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function formatKr(n: number): string {
  if (!n && n !== 0) return '0 kr';
  return Math.round(n).toLocaleString('nb-NO') + ' kr';
}

function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function normalizePercents(
  categories: Category[],
  changedId: string,
  newPercent: number,
): Category[] {
  const others = categories.filter((c) => c.id !== changedId);
  const oldOthersTotal = others.reduce((s, c) => s + c.percent, 0);
  const remaining = 100 - newPercent;

  return categories.map((c) => {
    if (c.id === changedId) return { ...c, percent: newPercent };
    if (oldOthersTotal === 0) {
      return { ...c, percent: Math.round(remaining / others.length) };
    }
    const ratio = c.percent / oldOthersTotal;
    return { ...c, percent: Math.round(remaining * ratio) };
  });
}

export default function UventetSumPage() {
  const [state, setState] = useState<FormState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const totalPercent = state.categories.reduce((s, c) => s + c.percent, 0);

  const updateAmount = (value: number) => {
    setState((prev) => ({ ...prev, amount: value }));
  };

  const updateSource = (value: string) => {
    setState((prev) => ({ ...prev, source: value }));
  };

  const updatePercent = (id: string, percent: number) => {
    setState((prev) => ({
      ...prev,
      categories: normalizePercents(prev.categories, id, percent),
    }));
  };

  const addCategory = () => {
    setState((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          id: genId(),
          name: '',
          percent: 0,
          color: COLORS[prev.categories.length % COLORS.length],
        },
      ],
    }));
  };

  const removeCategory = (id: string) => {
    setState((prev) => {
      const remaining = prev.categories.filter((c) => c.id !== id);
      if (remaining.length === 0) return prev;
      const total = remaining.reduce((s, c) => s + c.percent, 0);
      if (total === 0) {
        const equal = Math.round(100 / remaining.length);
        return {
          ...prev,
          categories: remaining.map((c) => ({ ...c, percent: equal })),
        };
      }
      const scale = 100 / total;
      return {
        ...prev,
        categories: remaining.map((c) => ({
          ...c,
          percent: Math.round(c.percent * scale),
        })),
      };
    });
  };

  const updateCategoryName = (id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, name } : c,
      ),
    }));
  };

  const clearData = () => {
    const fresh: FormState = {
      amount: 0,
      source: '',
      categories: DEFAULT_CATEGORIES,
    };
    setState(fresh);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div>
      <section class="section">
        <h3>Beløp</h3>
        <div class="field-group">
          <label for="amount">Hvor mye har du fått?</label>
          <input
            id="amount"
            type="number"
            min="0"
            step="1000"
            placeholder="f.eks. 50000"
            value={state.amount || ''}
            onInput={(e) =>
              updateAmount(Number((e.target as HTMLInputElement).value))
            }
          />
        </div>

        <div class="field-group">
          <label for="source">Kilde (valgfritt)</label>
          <input
            id="source"
            type="text"
            placeholder="f.eks. bonus, arv, skatteoppgjør"
            value={state.source}
            onInput={(e) =>
              updateSource((e.target as HTMLInputElement).value)
            }
          />
        </div>
      </section>

      <section class="section">
        <h3>Fordeling</h3>

        {state.amount > 0 && (
          <div style="margin-bottom:var(--space-5);">
            <div class="bar-container">
              {state.categories.map((cat) => (
                <div
                  key={cat.id}
                  class="bar-segment"
                  style={`width:${cat.percent}%;background:${cat.color};`}
                />
              ))}
            </div>
          </div>
        )}

        {state.categories.map((cat) => (
          <div class="goal-item" key={cat.id}>
            <div class="goal-header">
              <div style="display:flex;align-items:center;gap:var(--space-2);flex:1;">
                <div
                  style={`width:10px;height:10px;border-radius:50%;background:${cat.color};flex-shrink:0;`}
                />
                <input
                  type="text"
                  placeholder="Kategorinavn"
                  value={cat.name}
                  onInput={(e) =>
                    updateCategoryName(
                      cat.id,
                      (e.target as HTMLInputElement).value,
                    )
                  }
                  style="background:transparent;border:none;color:var(--text);font-family:var(--font);font-size:0.85rem;font-weight:500;padding:0;outline:none;flex:1;"
                />
              </div>
              <button class="goal-remove" onClick={() => removeCategory(cat.id)}>
                fjern
              </button>
            </div>

            <div
              style="display:flex;align-items:center;gap:var(--space-4);margin-top:var(--space-2);"
            >
              <input
                type="range"
                min="0"
                max="100"
                value={cat.percent}
                onInput={(e) =>
                  updatePercent(
                    cat.id,
                    Number((e.target as HTMLInputElement).value),
                  )
                }
                style="flex:1;"
              />
              <span
                style="font-size:0.8rem;color:var(--text-secondary);min-width:36px;text-align:right;"
              >
                {cat.percent}%
              </span>
            </div>

            {state.amount > 0 && (
              <div
                style="margin-top:var(--space-2);font-size:0.75rem;color:var(--text-muted);"
              >
                = {formatKr(state.amount * (cat.percent / 100))}
              </div>
            )}
          </div>
        ))}

        <div style="margin-top:var(--space-3);">
          <button onClick={addCategory}>+ Legg til kategori</button>
        </div>
      </section>

      {state.amount > 0 && (
        <section class="section">
          <h3>Oppsummering</h3>
          <div class="result-card">
            {state.categories
              .filter((c) => c.percent > 0)
              .map((c) => (
                <div class="result-row" key={c.id}>
                  <span class="result-label">{c.name || 'Uten navn'}</span>
                  <span class="result-value">
                    {formatKr(state.amount * (c.percent / 100))}
                  </span>
                </div>
              ))}
            <div
              class="result-row"
              style="border-top:1px solid var(--border);margin-top:var(--space-2);padding-top:var(--space-3);"
            >
              <span class="result-label">Totalt</span>
              <span class="result-value accent">{formatKr(state.amount)}</span>
            </div>
          </div>
        </section>
      )}

      <div style="margin-top:var(--space-6);">
        <button class="danger" onClick={clearData}>
          Slett mine data
        </button>
      </div>
    </div>
  );
}

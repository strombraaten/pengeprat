import { useState, useEffect } from 'preact/hooks';
import {
  CATEGORIES,
  loadState,
  saveState,
  clearState,
  defaultState,
  formatKr,
  type SpareState,
} from './sparedata';

export default function SparePage() {
  const [state, setState] = useState<SpareState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateIncome = (income: number) => {
    setState((prev) => ({ ...prev, income }));
  };

  const handleClear = () => {
    clearState();
    setState(defaultState());
  };

  const income = state.income;

  return (
    <div>
      <section class="section">
        <div class="field-group">
          <label for="income">Hva er månedsinntekten din etter skatt?</label>
          <input
            id="income"
            type="number"
            min="0"
            step="100"
            placeholder="f.eks. 35 000"
            value={income || ''}
            onInput={(e) =>
              updateIncome(Number((e.target as HTMLInputElement).value))
            }
          />
        </div>
      </section>

      {income > 0 && (
        <>
          <section class="section">
            <h3>Slik kan {formatKr(income)} fordeles</h3>

            <div style="margin-bottom:var(--space-5);">
              <div class="bar-container">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    class="bar-segment"
                    style={`width:${state.percents[cat.id] ?? cat.defaultPercent}%;background:${cat.color};`}
                  />
                ))}
              </div>
            </div>

            <div class="project-list">
              {CATEGORIES.map((cat) => {
                const percent = state.percents[cat.id] ?? cat.defaultPercent;
                const monthly = Math.round(income * (percent / 100));

                return (
                  <a
                    href={`/sparekalkulator/${cat.id}`}
                    class="project-item"
                    key={cat.id}
                  >
                    <span
                      style={`display:block;width:10px;height:10px;border-radius:50%;background:${cat.color};margin-top:6px;`}
                    />
                    <div class="project-content">
                      <h2>{cat.name}</h2>
                      <p>{cat.description}</p>
                      <span style="font-size:0.8rem;color:var(--text);">
                        {formatKr(monthly)}/mnd
                        <span style="color:var(--text-muted);"> · {percent} %</span>
                      </span>
                    </div>
                    <span class="project-arrow">→</span>
                  </a>
                );
              })}
            </div>
          </section>

          <section class="section">
            <p style="color:var(--text-muted);font-size:0.8rem;font-style:italic;line-height:1.8;">
              Men dette er vill gjetting. Tallene over er basert på grove
              antakelser som neppe stemmer for akkurat deg. Klikk deg inn på
              hver post for å justere og lese mer om hva som ligger bak.
            </p>
          </section>

          <section class="section">
            <div class="result-card">
              <p style="font-size:0.75rem;color:var(--text-secondary);line-height:1.8;margin-bottom:0;">
                <strong style="color:var(--text);">Neste steg:</strong> Sett opp faste trekk i
                nettbanken din slik at disse summene går automatisk. Legg dem
                2–3 dager etter lønningsdagen, så unngår du krøll med helg og
                virkedager. Len deg tilbake og kjenn på følelsen av kontroll
                hver måned.
              </p>
            </div>
          </section>

          <div style="margin-top:var(--space-6);">
            <button class="danger" onClick={handleClear}>
              Slett mine data
            </button>
          </div>
        </>
      )}
    </div>
  );
}

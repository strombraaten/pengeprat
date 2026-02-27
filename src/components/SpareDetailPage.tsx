import { useState, useEffect } from 'preact/hooks';
import {
  CATEGORIES,
  loadState,
  saveState,
  formatKr,
  getTarget,
  getMonthly,
  normalizePercents,
  type SpareState,
} from './sparedata';

interface Props {
  categoryId: string;
}

export default function SpareDetailPage({ categoryId }: Props) {
  const [state, setState] = useState<SpareState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const config = CATEGORIES.find((c) => c.id === categoryId);
  if (!config) return <p>Ukjent kategori.</p>;

  const income = state.income;
  const percent = state.percents[categoryId] ?? config.defaultPercent;
  const monthly = getMonthly(state, categoryId);
  const target = getTarget(state, categoryId);
  const months =
    target && target > 0 && monthly > 0 ? Math.ceil(target / monthly) : null;

  const updatePercent = (newPercent: number) => {
    setState((prev) => ({
      ...prev,
      percents: normalizePercents(prev.percents, categoryId, newPercent),
    }));
  };

  const updateTarget = (newTarget: number) => {
    setState((prev) => ({
      ...prev,
      targets: { ...prev.targets, [categoryId]: newTarget },
    }));
  };

  if (!income || income <= 0) {
    return (
      <div>
        <p style="margin-bottom:var(--space-5);">
          Du må taste inn månedsinntekten din først.
        </p>
        <a href="/sparekalkulator" style="color:var(--accent);">
          ← Gå tilbake og tast inn lønn
        </a>
      </div>
    );
  }

  return (
    <div>
      <section class="section">
        <div
          style={`display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-5);`}
        >
          <div
            style={`width:14px;height:14px;border-radius:50%;background:${config.color};flex-shrink:0;`}
          />
          <div>
            <span style="font-size:1.1rem;font-weight:600;color:var(--text);">
              {formatKr(monthly)}
            </span>
            <span style="font-size:0.8rem;color:var(--text-muted);">
              /mnd · {percent} % av {formatKr(income)}
            </span>
          </div>
        </div>

        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.8;margin-bottom:var(--space-6);">
          {config.explanation}
        </p>
      </section>

      <section class="section">
        <h3>Juster andel</h3>
        <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-3);">
          <input
            type="range"
            min="0"
            max="80"
            value={percent}
            onInput={(e) =>
              updatePercent(Number((e.target as HTMLInputElement).value))
            }
            style="flex:1;"
          />
          <span style="font-size:0.85rem;color:var(--text-secondary);min-width:42px;text-align:right;">
            {percent} %
          </span>
        </div>
        <p style="font-size:0.75rem;color:var(--text-muted);">
          = {formatKr(monthly)}/mnd · {formatKr(monthly * 12)}/år
        </p>
      </section>

      {categoryId === 'buffer' && (
        <section class="section">
          <h3>Buffermål</h3>
          <div class="result-card">
            <div class="result-row">
              <span class="result-label">Anbefalt buffer (1,5 × lønn)</span>
              <span class="result-value accent">
                {formatKr(Math.round(income * 1.5))}
              </span>
            </div>
            {months !== null && (
              <div class="result-row">
                <span class="result-label">Tid til mål</span>
                <span class="result-value">
                  {months} {months === 1 ? 'måned' : 'måneder'}
                  {months >= 12 && (
                    <span style="color:var(--text-muted);">
                      {' '}
                      ({Math.round((months / 12) * 10) / 10} år)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {categoryId !== 'buffer' &&
        config.targetLabel &&
        config.targetDefault !== undefined && (
          <section class="section">
            <h3>{config.targetLabel}</h3>
            <div class="field-group">
              <label>{config.targetLabel}</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={target || ''}
                onInput={(e) =>
                  updateTarget(Number((e.target as HTMLInputElement).value))
                }
              />
            </div>
            {months !== null && (
              <div class="result-card">
                <div class="result-row">
                  <span class="result-label">Tid til mål</span>
                  <span class="result-value">
                    {months} {months === 1 ? 'måned' : 'måneder'}
                    {months >= 12 && (
                      <span style="color:var(--text-muted);">
                        {' '}
                        ({Math.round((months / 12) * 10) / 10} år)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

      {!config.targetLabel && categoryId !== 'utgifter' && (
        <section class="section">
          <div class="result-card">
            <div class="result-row">
              <span class="result-label">Løpende sparing</span>
              <span class="result-value">{formatKr(monthly * 12)}/år</span>
            </div>
          </div>
        </section>
      )}

      <section class="section">
        <h3>Påvirkning på resten</h3>
        <div class="result-card">
          {CATEGORIES.filter((c) => c.id !== categoryId).map((c) => {
            const p = state.percents[c.id] ?? c.defaultPercent;
            const m = Math.round(income * (p / 100));
            return (
              <div class="result-row" key={c.id}>
                <span class="result-label">
                  <span
                    style={`display:inline-block;width:8px;height:8px;border-radius:50%;background:${c.color};margin-right:var(--space-2);vertical-align:middle;`}
                  />
                  {c.name}
                </span>
                <span class="result-value">
                  {formatKr(m)}/mnd
                  <span style="color:var(--text-muted);"> · {p} %</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

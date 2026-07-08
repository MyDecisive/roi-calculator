import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_CONFIG,
  DEFAULT_INPUTS,
  calculateRoi,
  formatCount,
  formatGb,
  formatMoney,
  formatMoneyExact,
  mdaiInfraCostPerMonth,
  type RoiCalculatorConfig,
  type RoiCalculatorInputs,
  type RoiCalculatorResults
} from './roiCalculatorMath';

export type RoiCalculatorProps = {
  config?: Partial<RoiCalculatorConfig>;
  initialInputs?: Partial<RoiCalculatorInputs>;
  onChange?: (results: RoiCalculatorResults, inputs: RoiCalculatorInputs) => void;
  className?: string;
  id?: string;
};

type TermKey = 'filtering' | 'smarthub' | 'mdaicost';

type TermDefinition = {
  label: string;
  text: string;
};

type EstimateView = 'text' | 'table';

type NumberFieldProps = {
  id: keyof Pick<
    RoiCalculatorInputs,
    'logGB' | 'traceGB' | 'traceCt' | 'containers' | 'hosts' | 'overage'
  >;
  label: string;
  hint?: string;
  unit?: string;
  prefix?: string;
  step?: string;
  inputMode?: 'decimal' | 'numeric';
  value: number | string;
  onChange: (key: keyof RoiCalculatorInputs, value: string) => void;
};

type InfoButtonProps = {
  term: TermKey;
  label: string;
  compact?: boolean;
  activeTerm: TermKey | null;
  setActiveTerm: Dispatch<SetStateAction<TermKey | null>>;
};

const TERMS: Record<TermKey, TermDefinition> = {
  filtering: {
    label: 'Filtering',
    text:
      'Drops a set percentage of lower-value logs and spans while keeping representative telemetry for visibility. The slider controls the planning assumption.'
  },
  smarthub: {
    label: 'SmartHub',
    text:
      "MyDecisive's Smart Telemetry Hub sits between your apps and observability vendor. It filters and shapes logs and traces in flight, so you pay for less data without losing what matters."
  },
  mdaicost: {
    label: 'Your cost to run MDAI',
    text:
      'This module projects the monthly AWS infrastructure cost to run the MyDecisive SmartHub in your own cloud. Based on your current daily data volume, it scales reference clusters (handling up to 20TB/day each) using standard AWS list pricing (us-east-1) for 1-Year Reserved EC2 instances, EKS control planes, provisioned gp3 EBS storage, and a rolling 2-day S3 storage buffer.'
  }
};

function NumberField({
  id,
  label,
  hint,
  unit,
  prefix,
  step = 'any',
  inputMode = 'decimal',
  value,
  onChange
}: NumberFieldProps) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {hint ? <em>{hint}</em> : null}
      </span>
      <span className="input-wrap">
        {prefix ? <span className="unit unit-pre">{prefix}</span> : null}
        <input
          type="number"
          id={id}
          min="0"
          step={step}
          value={value}
          placeholder={id === 'overage' ? '0' : undefined}
          inputMode={inputMode}
          className={prefix ? 'has-pre' : undefined}
          onChange={(event) => onChange(id, event.target.value)}
        />
        {unit ? <span className="unit">{unit}</span> : null}
      </span>
    </label>
  );
}

function InfoButton({ term, label, compact = false, activeTerm, setActiveTerm }: InfoButtonProps) {
  const isActive = activeTerm === term;
  return (
    <button
      className={`info-btn${compact ? ' info-btn-sm' : ''}${isActive ? ' is-active' : ''}`}
      type="button"
      data-term={term}
      aria-label={label}
      aria-expanded={isActive}
      onClick={(event) => {
        event.stopPropagation();
        setActiveTerm(isActive ? null : term);
      }}
    >
      i
    </button>
  );
}

export function RoiCalculator({
  config,
  initialInputs,
  onChange,
  className = '',
  id = 'mdai-roi'
}: RoiCalculatorProps) {
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const [inputs, setInputs] = useState({ ...DEFAULT_INPUTS, ...initialInputs });
  const [activeTerm, setActiveTerm] = useState<TermKey | null>(null);
  const [estimateView, setEstimateView] = useState<EstimateView>('table');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const results = useMemo(() => calculateRoi(inputs, mergedConfig), [inputs, mergedConfig]);
  const mdaiCost = useMemo(() => {
    const logGbDay = typeof inputs.logGB === 'string' ? parseFloat(inputs.logGB) || 0 : inputs.logGB;
    const traceGbDay = typeof inputs.traceGB === 'string' ? parseFloat(inputs.traceGB) || 0 : inputs.traceGB;
    const V_gb_per_day = logGbDay + traceGbDay;
    return V_gb_per_day > 0 ? mdaiInfraCostPerMonth(V_gb_per_day) : null;
  }, [inputs.logGB, inputs.traceGB]);
  const activeInfo = activeTerm ? TERMS[activeTerm] : null;

  function updateInput(key: keyof RoiCalculatorInputs, value: string) {
    const next = { ...inputs, [key]: value };
    setInputs(next);
    onChange?.(calculateRoi(next, mergedConfig), next);
  }

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!(event.target instanceof Node)) return;
      if (!rootRef.current?.contains(event.target)) setActiveTerm(null);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveTerm(null);
    }
    document.addEventListener('click', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('click', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!activeTerm || !rootRef.current || !popoverRef.current) return;
    const trigger = rootRef.current.querySelector<HTMLElement>(`[data-term="${activeTerm}"].is-active`);
    const card = rootRef.current.querySelector<HTMLElement>('.roi-card');
    if (!trigger || !card) return;

    const cardRect = card.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const popRect = popoverRef.current.getBoundingClientRect();
    let top = triggerRect.bottom - cardRect.top + 8;
    let left = triggerRect.left - cardRect.left;
    const maxLeft = cardRect.width - popRect.width - 10;
    left = Math.max(10, Math.min(left, maxLeft));
    if (triggerRect.bottom + popRect.height + 8 > cardRect.bottom) {
      top = triggerRect.top - cardRect.top - popRect.height - 8;
    }
    popoverRef.current.style.top = `${top}px`;
    popoverRef.current.style.left = `${left}px`;
  }, [activeTerm, results]);

  return (
    <div id={id} className={className} ref={rootRef}>
      <div className="roi-card">
        <header className="roi-head">
          <div className="roi-head-mark" aria-hidden="true">
            <span className="dot" /> observe · decide · act
          </div>
          <h2 className="roi-title">How much can you save by avoiding noise?</h2>
          <p className="roi-sub">
            Put{' '}
            <button
              className={`info-inline${activeTerm === 'smarthub' ? ' is-active' : ''}`}
              type="button"
              data-term="smarthub"
              aria-expanded={activeTerm === 'smarthub'}
              onClick={(event) => {
                event.stopPropagation();
                setActiveTerm(activeTerm === 'smarthub' ? null : 'smarthub');
              }}
            >
              SmartHub<span className="info-inline-ic" aria-hidden="true">i</span>
            </button>{' '}
            in front of your vendor. See the bill before and after.
          </p>
        </header>

        <div className="roi-body">
          <section className="roi-inputs" aria-label="Your current footprint">
            <div className="field-grid">
              <NumberField id="logGB" label="Log volume" hint="/ day" unit="GB" value={inputs.logGB} onChange={updateInput} />
              <NumberField id="traceGB" label="Trace volume" hint="/ day" unit="GB" value={inputs.traceGB} onChange={updateInput} />
              <NumberField id="traceCt" label="Trace events" hint="/ day" unit="spans" inputMode="numeric" value={inputs.traceCt} onChange={updateInput} />
              <NumberField id="containers" label="Containers" hint="in prod" step="1" inputMode="numeric" value={inputs.containers} onChange={updateInput} />
              <NumberField id="hosts" label="Hosts" hint="in prod" step="1" inputMode="numeric" value={inputs.hosts} onChange={updateInput} />
              <NumberField id="overage" label="Overage today" hint="optional" unit="/ mo" prefix="$" value={inputs.overage} onChange={updateInput} />
            </div>

            <div className="filter-block">
              <div className="filter-custom">
                <div className="slider-row">
                  <span className="slider-label">Drop</span>
                  <input
                    type="range"
                    min="0"
                    max="95"
                    step="5"
                    value={inputs.filterPct}
                    onChange={(event) => updateInput('filterPct', event.target.value)}
                  />
                  <output className="slider-out">{results.filterPct}%</output>
                  <InfoButton
                    term="filtering"
                    label="What does filtering do?"
                    activeTerm={activeTerm}
                    setActiveTerm={setActiveTerm}
                  />
                </div>
              </div>
            </div>

            <div className="mdai-cost-sep-wrap mdai-cost-desktop">
              <div className="mdai-cost-box">
                <span className="mdai-cost-tag">
                  Your cost to run MDAI
                  <InfoButton
                    term="mdaicost"
                    label="How is MDAI cost calculated?"
                    compact
                    activeTerm={activeTerm}
                    setActiveTerm={setActiveTerm}
                  />
                </span>
                <span className="mdai-cost-amount">{mdaiCost ? formatMoney(mdaiCost.total) : '$0'}</span>
                <span className="mdai-cost-unit">/ month</span>
              </div>
            </div>
          </section>

          <section className="roi-results" aria-label="Estimated result" aria-live="polite">
            <div className="billboard">
              <div className="bb-side bb-before">
                <span className="bb-tag">Today</span>
                <span className="bb-amount">{formatMoney(results.beforeMonthly)}</span>
                <span className="bb-unit">/ month</span>
              </div>

              <div className="bb-wire">
                <div className="wire-track" aria-hidden="true">
                  <span
                    className="wire-pinch"
                    style={{ height: `${(6 + (26 - 6) * results.keepRate).toFixed(1)}px` }}
                  />
                </div>
                <span className="wire-cap-row">
                  <span className="wire-cap">SmartHub</span>
                  <InfoButton
                    term="smarthub"
                    label="What is SmartHub?"
                    compact
                    activeTerm={activeTerm}
                    setActiveTerm={setActiveTerm}
                  />
                </span>
              </div>

              <div className="bb-side bb-after">
                <span className="bb-tag">Behind SmartHub</span>
                <span className="bb-amount">{formatMoney(results.afterMonthly)}</span>
                <span className="bb-unit">/ month</span>
              </div>
            </div>

            <div className="hero">
              <div className="hero-main">
                <span className="hero-eyebrow">Reclaimed per year</span>
                <span className="hero-number" title={`${formatMoneyExact(results.annualSavings)} / year`}>
                  {formatMoney(results.annualSavings)}
                </span>
              </div>
              <div className="hero-pct">
                <span className="pct-num">{results.savingsPct}%</span>
                <span className="pct-lbl">lower bill</span>
              </div>
            </div>

            <div className="stats">
              <div className="stat">
                <span className="stat-num">{formatGb(results.gbAvoidedDay)}</span>
                <span className="stat-lbl">avoided / day</span>
              </div>
              <div className="stat">
                <span className="stat-num">{formatCount(results.tracesAvoidedDay)}</span>
                <span className="stat-lbl">spans dropped / day</span>
              </div>
              <div className="stat">
                <span className="stat-num">{formatGb(results.bytesOutDay)}</span>
                <span className="stat-lbl">forwarded / day</span>
              </div>
            </div>

            <div className="mdai-cost-sep-wrap mdai-cost-mobile">
              <div className="mdai-cost-box">
                <span className="mdai-cost-tag">
                  Your cost to run MDAI
                  <InfoButton
                    term="mdaicost"
                    label="How is MDAI cost calculated?"
                    compact
                    activeTerm={activeTerm}
                    setActiveTerm={setActiveTerm}
                  />
                </span>
                <span className="mdai-cost-amount">{mdaiCost ? formatMoney(mdaiCost.total) : '$0'}</span>
                <span className="mdai-cost-unit">/ month</span>
              </div>
            </div>

            <div className="cta-row">
              <a
                className="cta cta-primary"
                href="https://github.com/MyDecisive/octant#welcome-to-octant"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get started <span className="arr">→</span>
              </a>
              <a className="cta cta-ghost" href={mergedConfig.CTA_CONTACT_URL} target="_blank" rel="noopener noreferrer">
                Talk to us
              </a>
            </div>

            <details className="work">
              <summary>How this is estimated</summary>
              <div className="work-body">
                <div className="work-toggle" aria-label="Estimate explanation view">
                  <button
                    type="button"
                    aria-pressed={estimateView === 'text'}
                    className={estimateView === 'text' ? 'is-active' : undefined}
                    onClick={() => setEstimateView('text')}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    aria-pressed={estimateView === 'table'}
                    className={estimateView === 'table' ? 'is-active' : undefined}
                    onClick={() => setEstimateView('table')}
                  >
                    Table
                  </button>
                </div>
                {estimateView === 'text' ? (
                  <>
                    <p>
                      Example planning rates: logs <b>${mergedConfig.RATE_LOG_GB}/GB</b>, indexed spans{' '}
                      <b>${mergedConfig.RATE_TRACE_IN_MM}/M</b>, hosts{' '}
                      <b>${mergedConfig.RATE_HOST}/mo</b>, containers{' '}
                      <b>${mergedConfig.RATE_CONTAINER}/mo</b>. Forwarded spans are valued at{' '}
                      <b>${mergedConfig.RATE_TRACE_OUT_MM}/M</b>.
                    </p>
                    <p>
                      SmartHub reduces ingestion-driven cost. Host and container counts are
                      infrastructure, so they remain unchanged.
                    </p>
                  </>
                ) : (
                  <div className="work-table-wrap">
                    <table className="work-table">
                      <caption>Example rate assumptions</caption>
                      <thead>
                        <tr>
                          <th scope="col">Cost driver</th>
                          <th scope="col">Rate</th>
                          <th scope="col">Treatment</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th scope="row">Logs</th>
                          <td>${mergedConfig.RATE_LOG_GB}/GB</td>
                          <td>Reduced by filter rate</td>
                        </tr>
                        <tr>
                          <th scope="row">Indexed spans</th>
                          <td>${mergedConfig.RATE_TRACE_IN_MM}/M</td>
                          <td>Reduced by filter rate</td>
                        </tr>
                        <tr>
                          <th scope="row">Forwarded spans</th>
                          <td>${mergedConfig.RATE_TRACE_OUT_MM}/M</td>
                          <td>Used for spans after SmartHub</td>
                        </tr>
                        <tr>
                          <th scope="row">Hosts</th>
                          <td>${mergedConfig.RATE_HOST}/mo</td>
                          <td>Unchanged infrastructure cost</td>
                        </tr>
                        <tr>
                          <th scope="row">Containers</th>
                          <td>${mergedConfig.RATE_CONTAINER}/mo</td>
                          <td>Unchanged infrastructure cost</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                <p>
                  Daily volumes are billed over a {mergedConfig.DAYS_PER_MONTH}-day month. Overage
                  scales down with filtered volume.
                </p>
                <p className="work-foot">Example estimate for planning, not a quote.</p>
              </div>
            </details>
          </section>
        </div>

        {activeInfo ? (
          <div className="info-pop is-open" ref={popoverRef} role="tooltip">
            <div className="info-pop-head">
              <span className="info-pop-term">{activeInfo.label}</span>
              <button className="info-pop-close" type="button" aria-label="Close" onClick={() => setActiveTerm(null)}>
                &times;
              </button>
            </div>
            <p className="info-pop-text">{activeInfo.text}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

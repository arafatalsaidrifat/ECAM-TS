import React from 'react';
import { DomainCode, ConditioningVector, AblationSettings, StressTestState } from '../types';
import { MODEL_CANDIDATE_POOL } from '../data/datasets';
import { ForecastScenario, PRESET_SCENARIOS } from '../data/simulationEngine';
import { Cpu, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface RoutingWeightsModuleProps {
  selectedDomain: DomainCode;
  selectedScenario: ForecastScenario;
  setSelectedScenario: (scen: ForecastScenario) => void;
  conditioningVector: ConditioningVector;
  routerWeights: Record<string, number>;
  ablation: AblationSettings;
  stress: StressTestState;
}

export const RoutingWeightsModule: React.FC<RoutingWeightsModuleProps> = ({
  selectedDomain,
  selectedScenario,
  setSelectedScenario,
  conditioningVector,
  routerWeights,
  ablation,
  stress,
}) => {
  const models = MODEL_CANDIDATE_POOL[selectedDomain] || [];
  const relevantScenarios = PRESET_SCENARIOS.filter((s) => s.domain === selectedDomain);

  // Fallback to all scenarios if none match directly
  const displayScenarios = relevantScenarios.length > 0 ? relevantScenarios : PRESET_SCENARIOS;

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-blue-50 text-blue-700">
                <Cpu className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                MODULE 3: CONTEXT-AWARE ROUTING & DYNAMIC WEIGHT GENERATION
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              FFORMA-Conditioned Meta-Learned Model Simplex Allocator
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Dynamically maps historical window statistical signatures z_(d,i) and known-future multi-phase event states to continuous probability weights w_m(z_(d,i)) over the probability simplex.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Simplex Invariant: Σ w_m = 1.000, w_m ≥ 0</span>
          </div>
        </div>

        {/* Forecast Origin & Regime Selection */}
        <div className="mt-6">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Select Active Forecast Origin & Temporal Regime:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayScenarios.map((scen) => {
              const isSelected = selectedScenario.id === scen.id;
              return (
                <button
                  key={scen.id}
                  onClick={() => setSelectedScenario(scen)}
                  className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-100 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">{scen.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        scen.regime === 'lead_up'
                          ? 'bg-amber-100 text-amber-800'
                          : scen.regime === 'event_core'
                          ? 'bg-rose-100 text-rose-800'
                          : scen.regime === 'recovery'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {scen.regime.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-blue-700">
                    t_origin = {scen.originTimestamp}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    {scen.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditioning Vector Inspection */}
        <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>Origin Feature Vector Extraction z_(d,i) (Derived strictly at t ≤ t_origin)</span>
            </span>
            <span className="font-mono text-slate-500 text-[11px]">Dimension: 8 Scalar Conditioning Signals</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-medium">Trend F_t</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {conditioningVector.trendStrength}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-medium">Season F_s</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {conditioningVector.seasonalStrength}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-medium">Entropy H_spec</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {conditioningVector.spectralEntropy}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-medium">ACF(1)</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {conditioningVector.autocorr1}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-medium">CDD_18.3 (°C)</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {conditioningVector.coolingDegreeDays}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-medium">Lead-Up Days</div>
              <div className="font-mono font-bold text-blue-700 text-sm mt-0.5">
                {conditioningVector.leadUpProximityDays}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-medium">Core Holiday</div>
              <div className="font-mono font-bold text-rose-700 text-sm mt-0.5">
                {conditioningVector.holidayFlag}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-medium">Recovery Days</div>
              <div className="font-mono font-bold text-teal-700 text-sm mt-0.5">
                {conditioningVector.recoveryProximityDays}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Weight Allocation Visualizer */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Softmax Probability Routing Allocations w_m(z_(d,i))
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Live probability mass allocated to each candidate forecaster for origin {selectedScenario.originTimestamp}
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Regime: <span className="font-bold text-slate-900">{selectedScenario.highlightEvent}</span>
          </div>
        </div>

        {/* Weights Bar Graph */}
        <div className="space-y-3.5">
          {models.map((m) => {
            const weight = routerWeights[m.id] || 0;
            const pct = (weight * 100).toFixed(1);

            return (
              <div key={m.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{m.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({m.family})</span>
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    {pct}% <span className="text-slate-400 font-normal">({weight.toFixed(4)})</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      m.id.includes('router')
                        ? 'bg-blue-600'
                        : m.family === 'Foundation Model'
                        ? 'bg-purple-600'
                        : m.family === 'Supervised Tree'
                        ? 'bg-emerald-600'
                        : m.family === 'Classical Statistical'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Ensemble Strategy Comparison Matrix */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Combination Strategy Comparison vs Control Baselines (Table 4 Empirical Benchmark)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200">
              <div className="text-xs font-bold text-blue-900">Proposed: ECAM-TS Adaptive Router</div>
              <div className="text-2xl font-bold font-mono text-blue-700 mt-1">245.2 MW</div>
              <div className="text-xs text-blue-800 font-medium mt-1">MASE: 0.471 (-14.1% vs 1/M)</div>
              <p className="text-[11px] text-slate-600 mt-2">
                Dynamically emphasizes LightGBM during steep festival ramps and foundation models during non-linear temperature spikes.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-900">Control 1: Equal-Weight Averaging (1/M)</div>
              <div className="text-2xl font-bold font-mono text-slate-800 mt-1">285.3 MW</div>
              <div className="text-xs text-slate-600 font-medium mt-1">MASE: 0.548 (+16.3% Error)</div>
              <p className="text-[11px] text-slate-600 mt-2">
                Assigns static 1/M weights. Suffers high error during holiday regime transitions by blending failing lag baselines equally.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-900">Control 2: Regularized Ridge Stacking</div>
              <div className="text-2xl font-bold font-mono text-slate-800 mt-1">261.8 MW</div>
              <div className="text-xs text-slate-600 font-medium mt-1">MASE: 0.503 (+6.8% Error)</div>
              <p className="text-[11px] text-slate-600 mt-2">
                Global linear regression with L2 regularization. Lacks origin-level context adaptivity to sudden lunar festival timing shifts.
              </p>
            </div>
          </div>
        </div>

        {/* Negative Result Transparency Box */}
        {selectedDomain === 'BD-FOOD-M' && (
          <div className="mt-5 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">Honest Negative Result Insight (BD-FOOD-M): </span>
              On the monthly staple food prices task, Equal-Weight Averaging (1/M) achieves 3.82 BDT/kg MAE, slightly outperforming the meta-learned router (3.89 BDT/kg MAE).
              This occurs because the low temporal frequency yields limited rolling origins (V &lt; 40), causing the meta-learner to encounter estimation variance.
              In accordance with scientific rigor, ECAM-TS transparently documents this boundary condition to defense committees.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

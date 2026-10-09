import React from 'react';
import { AblationSettings, DomainCode, OperationalImpactSummary } from '../types';
import { FESTIVAL_ABLATION_BENCHMARK } from '../data/datasets';
import { ShieldCheck, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface AblationEngineModuleProps {
  selectedDomain: DomainCode;
  ablation: AblationSettings;
  setAblation: React.Dispatch<React.SetStateAction<AblationSettings>>;
  currentMAE: number;
  currentMASE: number;
  operationalSummary: OperationalImpactSummary;
}

export const AblationEngineModule: React.FC<AblationEngineModuleProps> = ({
  selectedDomain,
  ablation,
  setAblation,
  currentMAE,
  currentMASE,
  operationalSummary,
}) => {
  const toggleFeature = (key: keyof AblationSettings) => {
    setAblation((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Baseline reference MAE for full model is 245.2
  const baselineMAE = 245.2;
  const errorDeltaPct = parseFloat((((currentMAE - baselineMAE) / baselineMAE) * 100).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-blue-50 text-blue-700">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                MODULE 5: FESTIVAL & CALENDAR COVARIATE ABLATION ENGINE
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Mechanistic Attribution of Multi-Phase Festival Encodings
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Systematically evaluates the empirical contribution of localized lunar festival features (Ramadan, Eid-ul-Fitr, Eid-ul-Adha) by allowing defense reviewers to deactivate specific feature subsets in real time.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">Target Series:</span>
            <span className="font-mono text-blue-700 font-bold">BD-ELEC-H (PGCB Grid)</span>
          </div>
        </div>

        {/* 4 Interactive Feature Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Toggle 1 */}
          <div
            onClick={() => toggleFeature('leadUpFeatures')}
            className={`p-4 rounded-xl border cursor-pointer transition-all select-none ${
              ablation.leadUpFeatures
                ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-100'
                : 'bg-slate-50/70 border-slate-200 opacity-80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-blue-700">
                  [TOGGLE 1] LEAD-UP WINDOW
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Pre-Event Lead-Up Window Features (t - k to t - 1)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Encodes extended commercial shopping hours, residential pre-holiday baking, and late-night commercial lighting (+850 MW demand spike).
                </p>
              </div>
              <div className="shrink-0 mt-0.5">
                {ablation.leadUpFeatures ? (
                  <ToggleRight className="w-6 h-6 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Status:</span>
              <span className={`font-semibold ${ablation.leadUpFeatures ? 'text-emerald-700' : 'text-rose-600'}`}>
                {ablation.leadUpFeatures ? 'ENABLED (Optimal)' : 'ABLATED (+26.5% Error)'}
              </span>
            </div>
          </div>

          {/* Toggle 2 */}
          <div
            onClick={() => toggleFeature('coreHolidayFlags')}
            className={`p-4 rounded-xl border cursor-pointer transition-all select-none ${
              ablation.coreHolidayFlags
                ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-100'
                : 'bg-slate-50/70 border-slate-200 opacity-80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-blue-700">
                  [TOGGLE 2] CORE HOLIDAY
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Core Holiday Span Flags (t_0)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Encodes nationwide industrial shutdowns, textile spinning stoppage, and 10M+ outbound rural migration (-2,800 MW demand trough).
                </p>
              </div>
              <div className="shrink-0 mt-0.5">
                {ablation.coreHolidayFlags ? (
                  <ToggleRight className="w-6 h-6 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Status:</span>
              <span className={`font-semibold ${ablation.coreHolidayFlags ? 'text-emerald-700' : 'text-rose-600'}`}>
                {ablation.coreHolidayFlags ? 'ENABLED (Optimal)' : 'ABLATED (Severe Overprediction)'}
              </span>
            </div>
          </div>

          {/* Toggle 3 */}
          <div
            onClick={() => toggleFeature('recoveryLagTerms')}
            className={`p-4 rounded-xl border cursor-pointer transition-all select-none ${
              ablation.recoveryLagTerms
                ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-100'
                : 'bg-slate-50/70 border-slate-200 opacity-80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-blue-700">
                  [TOGGLE 3] RECOVERY WINDOW
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Post-Event Recovery Lag Terms (t + 1 to t + r)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Models multi-day ramping transitions as heavy manufacturing restarts boiler firing and staggered production lines.
                </p>
              </div>
              <div className="shrink-0 mt-0.5">
                {ablation.recoveryLagTerms ? (
                  <ToggleRight className="w-6 h-6 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Status:</span>
              <span className={`font-semibold ${ablation.recoveryLagTerms ? 'text-emerald-700' : 'text-rose-600'}`}>
                {ablation.recoveryLagTerms ? 'ENABLED (Optimal)' : 'ABLATED (+12.4% Error)'}
              </span>
            </div>
          </div>

          {/* Toggle 4 */}
          <div
            onClick={() => toggleFeature('weatherInteraction')}
            className={`p-4 rounded-xl border cursor-pointer transition-all select-none ${
              ablation.weatherInteraction
                ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-100'
                : 'bg-slate-50/70 border-slate-200 opacity-80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-blue-700">
                  [TOGGLE 4] WEATHER COVARIATES
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Weather Interaction Terms (CDD 18.3 x Event Phase)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Non-linear interaction coupling Cooling Degree Days (CDD 18.3°C) and relative humidity with active festival status.
                </p>
              </div>
              <div className="shrink-0 mt-0.5">
                {ablation.weatherInteraction ? (
                  <ToggleRight className="w-6 h-6 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Status:</span>
              <span className={`font-semibold ${ablation.weatherInteraction ? 'text-emerald-700' : 'text-rose-600'}`}>
                {ablation.weatherInteraction ? 'ENABLED (Optimal)' : 'ABLATED (+48.9% Error)'}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Recalculation Impact Box */}
        <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-bold text-slate-900">
              Real-Time Dynamic Recalculation under Current Ablation State:
            </span>
            <span className="font-mono text-slate-600">
              Active Configuration: {Object.values(ablation).filter(Boolean).length} / 4 Features Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[11px] text-slate-500">Active Test MAE</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {currentMAE} MW
              </div>
              <div
                className={`text-[10px] font-semibold mt-0.5 ${
                  errorDeltaPct > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {errorDeltaPct > 0 ? `+${errorDeltaPct}% Degradation` : 'Optimal Baseline (0.0%)'}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[11px] text-slate-500">Normalized MASE</div>
              <div className="text-xl font-bold font-mono text-blue-700 mt-0.5">
                {currentMASE}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Reference: S-Naive = 1.000</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[11px] text-slate-500">Projected Peak Load</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {operationalSummary.peakValue.toLocaleString()} MW
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Grid Dispatch Horizon</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[11px] text-slate-500">Net Operational Margin</div>
              <div
                className={`text-xl font-bold font-mono mt-0.5 ${
                  operationalSummary.isDeficit ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {operationalSummary.netBalance > 0 ? '+' : ''}
                {operationalSummary.netBalance.toLocaleString()} MW
              </div>
              <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                {operationalSummary.isDeficit ? 'DEFICIT SCHEDULE TRIGGERED' : 'ADEQUATE RESERVE'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Blueprint Ablation Benchmark Table (Table 4) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Peer-Reviewed Festival Horizon Ablation Results (Paper Table 4 Reference)
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Empirical validation demonstrating error expansion across structural model variants on Bangladesh national grid festival windows.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-semibold">
                <th className="py-3 px-3">Framework Ablation Variant</th>
                <th className="py-3 px-3">Structural Description / Component Removed</th>
                <th className="py-3 px-3 font-mono">Festival MAE (MW)</th>
                <th className="py-3 px-3 font-mono">MASE</th>
                <th className="py-3 px-3 font-mono">Error Increase (%)</th>
                <th className="py-3 px-3">Empirical Failure Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {FESTIVAL_ABLATION_BENCHMARK.map((row, idx) => (
                <tr
                  key={row.variant}
                  className={`hover:bg-slate-50/50 ${idx === 0 ? 'bg-blue-50/40 font-semibold' : ''}`}
                >
                  <td className="py-3 px-3 text-slate-900">{row.variant}</td>
                  <td className="py-3 px-3 text-slate-600 text-[11px]">{row.description}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{row.mae}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{row.mase}</td>
                  <td
                    className={`py-3 px-3 font-mono font-bold ${
                      row.relativeIncreasePct === 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {row.relativeIncreasePct === 0 ? '0.0% (Base)' : `+${row.relativeIncreasePct}%`}
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-500">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { StressTestState, DomainCode, ConditioningVector } from '../types';
import { ShieldAlert, Zap, AlertTriangle, CheckCircle2, RotateCcw, Activity } from 'lucide-react';

interface StressTestingDiagnosticsModuleProps {
  selectedDomain: DomainCode;
  stress: StressTestState;
  setStress: React.Dispatch<React.SetStateAction<StressTestState>>;
  conditioningVector: ConditioningVector;
  currentMAE: number;
}

export const StressTestingDiagnosticsModule: React.FC<StressTestingDiagnosticsModuleProps> = ({
  selectedDomain,
  stress,
  setStress,
  conditioningVector,
  currentMAE,
}) => {
  const triggerMissingData = (pct: number) => {
    setStress({
      missingDataPct: pct,
      temperatureShockDeg: 0,
      festivalDateShiftDays: 0,
      description: `Injected ${pct}% random missing sensor timestamps with forward-fill imputation and indicator masking.`,
      activeType: 'missing_data',
    });
  };

  const triggerTempShock = (deg: number) => {
    setStress({
      missingDataPct: 0,
      temperatureShockDeg: deg,
      festivalDateShiftDays: 0,
      description: `Injected +${deg}°C extreme ambient dry-bulb temperature anomaly across all meteorological inputs.`,
      activeType: 'temp_shock',
    });
  };

  const triggerFestivalShift = (days: number) => {
    setStress({
      missingDataPct: 0,
      temperatureShockDeg: 0,
      festivalDateShiftDays: days,
      description: `Injected +${days} days lunar calendar phase displacement simulating unforeseen Eid crescent moon sighting discrepancy.`,
      activeType: 'festival_shift',
    });
  };

  const resetStress = () => {
    setStress({
      missingDataPct: 0,
      temperatureShockDeg: 0,
      festivalDateShiftDays: 0,
      description: 'Standard historical operational baseline without synthetic stress perturbations.',
      activeType: 'none',
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-amber-50 text-amber-700">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                MODULE 6: REAL-TIME STRESS-TESTING & FAILURE MODE DIAGNOSTICS
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Automated Boundary Stress Testing & Structural Resilience
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Academic defense committees probe system failure boundaries under non-ideal operating conditions.
              Inject synthetic data corruptions, thermal spikes, or calendar date shifts to observe router weight redistribution.
            </p>
          </div>

          <button
            onClick={resetStress}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Normal Baseline</span>
          </button>
        </div>

        {/* 3 Stress Test Triggers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Test A */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              stress.activeType === 'missing_data'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-100'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-900">Test A: Missing Sensor Drop</span>
              <span className="font-mono text-[11px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                Telemetry Anomaly
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Simulates transmission sensor link outages. Tests forward-fill imputation and router fallback away from classical autoregressors.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerMissingData(5)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  stress.activeType === 'missing_data' && stress.missingDataPct === 5
                    ? 'bg-amber-600 text-white border-amber-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                5% Drop
              </button>
              <button
                onClick={() => triggerMissingData(10)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  stress.activeType === 'missing_data' && stress.missingDataPct === 10
                    ? 'bg-amber-600 text-white border-amber-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                10% Drop
              </button>
              <button
                onClick={() => triggerMissingData(20)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  stress.activeType === 'missing_data' && stress.missingDataPct === 20
                    ? 'bg-amber-600 text-white border-amber-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                20% Drop
              </button>
            </div>
          </div>

          {/* Test B */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              stress.activeType === 'temp_shock'
                ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-100'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-900">Test B: Extreme Heat Shock</span>
              <span className="font-mono text-[11px] text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                Thermal Spikes
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Injects abrupt +5.0°C heatwave shock to dry-bulb temperature, evaluating non-linear Cooling Degree Days (CDD) demand surge.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerTempShock(2.0)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  stress.activeType === 'temp_shock' && stress.temperatureShockDeg === 2.0
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                +2.0°C
              </button>
              <button
                onClick={() => triggerTempShock(3.5)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  stress.activeType === 'temp_shock' && stress.temperatureShockDeg === 3.5
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                +3.5°C
              </button>
              <button
                onClick={() => triggerTempShock(5.0)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  stress.activeType === 'temp_shock' && stress.temperatureShockDeg === 5.0
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                +5.0°C Shock
              </button>
            </div>
          </div>

          {/* Test C */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              stress.activeType === 'festival_shift'
                ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-100'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-900">Test C: Lunar Date Shift</span>
              <span className="font-mono text-[11px] text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                Calendar Misalignment
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Shifts festival start dates by up to +10 days out-of-phase to evaluate how the router handles unexpected lunar sighting delays.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerFestivalShift(3)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  stress.activeType === 'festival_shift' && stress.festivalDateShiftDays === 3
                    ? 'bg-purple-600 text-white border-purple-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                +3 Days
              </button>
              <button
                onClick={() => triggerFestivalShift(7)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  stress.activeType === 'festival_shift' && stress.festivalDateShiftDays === 7
                    ? 'bg-purple-600 text-white border-purple-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                +7 Days
              </button>
              <button
                onClick={() => triggerFestivalShift(10)}
                className={`flex-1 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  stress.activeType === 'festival_shift' && stress.festivalDateShiftDays === 10
                    ? 'bg-purple-600 text-white border-purple-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                +10 Days Shift
              </button>
            </div>
          </div>
        </div>

        {/* Current State Diagnostic Banner */}
        <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Active Perturbation Status:</span>
            <span className="font-mono text-slate-600 font-semibold">
              Mode: {stress.activeType.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">{stress.description}</p>
        </div>
      </div>

      {/* Structural Failure Mode Diagnostic Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Structural Failure Mode Audit & Mitigation Registry
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Defensive documentation detailing known failure modes in complex time-series combinations and the concrete algorithmic guardrails embedded in ECAM-TS.
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Failure Mode 1: Meta-Router Overfitting on Limited Origins
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    MITIGATED
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>Risk:</strong> When meta-training rolling origins V &lt; 50 (e.g. low-frequency monthly food prices BD-FOOD-M), complex non-linear routers overfit spurious noise and underperform simple 1/M equal weighting.
                </p>
                <p className="text-xs text-slate-700 mt-1 font-mono">
                  <strong>Guardrail:</strong> Automatic fallback to regularized Ridge stacking or non-negative least squares with simplex constraint whenever V &lt; 40.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Failure Mode 2: Look-Ahead Exogenous Covariate Contamination
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    MITIGATED
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>Risk:</strong> Benchmarks using actual observed future temperatures y_weather(t_origin + h) exhibit artificial accuracy gains (perfect-information leakage).
                </p>
                <p className="text-xs text-slate-700 mt-1 font-mono">
                  <strong>Guardrail:</strong> Strict operational simulation protocol enforcing archived numerical weather predictions at issue time t_avail = t_origin.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Failure Mode 3: Telemetry Sensor Dropout & Forward-Fill Bias
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    MITIGATED
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>Risk:</strong> Flat-line forward-fill during communication packet loss corrupts spectral entropy and lag autocorrelations.
                </p>
                <p className="text-xs text-slate-700 mt-1 font-mono">
                  <strong>Guardrail:</strong> Forward-fill is paired with an explicit binary missingness indicator feature passed into the router, reallocating weight mass toward foundation models.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

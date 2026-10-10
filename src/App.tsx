import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DomainCode,
  AblationSettings,
  StressTestState,
} from './types';
import { DATASET_REGISTRY, MODEL_CANDIDATE_POOL } from './data/datasets';
import {
  PRESET_SCENARIOS,
  ForecastScenario,
  computeConditioningVector,
  computeRouterWeights,
  generateRegressionForecast,
} from './data/simulationEngine';
import { Header } from './components/Header';
import { DatasetAuditModule } from './components/DatasetAuditModule';
import { LeaderboardModule } from './components/LeaderboardModule';
import { RoutingWeightsModule } from './components/RoutingWeightsModule';
import { ContinuousForecastModule } from './components/ContinuousForecastModule';
import { AblationEngineModule } from './components/AblationEngineModule';
import { StressTestingDiagnosticsModule } from './components/StressTestingDiagnosticsModule';
import { FacultyDefenseInquiryModule } from './components/FacultyDefenseInquiryModule';
import { LiteratureModule } from './components/LiteratureModule';
import { RealDataForecastModule } from './components/RealDataForecastModule';
import { Activity, ShieldCheck, Play, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('real-csv-forecast');
  const didNavigate = useRef(false);
  useEffect(() => {
    if (!didNavigate.current) { didNavigate.current = true; return; }
    document.getElementById('workbench-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentTab]);
  const [selectedDomain, setSelectedDomain] = useState<DomainCode>('BD-ELEC-H');

  const [selectedScenario, setSelectedScenario] = useState<ForecastScenario>(
    PRESET_SCENARIOS[0]
  );

  const [gridCapacityMW, setGridCapacityMW] = useState<number>(13500);

  const [ablation, setAblation] = useState<AblationSettings>({
    leadUpFeatures: true,
    coreHolidayFlags: true,
    recoveryLagTerms: true,
    weatherInteraction: true,
  });

  const [stress, setStress] = useState<StressTestState>({
    missingDataPct: 0,
    temperatureShockDeg: 0,
    festivalDateShiftDays: 0,
    description: 'Standard historical operational baseline without synthetic stress perturbations.',
    activeType: 'none',
  });

  // Handle domain change
  const handleDomainChange = (domain: DomainCode) => {
    setSelectedDomain(domain);
    const scen = PRESET_SCENARIOS.find((s) => s.domain === domain) || PRESET_SCENARIOS[0];
    setSelectedScenario(scen);
  };

  // Derive conditioning vector strictly prior to forecast origin (t_avail <= t_origin)
  const conditioningVector = useMemo(() => {
    return computeConditioningVector(selectedDomain, selectedScenario, ablation, stress);
  }, [selectedDomain, selectedScenario, ablation, stress]);

  // Candidate models active in pool
  const candidateModels = MODEL_CANDIDATE_POOL[selectedDomain] || [];
  const activeModelIds = candidateModels.map((m) => m.id);

  // Compute Softmax router weights dynamically
  const routerWeights = useMemo(() => {
    return computeRouterWeights(selectedDomain, conditioningVector, activeModelIds, ablation, stress);
  }, [selectedDomain, conditioningVector, activeModelIds, ablation, stress]);

  // Compute multi-horizon regression output and operational impact summary
  const regressionResult = useMemo(() => {
    return generateRegressionForecast(
      selectedDomain,
      selectedScenario,
      ablation,
      stress,
      routerWeights,
      gridCapacityMW
    );
  }, [selectedDomain, selectedScenario, ablation, stress, routerWeights, gridCapacityMW]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-cyan-100 selection:text-cyan-950">
      {/* Top Header & Defense Navigation */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedDomain={selectedDomain}
        setSelectedDomain={handleDomainChange}
      />

      {/* Research-workbench-inspired hero — real-data workflow remains the primary path. */}
      <section className="relative isolate overflow-hidden border-b border-slate-800 bg-[#07111f] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="ecam-hero-glow absolute -right-24 -top-36 h-[30rem] w-[30rem] rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-48 left-[28%] h-[26rem] w-[26rem] rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="ecam-grid absolute inset-0 opacity-30" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-20">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.9)]" />
              ECAM-TS / Research workbench
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              From raw signals
              <span className="block bg-gradient-to-r from-cyan-200 via-sky-300 to-indigo-300 bg-clip-text pb-2 text-transparent">to defensible forecasts.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Inspect real observations, validate time-series quality, and compare transparent forecasting baselines with chronological rolling-origin evaluation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => setCurrentTab('real-csv-forecast')} className="group inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_8px_35px_rgba(34,211,238,.18)] transition hover:-translate-y-0.5 hover:bg-cyan-200">
                Open Forecast Lab <Play className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <button type="button" onClick={() => setCurrentTab('cadence-audit')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-200/40 hover:bg-white/[0.08]">
                Explore data audit <ShieldCheck className="h-4 w-4 text-cyan-200" />
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Source data stays local</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Chronological validation</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Honest evidence labels</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg [perspective:1200px]">
            <div className="ecam-orbit-card relative aspect-[1.08/1] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.11] to-white/[0.025] p-5 shadow-[0_35px_100px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,.13),transparent_48%)]" />
              <div className="relative flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span>Signal intelligence</span><span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2 py-1 text-cyan-100">Live workspace</span>
              </div>
              <div className="relative mt-5 flex h-[68%] items-center justify-center">
                <div className="ecam-orbit ecam-orbit-one absolute h-52 w-52 rounded-full border border-cyan-200/25 sm:h-60 sm:w-60" />
                <div className="ecam-orbit ecam-orbit-two absolute h-44 w-44 rounded-full border border-indigo-200/25 sm:h-52 sm:w-52" />
                <div className="ecam-orbit ecam-orbit-three absolute h-36 w-36 rounded-full border border-white/15 sm:h-44 sm:w-44" />
                <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-cyan-100/30 bg-gradient-to-br from-cyan-200/25 to-indigo-400/20 shadow-[0_0_70px_rgba(34,211,238,.2)] [transform:rotateX(12deg)_rotateY(-12deg)] sm:h-32 sm:w-32">
                  <Activity className="h-12 w-12 text-cyan-100" strokeWidth={1.2} />
                </div>
                <span className="absolute left-[16%] top-[24%] h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,.95)]" />
                <span className="absolute right-[17%] top-[38%] h-2 w-2 rounded-full bg-indigo-200 shadow-[0_0_16px_rgba(165,180,252,.95)]" />
                <span className="absolute bottom-[17%] left-[34%] h-2 w-2 rounded-full bg-sky-100 shadow-[0_0_14px_rgba(224,242,254,.9)]" />
              </div>
              <div className="relative grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                <div><div className="text-[9px] uppercase tracking-wider text-slate-500">Workflow</div><div className="mt-1 text-xs font-semibold text-slate-100">CSV intake</div></div>
                <div><div className="text-[9px] uppercase tracking-wider text-slate-500">Validation</div><div className="mt-1 text-xs font-semibold text-slate-100">Rolling origin</div></div>
                <div><div className="text-[9px] uppercase tracking-wider text-slate-500">Selection</div><div className="mt-1 text-xs font-semibold text-slate-100">Evidence-led</div></div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-3 rounded-xl border border-white/10 bg-[#101d2d]/95 px-4 py-3 shadow-xl backdrop-blur sm:-left-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Browser-side CSV processing</div>
              <div className="mt-1 text-[10px] text-slate-400">Your uploaded file is not sent to the app server</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick-Try Example Bar (Science UI Standard) */}
      {currentTab !== 'real-csv-forecast' && (
      <section className="bg-white border-b border-slate-200/80 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Play className="w-3 h-3 text-blue-600 inline" />
              Live Defense Scenarios:
            </span>

            {PRESET_SCENARIOS.map((scen) => {
              const isActive = selectedScenario.id === scen.id && selectedDomain === scen.domain;
              return (
                <button
                  key={scen.id}
                  onClick={() => {
                    handleDomainChange(scen.domain);
                    setSelectedScenario(scen);
                  }}
                  className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-80 mr-1">[{scen.domain}]</span>
                  <span>{scen.name.split('(')[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Origin: {selectedScenario.originTimestamp}
            </span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:inline">
              Horizon: H={DATASET_REGISTRY[selectedDomain].horizonSteps}
            </span>
          </div>
        </div>
      </section>
      )}

      {currentTab !== 'real-csv-forecast' && (
        <section className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
            <strong>Simulation mode:</strong> preset series, router weights, and reference leaderboard values on this screen are illustrative—not measurements from your CSV. Use <strong>Real CSV Forecast Lab</strong> for actual rolling-origin model evaluation.
          </div>
        </section>
      )}

      {/* Main Scientific Workbench Viewport */}
      <main id="workbench-view" className="ecam-workbench-main flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'real-csv-forecast' && <RealDataForecastModule />}

        {currentTab === 'cadence-audit' && (
          <DatasetAuditModule
            selectedDomain={selectedDomain}
            setSelectedDomain={handleDomainChange}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardModule selectedDomain={selectedDomain} />
        )}

        {currentTab === 'routing-weights' && (
          <RoutingWeightsModule
            selectedDomain={selectedDomain}
            selectedScenario={selectedScenario}
            setSelectedScenario={setSelectedScenario}
            conditioningVector={conditioningVector}
            routerWeights={routerWeights}
            ablation={ablation}
            stress={stress}
          />
        )}

        {currentTab === 'continuous-forecast' && (
          <ContinuousForecastModule
            selectedDomain={selectedDomain}
            selectedScenario={selectedScenario}
            forecastPoints={regressionResult.forecastPoints}
            operationalSummary={regressionResult.operationalSummary}
            gridCapacityMW={gridCapacityMW}
            setGridCapacityMW={setGridCapacityMW}
            overallMAE={regressionResult.overallMAE}
            overallRMSE={regressionResult.overallRMSE}
            overallMASE={regressionResult.overallMASE}
            overallCRPS={regressionResult.overallCRPS}
          />
        )}

        {currentTab === 'ablation-engine' && (
          <AblationEngineModule
            selectedDomain={selectedDomain}
            ablation={ablation}
            setAblation={setAblation}
            currentMAE={regressionResult.overallMAE}
            currentMASE={regressionResult.overallMASE}
            operationalSummary={regressionResult.operationalSummary}
          />
        )}

        {currentTab === 'stress-testing' && (
          <StressTestingDiagnosticsModule
            selectedDomain={selectedDomain}
            stress={stress}
            setStress={setStress}
            conditioningVector={conditioningVector}
            currentMAE={regressionResult.overallMAE}
          />
        )}

        {currentTab === 'defense-inquiry' && (
          <FacultyDefenseInquiryModule
            selectedDomain={selectedDomain}
            activeScenarioName={selectedScenario.name}
            gridCapacityMW={gridCapacityMW}
          />
        )}

        {currentTab === 'scientific-literature' && (
          <LiteratureModule />
        )}
      </main>

      {/* Academic Footer & Provenance Metadata */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-semibold text-slate-800">
              ECAM-TS: Event- and Context-Aware Multi-Domain Time-Series Forecasting
            </div>
            <p className="text-[11px] text-slate-500">
              Author: Arafat Said (arafat.said@northsouth.edu) • North South University
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Protocol: CSV rolling-origin
            </span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Simplex: Σ w_m = 1.000
            </span>
            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-semibold">
              AI: gemini-3.1-pro-preview (HIGH)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

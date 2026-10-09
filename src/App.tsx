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
import { AnimatePresence, motion } from 'motion/react';
import { DataIntakeLabModule } from './components/DataIntakeLabModule';
import { ResearchRoadmapModule } from './components/ResearchRoadmapModule';
import { Activity, ArrowRight, ShieldCheck, Play, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('data-intake');
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
    <div id="top" data-domain={selectedDomain} className="ecam-app min-h-screen flex flex-col font-sans antialiased selection:bg-teal-200 selection:text-slate-950">
      {/* Top Header & Defense Navigation */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedDomain={selectedDomain}
        setSelectedDomain={handleDomainChange}
      />

      <section className="ecam-hero">
        <div className="ecam-hero-inner">
          <motion.div className="ecam-hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: 'easeOut' }}>
            <div className="ecam-eyebrow"><span className="ecam-eyebrow-line" /> TIME-SERIES RESEARCH · MADE REPRODUCIBLE</div>
            <h2>From raw signals<br /><span>to defensible forecasts.</span></h2>
            <p>Inspect real observations, compare transparent baselines, and build toward event-aware adaptive model selection—with the evidence trail visible at every step.</p>
            <div className="ecam-hero-actions">
              <button type="button" className="ecam-primary-action" onClick={() => { setCurrentTab('data-intake'); document.getElementById('workbench-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Open research workbench <ArrowRight size={16} /></button>
              <button type="button" className="ecam-secondary-action" onClick={() => setCurrentTab('cadence-audit')}>Explore data audit</button>
            </div>
            <div className="ecam-hero-proof">
              <span><CheckCircle2 size={14} /> Source provenance</span>
              <span><CheckCircle2 size={14} /> Chronological evaluation</span>
              <span><ShieldCheck size={14} /> Honest status labels</span>
            </div>
          </motion.div>
          <motion.div className="ecam-hero-visual" initial={{ opacity: 0, scale: .92, rotateY: -10 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} transition={{ duration: .8, delay: .08, ease: 'easeOut' }} aria-label="Abstract three-dimensional time-series visualization">
            <div className="ecam-orb-grid" />
            <div className="ecam-orb-halo" />
            <div className="ecam-orb">
              <div className="ecam-orb-core"><Activity size={38} strokeWidth={1.4} /></div>
              <div className="ecam-orb-ring ring-one" />
              <div className="ecam-orb-ring ring-two" />
              <div className="ecam-orb-ring ring-three" />
              <span className="ecam-orb-node node-a" /><span className="ecam-orb-node node-b" /><span className="ecam-orb-node node-c" />
            </div>
            <div className="ecam-visual-tag tag-top"><span className="tag-dot" /> LIVE DATA PATH <strong>01 / INTAKE</strong></div>
            <div className="ecam-visual-tag tag-bottom"><span className="tag-wave">∿</span><span>Forecast horizon<br /><strong>Rolling origin</strong></span><span className="tag-mini-bars"><i /><i /><i /><i /><i /></span></div>
            <div className="ecam-visual-caption">ECAM / SYSTEM MAP <span>INTERACTIVE PROTOTYPE</span></div>
          </motion.div>
        </div>
      </section>

      {/* Clearly marked illustrative presets, not a source-data model run. */}
      <section className="ecam-scenario-bar border-b py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Play className="w-3 h-3 inline" />
              Illustrative scenarios:
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
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Demo origin: {selectedScenario.originTimestamp}
            </span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:inline">
              Horizon: H={DATASET_REGISTRY[selectedDomain].horizonSteps}
            </span>
          </div>
        </div>
      </section>

      {/* Data integrity notice. Existing scenario modules remain simulated until real training runs are wired in. */}
      <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950 sm:mx-6 lg:mx-8">
        <div className="mx-auto flex max-w-7xl items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p><strong>Data integrity.</strong> Scenario charts, fixed benchmark scores, routing weights and stress-test outputs are simulated/static demonstrations—not measured research results. Use <strong>Real Data Intake & Backtest</strong> for imported source CSVs or live NASA POWER observations. Uploads do not automatically replace the simulation in other tabs.</p>
        </div>
      </div>

      {/* Main Scientific Workbench Viewport */}
      <main id="workbench-view" className="ecam-workbench-main flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={currentTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.18 }}>
            {currentTab === 'data-intake' && <DataIntakeLabModule />}
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

        {currentTab === 'research-roadmap' && <ResearchRoadmapModule navigateToTab={setCurrentTab} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Academic Footer & Provenance Metadata */}
      <footer className="ecam-footer border-t mt-12 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-semibold text-slate-800">
              ECAM-TS · Event- and Context-Aware Time-Series Forecasting
            </div>
            <p className="text-[11px] text-slate-500">
              Author: Arafat Said (arafat.said@northsouth.edu) • North South University
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Data: source-backed baseline module
            </span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Weights: Heuristic preview—not fitted
            </span>
            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-semibold">
              Full ECAM-TS: not yet validated
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
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
import { ShieldCheck, Play, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('real-csv-forecast');
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
    <div className="min-h-screen bg-[#F7F5EF] text-slate-900 flex flex-col font-sans antialiased selection:bg-[#dcebe0] selection:text-[#153a29]">
      {/* Top Header & Defense Navigation */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedDomain={selectedDomain}
        setSelectedDomain={handleDomainChange}
      />

      {/* Quick-Try Example Bar (Science UI Standard) */}
      {currentTab !== 'real-csv-forecast' && (
      <section className="bg-white border-b border-slate-200/80 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Play className="w-3 h-3 text-[#245b40] inline" />
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
                      ? 'bg-[#245b40] text-white shadow-sm font-semibold'
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
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
      <footer className="bg-white border-t border-slate-200 mt-8 sm:mt-12 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-xs text-slate-500">
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
            <span className="bg-[#fbf6e9] text-[#795c30] px-2 py-0.5 rounded border border-[#edd7a2] font-semibold">
              AI: gemini-3.1-pro-preview (HIGH)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

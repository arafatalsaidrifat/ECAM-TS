import React from 'react';
import { DomainCode } from '../types';
import { DATASET_REGISTRY } from '../data/datasets';
import { ShieldCheck, Activity, Cpu, Database, BookOpen, HelpCircle } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedDomain: DomainCode;
  setSelectedDomain: (domain: DomainCode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  selectedDomain,
  setSelectedDomain,
}) => {
  const currentDataset = DATASET_REGISTRY[selectedDomain];

  const tabs = [
    { id: 'data-intake', label: 'Start here · Real Data Intake & Backtest', icon: Database },
    { id: 'cadence-audit', label: '1. Dataset & Cadence Audit', icon: Database },
    { id: 'leaderboard', label: '2. Baseline & TSFM Benchmark', icon: Activity },
    { id: 'routing-weights', label: '3. Context Router & Weights', icon: Cpu },
    { id: 'continuous-forecast', label: '4. Forecast & Operational Impact', icon: Activity },
    { id: 'ablation-engine', label: '5. Festival Feature Ablation', icon: ShieldCheck },
    { id: 'stress-testing', label: '6. Stress Tests & Diagnostics', icon: ShieldCheck },
    { id: 'defense-inquiry', label: '7. Committee Defense Advisory', icon: HelpCircle },
    { id: 'scientific-literature', label: '8. Science Literature & Citations', icon: BookOpen },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Academic Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              ECAM-TS
            </span>
            <span className="text-xs font-mono text-slate-500">
              Research Prototype
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Leakage controls are a protocol target—not validated yet
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
            ECAM-TS Research Defense Workbench
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Event- & Context-Aware Adaptive Model Selection for Multi-Domain Time-Series Forecasting
          </p>
        </div>

        {/* Domain Selector & Provenance Pills */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="text-right hidden sm:block mr-2">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Selected target candidate
            </div>
            <div className="text-xs font-semibold text-slate-800">
              {currentDataset.unit} Native Cadence
            </div>
          </div>
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(Object.keys(DATASET_REGISTRY) as DomainCode[]).map((code) => {
              const d = DATASET_REGISTRY[code];
              const isSelected = selectedDomain === code;
              return (
                <button
                  key={code}
                  onClick={() => setSelectedDomain(code)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-blue-700 shadow-xs font-semibold border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                  title={d.title}
                >
                  <span className="font-mono">{code}</span>
                  <span className="ml-1 text-[10px] opacity-75 hidden md:inline">
                    ({d.unit})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

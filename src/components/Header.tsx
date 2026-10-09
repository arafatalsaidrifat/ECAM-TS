import React from 'react';
import { DomainCode } from '../types';
import { DATASET_REGISTRY } from '../data/datasets';
import { Activity, BookOpen, Cpu, Database, HelpCircle, ShieldCheck, SlidersHorizontal, ChartNoAxesCombined, GitBranch } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedDomain: DomainCode;
  setSelectedDomain: (domain: DomainCode) => void;
}
const tabs = [
  { id: 'data-intake', label: 'Workbench', short: 'Workbench', icon: Database, group: 'Core' },
  { id: 'cadence-audit', label: 'Data audit', short: 'Audit', icon: ShieldCheck, group: 'Core' },
  { id: 'leaderboard', label: 'Benchmarks', short: 'Benchmarks', icon: ChartNoAxesCombined, group: 'Models' },
  { id: 'routing-weights', label: 'Adaptive routing', short: 'Routing', icon: Cpu, group: 'Models' },
  { id: 'continuous-forecast', label: 'Forecasts', short: 'Forecasts', icon: Activity, group: 'Models' },
  { id: 'ablation-engine', label: 'Ablations', short: 'Ablations', icon: SlidersHorizontal, group: 'Diagnostics' },
  { id: 'stress-testing', label: 'Stress tests', short: 'Stress tests', icon: ShieldCheck, group: 'Diagnostics' },
  { id: 'scientific-literature', label: 'Literature', short: 'Literature', icon: BookOpen, group: 'Research' },
  { id: 'defense-inquiry', label: 'Research notes', short: 'Notes', icon: HelpCircle, group: 'Research' },
  { id: 'research-roadmap', label: 'Research plan', short: 'Plan', icon: GitBranch, group: 'Research' },
];
export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, selectedDomain, setSelectedDomain }) => {
  const currentDataset = DATASET_REGISTRY[selectedDomain];
  return (
    <header className="ecam-header sticky top-0 z-50">
      <div className="ecam-header-main">
        <a className="ecam-brand" href="#top" onClick={(event) => { event.preventDefault(); setCurrentTab('data-intake'); }}>
          <span className="ecam-brand-mark"><Activity size={19} strokeWidth={2.4} /></span>
          <span><strong>ECAM<span>·</span>TS</strong><small>Forecast research studio</small></span>
        </a>
        <div className="ecam-header-meta">
          <span className="ecam-live-dot" /> <span>Research workspace</span>
          <span className="ecam-meta-divider" />
          <label htmlFor="ecam-domain">Domain</label>
          <select id="ecam-domain" value={selectedDomain} onChange={event => setSelectedDomain(event.target.value as DomainCode)}>
            {(Object.keys(DATASET_REGISTRY) as DomainCode[]).map(code => <option key={code} value={code}>{code} · {DATASET_REGISTRY[code].unit}</option>)}
          </select>
        </div>
      </div>
      <div className="ecam-nav-wrap">
        <nav className="ecam-nav" aria-label="Main navigation">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return <button key={tab.id} type="button" onClick={() => setCurrentTab(tab.id)} className={active ? 'ecam-nav-link active' : 'ecam-nav-link'} aria-current={active ? 'page' : undefined}>
              <Icon size={15} /><span>{tab.label}</span>{active && <motion.span className="ecam-nav-indicator" layoutId="ecam-nav-indicator" transition={{ type: 'spring', stiffness: 430, damping: 35 }} />}
            </button>;
          })}
        </nav>
      </div>
      <div className="ecam-domain-context">
        <div><span className="ecam-context-kicker">SELECTED RESEARCH DOMAIN</span><strong>{currentDataset.title}</strong></div>
        <span className="ecam-context-chip">{currentDataset.nativeCadence}</span>
        <span className="ecam-context-status"><ShieldCheck size={14} /> Baselines only · empirical results pending</span>
      </div>
    </header>
  );
};

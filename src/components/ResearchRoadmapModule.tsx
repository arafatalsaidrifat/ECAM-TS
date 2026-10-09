import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowDownRight, ArrowRight, BookOpen, CheckCircle2, Circle, Database,
  FileText, GitBranch, ShieldCheck, Sparkles, Target, Workflow,
} from 'lucide-react';

type Props = { navigateToTab: (tab: string) => void };

const milestones = [
  { id: 'A', title: 'Freeze the research scope', status: 'Protocol gate', description: 'Confirm the target definition, primary domain, optional food-price transfer task, prediction horizon, compute budget and the supervisor-approved novelty claim.', evidence: 'Signed-off protocol + literature search log', tab: 'research-roadmap' },
  { id: 'B', title: 'Acquire and version real observations', status: 'Next priority', description: 'Download the actual data table—not a catalog summary. Preserve the original; record exact URL/version, retrieval date, terms/license, SHA-256, units, timezone, cadence and revisions.', evidence: 'Immutable source file + dataset card + checksum', tab: 'data-intake' },
  { id: 'C', title: 'Establish rigorous baselines', status: 'Partially implemented', description: 'Use chronological rolling-origin splits and an untouched final test block. Add seasonal-naive, ETS/ARIMA/Theta and leakage-safe lag-feature tree models before comparing foundation models.', evidence: 'Per-origin predictions, metrics, folds and repeatable configs', tab: 'data-intake' },
  { id: 'D', title: 'Test the proposed context contribution', status: 'Novelty test', description: 'Compare matched models with and without known calendar/event context. Use only information available at each forecast origin; report event episodes and uncertainty without unsupported causal claims.', evidence: 'Ablation table + event-stratified errors + uncertainty', tab: 'ablation-engine' },
  { id: 'E', title: 'Integrate model candidates and routing', status: 'Not yet integrated', description: 'Pin and verify selected Chronos/TimesFM/Moirai adapters. Generate leakage-safe out-of-fold predictions, then compare best-single, equal-weight, regularized stacking and context-conditioned routing.', evidence: 'Reproducible OOF prediction store + held-out comparison', tab: 'routing-weights' },
  { id: 'F', title: 'Validate across time and datasets', status: 'Required before claims', description: 'Repeat outer chronological evaluation across multiple periods and, if data quality permits, a distinct domain. Add calibrated prediction intervals and robust error analysis.', evidence: 'Repeated outer holdouts + confidence intervals + limitations', tab: 'leaderboard' },
  { id: 'G', title: 'Productionize and publish', status: 'Future milestone', description: 'Persist data cards and experiment artifacts; add background jobs, authentication, access controls, quotas, audit logs, monitoring, backups and deployment checks.', evidence: 'Secure deploy + versioned experiment records + final report', tab: 'research-roadmap' },
];

const sourceLinks = [
  { label: 'Mendeley electricity dataset', detail: 'Download the actual hourly observations file and read its data description.', href: 'https://data.mendeley.com/datasets/vpk8spw2mm/1', type: 'Dataset' },
  { label: 'World Bank food-price data API', detail: 'Inspect the catalog/API documentation and choose the intended data extract/version.', href: 'https://microdata.worldbank.org/catalog/6164/data-api', type: 'Dataset' },
  { label: 'Monash Forecasting Archive', detail: 'Public benchmark archive for additional, separately scoped time-series tasks.', href: 'https://forecastingdata.org/', type: 'Benchmark' },
  { label: 'M4 Competition data', detail: 'Established benchmark data; do not treat it as Bangladesh-specific evidence.', href: 'https://mofc.unic.ac.cy/m4/', type: 'Benchmark' },
  { label: 'Google Scholar query', detail: 'Search event-aware forecast combination and context-conditioned model selection.', href: 'https://scholar.google.com/scholar?q=event-aware+forecast+combination+context-aware+time-series+model+selection', type: 'Literature' },
  { label: 'IEEE Xplore query', detail: 'Search electricity load forecasting, calendar events and adaptive ensembles.', href: 'https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=electricity%20load%20forecasting%20calendar%20event%20ensemble', type: 'Literature' },
];

export const ResearchRoadmapModule: React.FC<Props> = ({ navigateToTab }) => (
  <div className="space-y-5">
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-6 text-white sm:p-8">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-teal-200"><GitBranch size={15}/> Research integration plan</div>
        <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">From a working prototype to defensible evidence.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">This roadmap separates implemented baseline functionality from planned research components. A section being visible in the interface does not mean its demo values are empirical results.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-teal-200/25 bg-teal-300/10 px-3 py-1.5 text-[11px] font-semibold text-teal-100">Working: CSV audit + five baselines</span>
          <span className="rounded-full border border-amber-200/25 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold text-amber-100">Pending: full ECAM-TS validation</span>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><Database className="h-5 w-5 text-teal-700"/><div className="mt-3 text-sm font-bold text-slate-900">1. Verified data</div><p className="mt-1 text-xs leading-5 text-slate-600">A real observation file, documented provenance and a target with a clear meaning.</p><button onClick={() => navigateToTab('data-intake')} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-800">Open data intake <ArrowRight size={13}/></button></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><Target className="h-5 w-5 text-indigo-700"/><div className="mt-3 text-sm font-bold text-slate-900">2. Fair evaluation</div><p className="mt-1 text-xs leading-5 text-slate-600">Chronological splits, strong baselines, per-origin scores and untouched holdouts.</p><button onClick={() => navigateToTab('leaderboard')} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-800">Open benchmarks <ArrowRight size={13}/></button></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><Sparkles className="h-5 w-5 text-violet-700"/><div className="mt-3 text-sm font-bold text-slate-900">3. Novelty test</div><p className="mt-1 text-xs leading-5 text-slate-600">Prove whether context-conditioned combination adds value beyond known methods.</p><button onClick={() => navigateToTab('ablation-engine')} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-800">Open ablations <ArrowRight size={13}/></button></div>
      </div>
    </motion.section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-teal-700">Sequenced milestones</div><h3 className="mt-1 text-lg font-bold text-slate-900">What must happen next</h3><p className="mt-1 text-xs leading-5 text-slate-500">Complete each evidence gate before making stronger research claims.</p></div><span className="text-[10px] text-slate-500">7 stages · no claimed completion without artifacts</span></div>
      <div className="mt-5 space-y-3">
        {milestones.map((item, index) => (
          <motion.article key={item.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .035 }} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[42px_minmax(0,1fr)_auto] sm:items-start">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-xs font-extrabold text-slate-700">{item.id}</div>
            <div><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-bold text-slate-900">{item.title}</h4><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">{item.status}</span></div><p className="mt-1.5 text-xs leading-5 text-slate-600">{item.description}</p><p className="mt-2 text-[10px] text-slate-500"><strong className="text-slate-700">Evidence gate:</strong> {item.evidence}</p></div>
            <button onClick={() => navigateToTab(item.tab)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 hover:border-teal-300 hover:text-teal-800">Open section <ArrowDownRight size={13}/></button>
          </motion.article>
        ))}
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><FileText size={19}/></div><div className="min-w-0 flex-1"><h3 className="text-lg font-bold text-slate-900">Research structure · first proposal edition</h3><p className="mt-1 text-xs leading-5 text-slate-600">The structure preserves the proposal's problem, objectives, questions, hypotheses, methodology, dataset audit, novelty tests, evaluation, risks, semester timeline and supervisor decisions. Open the print-ready version and use your browser's Print → Save as PDF. A later approved PDF can replace this planning edition.</p><div className="mt-4 flex flex-wrap gap-2"><a href="/research-proposal.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700">Open / print proposal structure <ArrowRight size={14}/></a><a href="https://github.com/arafatalsaidrifat/ECAM-TS/blob/feat/research-workbench-mvp/docs/ECAM_TS_Research_Proposal.md" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-teal-300">View editable outline <BookOpen size={14}/></a></div></div></div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-teal-700">Dataset & paper discovery</div><h3 className="mt-1 text-lg font-bold text-slate-900">Research sources to verify</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">These are entry points, not proof that every paper or dataset is accessible. Some sources require an account, approved access, or separate license review.</p></div><span className="text-[10px] text-slate-500">Check license and version before use</span></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sourceLinks.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="group rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-sm"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-900">{item.label}</span><ArrowRight size={14} className="shrink-0 text-slate-400 group-hover:text-teal-700"/></div><p className="mt-1.5 text-xs leading-5 text-slate-600">{item.detail}</p><span className="mt-3 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">{item.type}</span></a>)}
      </div>
      <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><ShieldCheck size={16} className="mt-0.5 shrink-0"/><p><strong>Important:</strong> No application can guarantee access to every paper or dataset. ECAM-TS must use the files and APIs you are legally allowed to access. Literature search results must be screened and verified; the app must never invent a dataset, license, ranking or citation.</p></div>
    </section>
  </div>
);

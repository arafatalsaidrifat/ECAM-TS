import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity, ArrowUpRight, CheckCircle2, Database, Download,
  ExternalLink, Info, Search, ShieldAlert, Waves,
} from 'lucide-react';
import { DOMAIN_COLORS, DOMAIN_LABELS, SOURCE_REGISTRY, type SourceRecord } from '../data/sourceRegistry';
import type { DomainCode } from '../types';

interface SourceRegistryModuleProps {
  selectedDomain: DomainCode;
  navigateToTab: (tab: string) => void;
}

const statusTone: Record<SourceRecord['status'], string> = {
  'adapter-implemented': 'border-teal-200 bg-teal-50 text-teal-800',
  'manual-download': 'border-slate-200 bg-slate-100 text-slate-700',
  candidate: 'border-amber-200 bg-amber-50 text-amber-900',
  benchmark: 'border-violet-200 bg-violet-50 text-violet-800',
};

const statusIcon = (status: SourceRecord['status']) => {
  if (status === 'adapter-implemented') return <CheckCircle2 size={13} />;
  if (status === 'manual-download') return <Download size={13} />;
  if (status === 'benchmark') return <Activity size={13} />;
  return <ShieldAlert size={13} />;
};

const statusSummary: Record<SourceRecord['status'], string> = {
  'adapter-implemented': 'App adapter exists · live response checked on request',
  'manual-download': 'Downloaded file required · preserve source version',
  candidate: 'Source lead only · connection/access not verified',
  benchmark: 'Research comparison only · not an operational feed',
};

export const SourceRegistryModule: React.FC<SourceRegistryModuleProps> = ({ selectedDomain, navigateToTab }) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'domain' | 'all'>('domain');
  const selectedColor = DOMAIN_COLORS[selectedDomain];

  const sources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SOURCE_REGISTRY.filter(source => scope === 'all'
      ? true
      : source.domain === selectedDomain || source.domain === 'cross-domain'
    ).filter(source => !q || [
      source.name, source.provider, source.targets, source.cadence, source.statusLabel, source.caveat,
    ].join(' ').toLowerCase().includes(q));
  }, [query, scope, selectedDomain]);

  const implementedCount = SOURCE_REGISTRY.filter(source => source.status === 'adapter-implemented').length;
  const candidateCount = SOURCE_REGISTRY.filter(source => source.status === 'candidate').length;
  const manualCount = SOURCE_REGISTRY.filter(source => source.status === 'manual-download').length;
  const benchmarkCount = SOURCE_REGISTRY.filter(source => source.status === 'benchmark').length;

  return (
    <div className="space-y-5" data-domain={selectedDomain}>
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-slate-950 px-5 py-6 text-white sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ background: selectedColor }} />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: selectedColor }}>
                <Database size={14} /> Data source registry
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Know the source before trusting the forecast.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">A documented catalogue of operational data leads, implemented adapters, manual downloads, and research benchmarks. Connection status is kept separate from a provider's public landing page.</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-slate-200">
                <Waves size={14} /> Current domain: {DOMAIN_LABELS[selectedDomain]}
              </div>
            </div>
            <button type="button" onClick={() => navigateToTab('data-intake')} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5" style={{ background: selectedColor }}>
              Open import workbench <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
          {[
            { label: 'App adapter', count: implementedCount, note: 'implemented route' },
            { label: 'Manual download', count: manualCount, note: 'file-based intake' },
            { label: 'Source candidates', count: candidateCount, note: 'verification needed' },
            { label: 'Benchmarks', count: benchmarkCount, note: 'research-only data' },
          ].map(card => <div key={card.label} className="bg-white p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</div><div className="mt-1 text-2xl font-bold text-slate-900">{card.count}</div><div className="mt-1 text-[10px] text-slate-500">{card.note}</div></div>)}
        </div>
      </motion.section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
        <div className="flex items-start gap-2.5"><Info size={16} className="mt-0.5 shrink-0" /><p><strong>Connection-status rule:</strong> these labels describe what the application implements or what has been identified as a source lead. They do not certify provider uptime, data completeness, license suitability, or successful retrieval today. The NASA POWER route is implemented; its response is validated when you request a date range in the Workbench. Candidate sources still require access and terms checks.</p></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-base font-bold text-slate-900">Source catalogue</h3><p className="mt-1 text-xs text-slate-500">Filter by the active domain or review all known source candidates.</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setScope('domain')} className={scope === 'domain' ? 'rounded-lg px-3 py-2 text-xs font-bold text-white' : 'rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600'} style={scope === 'domain' ? { background: selectedColor } : undefined}>Current domain</button>
            <button type="button" onClick={() => setScope('all')} className={scope === 'all' ? 'rounded-lg px-3 py-2 text-xs font-bold text-white' : 'rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600'} style={scope === 'all' ? { background: selectedColor } : undefined}>All sources</button>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search size={15} className="text-slate-400" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search provider, source, target, or status…" className="w-full border-0 bg-transparent text-xs outline-none focus:ring-0" aria-label="Search source registry" />
        </label>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {sources.map((source, index) => {
            const color = source.domain === 'cross-domain' ? '#64748b' : DOMAIN_COLORS[source.domain];
            const domainName = source.domain === 'cross-domain' ? 'Cross-domain benchmark' : DOMAIN_LABELS[source.domain];
            return (
              <motion.article key={source.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .025, .2) }} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
                <div className="pl-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1"><div className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{domainName}</div><h4 className="mt-1 text-sm font-bold text-slate-900">{source.name}</h4><p className="mt-1 text-[11px] text-slate-500">{source.provider}</p></div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold ${statusTone[source.status]}`}>{statusIcon(source.status)}{source.statusLabel}</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                    <div><dt className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Access method</dt><dd className="mt-1 text-[11px] font-semibold text-slate-800">{source.accessMethod}</dd></div>
                    <div><dt className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Frequency</dt><dd className="mt-1 text-[11px] font-semibold text-slate-800">{source.cadence}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Candidate targets</dt><dd className="mt-1 text-[11px] leading-5 text-slate-700">{source.targets}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Data type</dt><dd className="mt-1 text-[11px] text-slate-700">{source.dataKind}</dd></div>
                  </dl>
                  <p className="mt-3 text-[11px] leading-5 text-slate-600">{source.statusDetail}</p>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500"><strong className="text-slate-700">Important limitation:</strong> {source.caveat}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                    <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold underline decoration-slate-300 underline-offset-4 hover:text-slate-950" style={{ color }}>Open official source <ExternalLink size={12} /></a>
                    {source.status !== 'benchmark' && <button type="button" onClick={() => navigateToTab('data-intake')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:border-slate-300">Open import workflow <ArrowUpRight size={12} /></button>}
                  </div>
                  <div className="mt-3 text-[9px] text-slate-400">{statusSummary[source.status]}</div>
                </div>
              </motion.article>
            );
          })}
          {sources.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 xl:col-span-2">No registered sources match that search. Try a provider, target variable, or broader scope.</div>}
        </div>
      </section>
    </div>
  );
};

import React, { useState } from 'react';
import { DomainCode, CandidateModel } from '../types';
import { MODEL_CANDIDATE_POOL } from '../data/datasets';
import { Activity, Zap, Award, ArrowUpDown, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

interface LeaderboardModuleProps {
  selectedDomain: DomainCode;
}

export const LeaderboardModule: React.FC<LeaderboardModuleProps> = ({ selectedDomain }) => {
  const [sortKey, setSortKey] = useState<keyof CandidateModel>('mae');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const models = MODEL_CANDIDATE_POOL[selectedDomain] || [];

  const sortedModels = [...models].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  const handleSort = (key: keyof CandidateModel) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const getFamilyBadge = (family: string) => {
    switch (family) {
      case 'Meta-Learned Combination':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Foundation Model':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Supervised Tree':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Classical Statistical':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Heuristic Ensemble':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-blue-50 text-blue-700">
                <Activity className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                MODEL CANDIDATE REGISTRY · LEGACY PREVIEW
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Candidate Model Comparison Preview
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Candidate families include statistical forecasters, supervised trees, time-series foundation models, and combinations. The model rows and metric values below are legacy illustrative placeholders—not outputs from the current user's uploaded dataset or a verified benchmark run.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">Protocol:</span>
            <span className="font-mono text-slate-600">Illustrative metadata · not executed</span>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-5 text-amber-950">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div><strong>Illustrative preview only — not empirical evidence.</strong> MAE, RMSE, MASE, CRPS, latency values, rankings, and the displayed protocol counts in this legacy registry were not computed by this app from a recorded rolling-origin experiment. Do not cite or compare these figures as research results. Use the Workbench for measured baselines; model adapters and the shared experiment ledger are planned work.</div>
        </div>
        {/* Table of Models */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                <th className="py-3 px-3 font-semibold">Rank & Model</th>
                <th className="py-3 px-3 font-semibold">Model Family</th>
                <th className="py-3 px-3 font-semibold">Checkpoint / Specs</th>
                <th
                  onClick={() => handleSort('mae')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-blue-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>MAE</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('rmse')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-blue-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>RMSE</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('mase')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-blue-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>MASE</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('crps')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-blue-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>CRPS</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('latencyMs')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-blue-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Latency (ms)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedModels.map((m, idx) => {
                const isBest = idx === 0 && sortKey === 'mae';
                const isRouter = m.id.includes('router') || m.id === 'ecam_router';
                return (
                  <tr
                    key={m.id}
                    className={`transition-colors ${
                      isRouter
                        ? 'bg-blue-50/40 font-medium'
                        : isBest
                        ? 'bg-emerald-50/30'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {m.name}
                            {isRouter && (
                              <Award className="w-3.5 h-3.5 text-blue-600 inline" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {m.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${getFamilyBadge(
                          m.family
                        )}`}
                      >
                        {m.family}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      {m.checkpoint}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {m.mae.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700">
                      {m.rmse.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {m.mase.toFixed(3)}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700">
                      {m.crps.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          m.latencyMs < 10
                            ? 'bg-emerald-50 text-emerald-800 font-semibold'
                            : m.latencyMs > 100
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-slate-100'
                        }`}
                      >
                        {m.latencyMs} ms
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance vs Compute Pareto Frontier Visualization */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Accuracy vs Inference Latency Pareto Frontier (Table 2 Empirical Trade-off)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Displays why ECAM-TS combines fast supervised trees (~2.5ms) with zero-shot foundation models (~145ms) without incurring prohibitive latency.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.slice(0, 6).map((m) => {
            const isRouter = m.id.includes('router') || m.id === 'ecam_router';
            return (
              <div
                key={m.id}
                className={`p-4 rounded-lg border transition-all ${
                  isRouter
                    ? 'border-blue-300 bg-blue-50/50 shadow-2xs'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-900">{m.shortName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                      m.latencyMs < 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {m.latencyMs} ms/origin
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">MAE:</span>
                    <span className="font-mono font-bold text-slate-900">{m.mae}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">MASE Scaled:</span>
                    <span className="font-mono text-slate-800">{m.mase}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">CRPS Uncertainty:</span>
                    <span className="font-mono text-slate-800">{m.crps}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  {m.badge}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">Interpretation boundary: </span>
            This card is retained for interface prototyping only. Its numbers are not the output of executed experiments, so no model can be declared the winner from this screen. A defensible comparison requires the same dataset version, feature availability, forecast origins, training cutoffs, and horizons for every candidate, plus stored fold-level predictions and measured runtimes.
          </div>
        </div>
      </div>
    </div>
  );
};

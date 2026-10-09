import React, { useState } from 'react';
import { OperationalImpactSummary } from '../types';
import { AlertTriangle, CheckCircle2, AlertCircle, Copy, Check, Info } from 'lucide-react';

interface OperationalDecisionBoxProps {
  summary: OperationalImpactSummary;
}

export const OperationalDecisionBox: React.FC<OperationalDecisionBoxProps> = ({ summary }) => {
  const [copied, setCopied] = useState(false);

  const isAlert = summary.alertLevel === 'critical' || summary.alertLevel === 'warning';

  const handleCopyMarkdown = () => {
    const md = `> **OPERATIONAL IMPACT SUMMARY (${summary.domain})**:
> - **Primary Metric / Peak Value**: ${summary.peakValue.toLocaleString()} ${summary.physicalUnit}
> - **Operational Threshold / Available Capacity**: ${summary.capacityOrCeiling.toLocaleString()} ${summary.physicalUnit}
> - **Net Operating Balance**: ${summary.netBalance > 0 ? '+' : ''}${summary.netBalance.toLocaleString()} ${summary.physicalUnit} (${summary.netBalancePct > 0 ? '+' : ''}${summary.netBalancePct}%)
> - **Status**: ${summary.isDeficit ? 'SHORTAGE / DEFICIT DETECTED' : 'ADEQUATE BUFFER ASSURED'}
> - **Duration**: ${summary.deficitDurationHours > 0 ? `${summary.deficitDurationHours} consecutive hours` : '0 hours (Continuous stability)'}
> - **Actionable Domain Recommendation**: ${summary.recommendedAction}`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-xl border p-5 shadow-xs transition-all ${
        summary.alertLevel === 'critical'
          ? 'bg-rose-50/60 border-rose-300'
          : summary.alertLevel === 'warning'
          ? 'bg-amber-50/60 border-amber-300'
          : 'bg-emerald-50/60 border-emerald-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              summary.alertLevel === 'critical'
                ? 'bg-rose-100 text-rose-700'
                : summary.alertLevel === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {summary.alertLevel === 'critical' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : summary.alertLevel === 'warning' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-500">
                BLOCK B: DOMAIN OPERATIONAL IMPACT DECISION
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                  summary.alertLevel === 'critical'
                    ? 'bg-rose-200 text-rose-900'
                    : summary.alertLevel === 'warning'
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                {summary.alertLevel}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {summary.title}
            </h3>
          </div>
        </div>

        <button
          onClick={handleCopyMarkdown}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          title="Copy markdown blockquote for defense presentation"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy MD'}</span>
        </button>
      </div>

      {/* Primary Key Figures Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-white/80 p-3 rounded-lg border border-slate-200/80">
          <div className="text-[11px] text-slate-500 font-medium">Peak Projected Demand</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {summary.peakValue.toLocaleString()} <span className="text-xs font-normal text-slate-600">{summary.physicalUnit}</span>
          </div>
        </div>

        <div className="bg-white/80 p-3 rounded-lg border border-slate-200/80">
          <div className="text-[11px] text-slate-500 font-medium">Available Capacity / Limit</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {summary.capacityOrCeiling.toLocaleString()} <span className="text-xs font-normal text-slate-600">{summary.physicalUnit}</span>
          </div>
        </div>

        <div className="bg-white/80 p-3 rounded-lg border border-slate-200/80">
          <div className="text-[11px] text-slate-500 font-medium">Net Operating Balance</div>
          <div
            className={`text-lg font-bold font-mono mt-0.5 ${
              summary.isDeficit ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {summary.netBalance > 0 ? '+' : ''}
            {summary.netBalance.toLocaleString()}{' '}
            <span className="text-xs font-normal opacity-80">{summary.physicalUnit}</span>
          </div>
        </div>

        <div className="bg-white/80 p-3 rounded-lg border border-slate-200/80">
          <div className="text-[11px] text-slate-500 font-medium">Deficit Exposure Duration</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {summary.deficitDurationHours > 0 ? `${summary.deficitDurationHours} Hours` : '0 Hours (None)'}
          </div>
        </div>
      </div>

      {/* Narrative Summary & Action Blockquote */}
      <div className="bg-white/95 rounded-lg border border-slate-200 p-3.5 space-y-2">
        <div className="text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Empirical Synthesis: </span>
          {summary.summaryText}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-slate-900">Recommended Executive Action: </span>
            <span className="text-slate-800 font-medium">{summary.recommendedAction}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

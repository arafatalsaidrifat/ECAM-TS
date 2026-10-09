import React, { useState } from 'react';
import { DomainCode, FacultyInquiry } from '../types';
import { HelpCircle, Sparkles, Send, Copy, Check, UserCheck, ShieldCheck, Cpu } from 'lucide-react';

interface FacultyDefenseInquiryModuleProps {
  selectedDomain: DomainCode;
  activeScenarioName: string;
  gridCapacityMW: number;
}

const PRESET_COMMITTEE_QUESTIONS = [
  {
    role: 'Dr. Methodological Rigor (Defense Chair)',
    label: 'Temporal Anti-Leakage Proof',
    question:
      'Prove mathematically and architecturally that the ECAM-TS conditioning vector z_(d,i) and dynamic routing weights strictly prevent temporal data leakage and look-ahead bias across rolling historical origins.',
  },
  {
    role: 'Dr. Baseline Skeptic (Foundation Model Reviewer)',
    label: '1/M Ensemble Superiority on Food Data',
    question:
      'Why does simple Equal-Weight Averaging (1/M) match or slightly outperform the meta-router on monthly food prices (BD-FOOD-M), and how does this characterize the variance boundaries of meta-learning on small sample sizes (V < 40)?',
  },
  {
    role: 'Dr. Performance & Systems Reviewer',
    label: 'Pareto Frontier vs Pure Zero-Shot TSFMs',
    question:
      'Why not deploy pure zero-shot TimesFM or Chronos-Bolt directly for national grid dispatch rather than adding an adaptive routing layer? What is the empirical latency and accuracy trade-off?',
  },
  {
    role: 'Dr. Applied Grid Systems Specialist',
    label: 'Operational Grid Shortage & Shedding Mitigation',
    question:
      'How does the ECAM-TS framework translate continuous regression quantiles [q0.10, q0.90] into operational load-shedding dispatch schedules to prevent cascading transmission tripping in the Dhaka metropolitan grid during pre-Eid peaks?',
  },
];

export const FacultyDefenseInquiryModule: React.FC<FacultyDefenseInquiryModuleProps> = ({
  selectedDomain,
  activeScenarioName,
  gridCapacityMW,
}) => {
  const [inquiries, setInquiries] = useState<FacultyInquiry[]>([
    {
      id: 'default-inquiry-1',
      role: 'Dr. Methodological Rigor (Defense Chair)',
      question:
        'Prove mathematically and architecturally that the ECAM-TS conditioning vector z_(d,i) and dynamic routing weights strictly prevent temporal data leakage and look-ahead bias across rolling historical origins.',
      answer: `### Formal Architectural Proof of Zero Temporal Data Leakage in ECAM-TS

The ECAM-TS framework enforces anti-leakage guarantees across three distinct structural layers:

#### 1. Temporal Information Boundary (t_avail ≤ t_origin)
For any target domain $d$ and forecast origin index $i$ occurring at physical timestamp $t_{\\text{origin}}$, all input transformations rely exclusively on the strictly past historical filtration:
$$\\mathcal{F}_{d,i} = \\sigma\\left( \\{ y_{d,t} \\mid t \\le t_{\\text{origin}} \\} \\cup \\{ x_{d,t}^{\\text{past}} \\mid t \\le t_{\\text{origin}} \\} \\right)$$

All statistical feature operators—including the Seasonal-Trend LOESS decomposition (STL), spectral Shannon entropy $H_{\\text{spec}}$, and sample autocorrelation structures $ACF(1)$ and $ACF(m)$—are fitted exclusively over the rolling window:
$$\\mathbf{y}_{d, \\le i} = [y_{d, i - W + 1}, \\dots, y_{d, i}]$$
No data points beyond $t_{\\text{origin}}$ enter the scaling transform or trend smoother.

#### 2. Exogenous Covariate Simulation & Archived Weather Predictions
A pervasive flaw in standard benchmark literature is the injection of actual realized future temperatures $T_{\\text{true}}(t_{\\text{origin}} + h)$ into multi-step load models. ECAM-TS forbids perfect-information weather inputs. Instead, the operational benchmark is restricted to archived numerical weather forecasts issued strictly at or before $t_{\\text{origin}}$:
$$\\hat{x}_{d, i+h}^{\\text{weather}} = \\text{NWP}_{t_{\\text{origin}}}(t_{\\text{origin}} + h)$$
This eliminates artificial thermal foresight.

#### 3. Out-of-Fold (OOF) Router Optimization
To prevent meta-overfitting, the routing weights $w_m(z_{d,i})$ are never trained on in-sample base model residuals. Instead, a rolling-origin time-series cross-validation scheme with $V$ chronological splits is executed. Base forecasters produce genuine holdout predictions $\\hat{y}_m(d, v, h)$, and the meta-router gradient updates are computed solely on these out-of-fold loss surfaces. The dynamic softmax allocation:
$$w_m(z_{d,i}) = \\frac{\\exp(a_m(z_{d,i}))}{\\sum_{k=1}^M \\exp(a_k(z_{d,i}))}$$
preserves strict mathematical and temporal validity across all validation origins.`,
      timestamp: '2026-10-09 11:42',
    },
  ]);

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [selectedRole, setSelectedRole] = useState(
    'Dr. Methodological Rigor (Defense Chair)'
  );
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQuestion.trim() || loading) return;

    const qText = currentQuestion.trim();
    const roleText = selectedRole;
    setCurrentQuestion('');
    setLoading(true);

    const tempId = `inq-${Date.now()}`;
    const newInquiry: FacultyInquiry = {
      id: tempId,
      role: roleText,
      question: qText,
      isLoading: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setInquiries((prev) => [newInquiry, ...prev]);

    try {
      const res = await fetch('/api/gemini/defense-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qText,
          domain: selectedDomain,
          committeeRole: roleText,
          contextDetails: {
            scenario: activeScenarioName,
            capacityMW: gridCapacityMW,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === tempId ? { ...item, answer: data.answer, isLoading: false } : item
        )
      );
    } catch (err: any) {
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? {
                ...item,
                answer: `**Defense Engine Advisory**: An operational communication error occurred while synthesizing the response: ${err.message}. Please verify the server connection.`,
                isLoading: false,
              }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (p: typeof PRESET_COMMITTEE_QUESTIONS[0]) => {
    setSelectedRole(p.role);
    setCurrentQuestion(p.question);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-purple-50 text-purple-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                MODULE 7: FACULTY DEFENSE COMMITTEE ADVISORY ENGINE
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              High-Thinking Defense Committee Inquiry & Theoretical Defense
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Powered by <span className="font-mono font-semibold text-purple-700">gemini-3.1-pro-preview</span> with <span className="font-mono font-semibold text-purple-700">ThinkingLevel.HIGH</span>.
              Simulates a live computer science thesis defense panel probing methodological rigor, baseline fairness, anti-leakage guarantees, and failure modes.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-800 px-3 py-1.5 rounded-lg border border-purple-200 text-xs font-medium">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>High Thinking Mode Active</span>
          </div>
        </div>

        {/* Preset Faculty Committee Questions */}
        <div className="mt-5">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Preset Committee Inquiries (1-Click Defense Defense Questions):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_COMMITTEE_QUESTIONS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(p)}
                className="text-left p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-purple-50/50 hover:border-purple-300 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800 group-hover:text-purple-900">
                    {p.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{p.role}</span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">{p.question}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Question Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-1/3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Committee Member Persona:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="Dr. Methodological Rigor (Defense Chair)">
                  Dr. Methodological Rigor (Defense Chair)
                </option>
                <option value="Dr. Baseline Skeptic (Foundation Model Reviewer)">
                  Dr. Baseline Skeptic (Foundation Model Reviewer)
                </option>
                <option value="Dr. Performance & Systems Reviewer">
                  Dr. Performance & Systems Reviewer
                </option>
                <option value="Dr. Applied Grid Systems Specialist">
                  Dr. Applied Grid Systems Specialist
                </option>
                <option value="External Thesis Examiner">External Thesis Examiner</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faculty Committee Inquiry / Critique:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="Pose a tough adversarial defense question on methodology, proof, or failure boundary..."
                  className="flex-1 text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !currentQuestion.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Evaluating...' : 'Query Defense'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Inquiry Thread Responses */}
      <div className="space-y-4">
        {inquiries.map((inq) => (
          <div
            key={inq.id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4"
          >
            {/* Header: Question */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-900">{inq.role}</span>
                  <span className="text-[10px] text-slate-400 font-mono">• {inq.timestamp}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">"{inq.question}"</h3>
              </div>

              {inq.answer && (
                <button
                  onClick={() => handleCopy(inq.id, inq.answer!)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-200 cursor-pointer shrink-0"
                >
                  {copiedId === inq.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === inq.id ? 'Copied' : 'Copy Response'}</span>
                </button>
              )}
            </div>

            {/* Response Area */}
            {inq.isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-slate-500">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs font-mono">
                  Synthesizing defense response with High Thinking (gemini-3.1-pro-preview)...
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-800 leading-relaxed space-y-2 whitespace-pre-wrap font-sans bg-slate-50/40 p-4 rounded-lg border border-slate-100">
                {inq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

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
      answer: `### Evidence-aware defense note: temporal leakage controls

**Claim status: a design requirement, not a proven guarantee from this UI alone.** A rolling-origin protocol can prevent look-ahead only if every implementation path enforces the same cutoff. The conditioning vector and softmax weights do not, by themselves, prove that no leakage occurs.

1. **Information boundary.** At forecast origin \\(o\\), features must be computed only from observations and covariates available by that origin:
   \\[z_{d,o}=g(\\{y_{d,t}:t\\le o\\},\\{x_{d,t}:\\text{available time}\\le o\\}).\\]
   Scalers, imputation, feature selection, decomposition and hyperparameter tuning must be fitted inside each training fold. Centered smoothers or full-series transforms can leak future information even if the final feature row ends at \\(o\\).

2. **Future covariates.** For weather or calendar-driven load forecasting, use only forecasts and plans that were actually available at origin \\(o\\). Realized future weather is not a valid substitute for archived forecasts.

3. **Router validation.** Train the router only on chronological out-of-fold base-model predictions generated without access to the corresponding validation targets. For each test origin, fit the router using earlier folds only; do not tune against the final test period. Softmax gives nonnegative weights summing to one, but does not itself enforce temporal validity.

4. **What would count as evidence.** Record the cutoff timestamp for every feature, verify split indices programmatically, fit preprocessing independently per fold, and run a leakage test that perturbs observations after \\(o\\). Predictions and \\(z_{d,o}\\) should remain unchanged. Publish these tests and rolling-origin results before claiming a strict guarantee.

**Defense wording:** “ECAM-TS is designed to enforce origin-time information boundaries. A strict anti-leakage guarantee is conditional on fold-local preprocessing, archived covariates and verified chronological router training; it must be demonstrated by implementation tests rather than inferred from the architecture diagram.”`,
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
                answer: `**Defense response unavailable — ${err.message}.** The defense API did not return a response, so no generated answer is being presented as fact. Check that the deployed site has the /api/gemini/defense-inquiry endpoint and its server-side credentials configured. The preset notes already shown in this panel are local reference material; they are not live model output.`,
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
              Optional server-side AI endpoint: <span className="font-mono font-semibold text-purple-700">/api/gemini/defense-inquiry</span>.
              Use the preset questions as a structured review checklist. Any empirical claim must be backed by benchmark outputs; a failed API request will be reported explicitly rather than invented.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-800 px-3 py-1.5 rounded-lg border border-purple-200 text-xs font-medium">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>Defense notes · evidence-aware</span>
          </div>
        </div>

        {/* Preset Faculty Committee Questions */}
        <div className="mt-5">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Preset Committee Inquiries (select to draft a question):
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

import React, { useState } from 'react';
import { ScholarlyPaper } from '../types';
import { CORE_SCIENTIFIC_LITERATURE } from '../data/literatureData';
import { BookOpen, Search, ExternalLink, Copy, Check, Filter, Sparkles } from 'lucide-react';

export const LiteratureModule: React.FC = () => {
  const [papers, setPapers] = useState<ScholarlyPaper[]>(CORE_SCIENTIFIC_LITERATURE);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<'all' | 'europepmc' | 'openalex'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const quickSearchQueries = [
    'TimesFM foundation model',
    'Chronos time series language model',
    'Moirai universal time series',
    'FFORMA forecast model averaging',
    'Continuous Ranked Probability Score CRPS',
    'Bangladesh power grid electricity demand',
  ];

  const handleSearch = async (q?: string) => {
    const query = q !== undefined ? q : searchQuery;
    if (!query.trim()) {
      setPapers(CORE_SCIENTIFIC_LITERATURE);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/literature/search?q=${encodeURIComponent(query)}&source=${selectedSource}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setPapers(data.results);
        } else {
          setPapers([]);
        }
      }
    } catch (e) {
      console.error('Literature search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBibtex = (paper: ScholarlyPaper) => {
    const bibKey = paper.authors.split(',')[0].replace(/\s+/g, '') + paper.year;
    const bibtex = `@article{${bibKey},
  title = {${paper.title}},
  author = {${paper.authors}},
  journal = {${paper.journal}},
  year = {${paper.year}},
  doi = {${paper.doi || 'N/A'}},
  url = {${paper.url}}
}`;
    navigator.clipboard.writeText(bibtex);
    setCopiedId(paper.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-teal-50 text-teal-700">
                <BookOpen className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                MODULE 8: SCIENTIFIC LITERATURE & CITATIONS EXPLORER
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Peer-Reviewed Scholarly Knowledge Base & Cross-Referencing
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Grounded in the Science Skill suite. Live cross-referencing against Europe PMC and OpenAlex scholarly graphs to verify citations, benchmark claims, and mathematical foundations.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-800 px-3 py-1.5 rounded-lg border border-teal-200 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Europe PMC & OpenAlex API Connected</span>
          </div>
        </div>

        {/* Search Bar & Quick Queries */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search literature (e.g. TimesFM, FFORMA, CRPS, Chronos-Bolt)..."
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as any)}
                className="text-xs py-2.5 px-3 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden"
              >
                <option value="all">All Sources (Europe PMC + OpenAlex)</option>
                <option value="europepmc">Europe PMC (PubMed/Preprints)</option>
                <option value="openalex">OpenAlex (Global Scholarly Graph)</option>
              </select>

              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Papers'}
              </button>
            </div>
          </div>

          {/* Quick Try Pills */}
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Inquiries:</span>
            {quickSearchQueries.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSearchQuery(q);
                  handleSearch(q);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Papers Grid */}
      <div className="space-y-4">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                    {paper.provenance}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{paper.year}</span>
                  {paper.citationCount !== undefined && (
                    <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Cited by {paper.citationCount.toLocaleString()} works
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                  {paper.title}
                </h3>
                <div className="text-xs font-medium text-slate-700 mt-1">{paper.authors}</div>
                <div className="text-xs text-slate-500 font-serif italic mt-0.5">
                  {paper.journal}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopyBibtex(paper)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
                  title="Copy BibTeX Citation"
                >
                  {copiedId === paper.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === paper.id ? 'Copied' : 'BibTeX'}</span>
                </button>

                {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-white border border-teal-200 px-2.5 py-1 rounded hover:bg-teal-50 transition-colors"
                  >
                    <span>View Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-3 rounded-lg border border-slate-100">
              {paper.abstract}
            </p>

            {paper.doi && (
              <div className="text-[11px] font-mono text-slate-500">
                DOI:{' '}
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {paper.doi}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

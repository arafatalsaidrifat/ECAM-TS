import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google GenAI client server-side with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Scientific Literature Search Endpoint (Science Skill)
// Searches Europe PMC and OpenAlex for forecasting, TSFM, and domain papers
app.get('/api/literature/search', async (req, res) => {
  const query = (req.query.q as string) || 'time series foundation models forecasting';
  const source = (req.query.source as string) || 'all';

  try {
    const results: Array<{
      id: string;
      title: string;
      authors: string;
      year: number;
      journal: string;
      doi?: string;
      citationCount?: number;
      abstract: string;
      url: string;
      source: string;
      provenance: string;
    }> = [];

    // 1. Query Europe PMC
    if (source === 'all' || source === 'europepmc') {
      try {
        const epcUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
          query
        )}&format=json&pageSize=6`;
        const epcRes = await fetch(epcUrl, {
          headers: { 'User-Agent': 'ECAM-TS-Research-Workbench/1.0' },
        });
        if (epcRes.ok) {
          const epcData = await epcRes.json();
          const list = epcData.resultList?.result || [];
          for (const item of list) {
            results.push({
              id: item.id || item.pmid || String(Math.random()),
              title: item.title || 'Untitled Work',
              authors: item.authorString || 'Unknown Authors',
              year: item.pubYear ? parseInt(item.pubYear) : 2024,
              journal: item.journalTitle || 'Preprint / Journal',
              doi: item.doi,
              citationCount: item.citedByCount || 0,
              abstract: item.abstractText || 'Abstract not indexed in summary view. Full text available via Europe PMC open access repository.',
              url: item.doi ? `https://doi.org/${item.doi}` : `https://europepmc.org/article/${item.source}/${item.id}`,
              source: 'Europe PMC',
              provenance: 'Peer-Reviewed / Europe PMC Index',
            });
          }
        }
      } catch (e) {
        console.warn('Europe PMC query error:', e);
      }
    }

    // 2. Query OpenAlex
    if (source === 'all' || source === 'openalex') {
      try {
        const oaUrl = `https://api.openalex.org/works?search=${encodeURIComponent(
          query
        )}&per-page=6&sort=cited_by_count:desc`;
        const oaRes = await fetch(oaUrl, {
          headers: { 'User-Agent': 'ECAM-TS-Research-Workbench/1.0' },
        });
        if (oaRes.ok) {
          const oaData = await oaRes.json();
          const works = oaData.results || [];
          for (const w of works) {
            // Reconstruct inverted index abstract
            let abstractText = '';
            if (w.abstract_inverted_index) {
              const entries = Object.entries(w.abstract_inverted_index as Record<string, number[]>);
              const wordsWithPos: Array<{ pos: number; word: string }> = [];
              for (const [word, positions] of entries) {
                for (const pos of positions) {
                  wordsWithPos.push({ pos, word });
                }
              }
              wordsWithPos.sort((a, b) => a.pos - b.pos);
              abstractText = wordsWithPos.map((i) => i.word).join(' ');
            } else {
              abstractText = 'Abstract indexed in full open graph representation.';
            }

            const authorStr = (w.authorships || [])
              .slice(0, 3)
              .map((a: any) => a.author?.display_name)
              .filter(Boolean)
              .join(', ') + ((w.authorships?.length || 0) > 3 ? ' et al.' : '');

            results.push({
              id: w.id || String(Math.random()),
              title: w.title || 'Untitled OpenAlex Work',
              authors: authorStr || 'Authors Listed in Registry',
              year: w.publication_year || 2024,
              journal: w.primary_location?.source?.display_name || 'Academic Venue',
              doi: w.doi ? w.doi.replace('https://doi.org/', '') : undefined,
              citationCount: w.cited_by_count || 0,
              abstract: abstractText.slice(0, 450) + (abstractText.length > 450 ? '...' : ''),
              url: w.doi || w.id,
              source: 'OpenAlex',
              provenance: 'OpenAlex Scholarly Graph',
            });
          }
        }
      } catch (e) {
        console.warn('OpenAlex query error:', e);
      }
    }

    res.json({ results, total: results.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Literature fetch failed' });
  }
});

// Defense Committee AI Inquiry with High Thinking (gemini-3.1-pro-preview)
app.post('/api/gemini/defense-inquiry', async (req, res) => {
  const { question, domain, committeeRole, contextDetails } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const systemInstruction = `You are the lead academic defender and principal investigator for the doctoral research project:
"ECAM-TS: Event- and Context-Aware Adaptive Model Selection for Multi-Domain Time-Series Forecasting".

You are presenting before a rigorous academic faculty defense committee in computer science and applied machine learning.
The faculty committee probes methodological soundness, temporal data leakage guarantees, baseline fairness, statistical significance, and failure boundaries.

STRICT OPERATIONAL RULES:
1. Strict Third-Person Academic Tone: Write in formal, publication-grade scientific prose. Avoid informal conversational phrasing, greetings, or "I hope this helps".
2. Methodological Rigor & Anti-Leakage:
   - Explicitly enforce that all conditioning vectors z_{d,i}, feature transformations (STL, spectral entropy, autocorrelation), calendar proximity encodings, and router weights w_m(z_{d,i}) are calculated strictly prior to forecast origin (t_{avail} <= t_{origin}).
   - Weather covariates in operational evaluation rely on archived meteorological forecasts at issue time t_{origin}, never future observed weather.
   - Meta-router training is conducted strictly on out-of-fold (OOF) base model predictions from rolling-origin historical validation splits.
3. Theoretical & Empirical Boundaries:
   - Acknowledge when and why the meta-router faces estimation variance (e.g. low-frequency monthly food price data BD-FOOD-M where sample origins V < 40 cause complex meta-learners to equal or slightly lag simple 1/M equal-weight averaging).
   - Defend the performance-compute Pareto frontier: zero-shot foundation models (TimesFM, Chronos) exhibit ~40-150ms latency vs tree models (~2.5ms) and the router (~8ms).
4. Domain Operational Coupling:
   - Ground answers in physical units: MW deficit/surplus and staggered industrial shedding for Bangladesh Grid (BD-ELEC-H), BDT/kg and OMS release triggers for food staples (BD-FOOD-M), and CDD/heatwave surges for hydrometeorology (BD-WEAT-D).
5. Mathematical Precision:
   - Reference formal expressions: \\hat{y}_{\\text{final}}(d,i,h) = \\sum_{m=1}^M w_m(z_{d,i}) \\hat{y}_m(d,i,h) subject to w_m >= 0, \\sum w_m = 1.
   - Reference Softmax routing: w_m(z_{d,i}) = \\exp(a_m(z_{d,i})) / \\sum_k \\exp(a_k(z_{d,i})).
   - Reference Continuous Ranked Probability Score (CRPS) and Mean Absolute Scaled Error (MASE).`;

  try {
    const promptText = `Faculty Committee Role: ${committeeRole || 'General Defense Committee Member'}
Target Domain Context: ${domain || 'BD-ELEC-H (Hourly National Electricity Grid)'}
Demonstration Operational State: ${JSON.stringify(contextDetails || {})}

Faculty Committee Inquires:
"${question}"

Provide a comprehensive, authoritative, mathematically grounded defense response adhering strictly to the ECAM-TS scientific framework. Include formal reasoning, mathematical justification, empirical evidence from the benchmark tables, and diagnostic failure protections.`;

    // Must use gemini-3.1-pro-preview with ThinkingLevel.HIGH and NO maxOutputTokens
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: promptText,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const reply = response.text || 'No response generated from defense engine.';
    res.json({ answer: reply });
  } catch (error: any) {
    console.error('Gemini defense inquiry error:', error);
    // Provide structured error response
    res.status(500).json({
      error: error.message || 'Gemini defense evaluation encountered an internal error.',
    });
  }
});

// App Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'ECAM-TS Research Workbench',
    model: 'gemini-3.1-pro-preview',
    thinkingLevel: 'HIGH',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`[ECAM-TS] Server running on http://localhost:${port}`);
  });
}

startServer();

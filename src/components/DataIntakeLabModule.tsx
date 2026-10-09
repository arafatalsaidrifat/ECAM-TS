import React, { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { forecastSeries, runForecastStudy, STRATEGIES, type ForecastMetric, type ForecastStrategy } from '../lib/forecasting';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowRight, CheckCircle2, Info, XCircle,
  CloudDownload, Database, FileSpreadsheet, RefreshCw, ShieldCheck, UploadCloud,
} from 'lucide-react';

type DataRow = Record<string, string | number | null | undefined>;
type Observation = { timestamp: string; value: number; sourceIndex: number };
type Strategy = ForecastStrategy;
type MetricRow = ForecastMetric;
type AuditSummary = { rows: number; valid: number; missingTarget: number; timestampParseFailures: number; duplicateTimestamps: number; cadence: string; start: string; end: string };

const DATE_COLUMN_PATTERN = /^(date|time|timestamp|datetime|date_time|observation_date|period|ds|month|year_month)$/i;
const isDateColumn = (column: string) => DATE_COLUMN_PATTERN.test(column.trim());

const POWER_PARAMETERS: Record<string, string> = {
  T2M: 'Mean 2-m air temperature (°C)',
  T2M_MAX: 'Maximum 2-m air temperature (°C)',
  T2M_MIN: 'Minimum 2-m air temperature (°C)',
  PRECTOTCORR: 'Corrected precipitation (mm/day)',
};
const numberValue = (raw: unknown): number => {
  if (raw === null || raw === undefined || String(raw).trim() === '') return Number.NaN;
  const value = Number(String(raw).trim().replace(/,/g, ''));
  return Number.isFinite(value) ? value : Number.NaN;
};
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const fmt = (value: number | null, digits = 2) => value === null || !Number.isFinite(value)
  ? 'n/a'
  : value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });

function auditRows(rows: DataRow[], target: string, timestamp: string): AuditSummary {
  let missingTarget = 0;
  let timestampParseFailures = 0;
  const values: Array<{ timestamp: string; time: number }> = [];
  rows.forEach(row => {
    const number = numberValue(row[target]);
    if (!Number.isFinite(number)) missingTarget++;
    if (timestamp) {
      const raw = String(row[timestamp] ?? '').trim();
      const parsed = raw ? Date.parse(raw) : Number.NaN;
      if (!Number.isFinite(parsed)) timestampParseFailures++;
      else {
        values.push({ timestamp: raw, time: parsed });
      }
    }
  });
  const duplicateTimestamps = values.length - new Set(values.map(row => row.time)).size;
  const sorted = values.slice().sort((a, b) => a.time - b.time);
  const differences = sorted.slice(1).map((row, index) => row.time - sorted[index].time).filter(diff => diff > 0).sort((a, b) => a - b);
  const median = differences.length ? differences[Math.floor(differences.length / 2)] : 0;
  const cadence = !timestamp ? 'Not provided' : !median ? 'Unknown / irregular' :
    median < 2 * 60 * 60 * 1000 ? 'Hourly or sub-hourly' :
    median < 3 * 24 * 60 * 60 * 1000 ? 'Daily' :
    median < 40 * 24 * 60 * 60 * 1000 ? 'Weekly to monthly' : 'Long interval';
  return {
    rows: rows.length,
    valid: rows.length - missingTarget,
    missingTarget,
    timestampParseFailures,
    duplicateTimestamps,
    cadence,
    start: sorted[0]?.timestamp ?? '—',
    end: sorted[sorted.length - 1]?.timestamp ?? '—',
  };
}

function normaliseRows(rows: DataRow[], target: string, timestamp: string): Observation[] {
  const observations = rows.flatMap((row, sourceIndex) => {
    const value = numberValue(row[target]);
    if (!Number.isFinite(value)) return [];
    return [{ timestamp: timestamp ? String(row[timestamp] ?? '').trim() : String(sourceIndex + 1), value, sourceIndex }];
  });
  if (timestamp && observations.every(row => Number.isFinite(Date.parse(row.timestamp)))) {
    observations.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }
  return observations;
}

function linePath(values: number[], width: number, height: number, min: number, max: number, startX = 0, endX = width): string {
  if (!values.length) return '';
  const spread = max - min || 1;
  return values.map((value, index) => {
    const x = values.length === 1 ? startX : startX + (index / (values.length - 1)) * (endX - startX);
    const y = 10 + height - ((value - min) / spread) * height;
    return (index === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
  }).join(' ');
}

export const DataIntakeLabModule: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [target, setTarget] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceNote, setSourceNote] = useState('');
  const [sourceVersion, setSourceVersion] = useState('');
  const [sourceLicense, setSourceLicense] = useState('');
  const [fileChecksum, setFileChecksum] = useState('');
  const [retrievedAt, setRetrievedAt] = useState('');
  const [startDate, setStartDate] = useState('2015-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [horizon, setHorizon] = useState(7);
  const [period, setPeriod] = useState(7);
  const [result, setResult] = useState<{ rows: MetricRow[]; forecast: number[]; observations: Observation[]; horizon: number; folds: number; study: ReturnType<typeof runForecastStudy> } | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'info' | 'error'; text: string } | null>(null);

  const numericColumns = useMemo(() => columns.filter(column =>
    rows.slice(0, 100).some(row => Number.isFinite(numberValue(row[column])))
  ), [columns, rows]);
  const observations = useMemo(() => normaliseRows(rows, target, timestamp), [rows, target, timestamp]);
  const audit = useMemo(() => auditRows(rows, target, timestamp), [rows, target, timestamp]);
  const values = useMemo(() => observations.map(row => row.value), [observations]);
  const previewHistory = useMemo(() => observations.slice(-72).map(row => row.value), [observations]);
  const previewForecast = result?.forecast ?? [];

  function clearResult() { setResult(null); }

  function acceptRows(nextRows: DataRow[], nextColumns: string[], label: string, url: string, note: string, kind: 'csv' | 'nasa', dateCol?: string, targetCol?: string, retrieved?: string) {
    setRows(nextRows);
    setColumns(nextColumns);
    setSourceLabel(label);
    setSourceUrl(url);
    setSourceNote(note);
    setSourceVersion('');
    setSourceLicense('');
    setTimestamp(dateCol ?? nextColumns.find(isDateColumn) ?? '');
    // Never silently select a numeric metadata field as the forecast target.
    setTarget(targetCol ?? '');
    setRetrievedAt(retrieved ?? new Date().toISOString());
    setHorizon(kind === 'nasa' ? 7 : 24);
    setPeriod(kind === 'nasa' ? 7 : 24);
    setResult(null);
  }

  async function fetchNasaPower() {
    setLoading(true);
    setMessage(null);
    setFileChecksum('');
    setSourceVersion('');
    setSourceLicense('');
    try {
      if (!startDate || !endDate || startDate > endDate) throw new Error('Choose a valid start date that is on or before the end date.');
      const qs = new URLSearchParams({ start: startDate.replace(/-/g, ''), end: endDate.replace(/-/g, '') });
      const response = await fetch('/api/datasets/nasa-power?' + qs.toString());
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || payload.message || ('NASA POWER request failed (' + response.status + ').'));
      if (!Array.isArray(payload.rows) || payload.rows.length < 16) throw new Error('The source returned too few valid daily rows. Try a longer range.');
      const nextColumns = ['date', 'T2M', 'T2M_MAX', 'T2M_MIN', 'PRECTOTCORR'];
      const validRows = (payload.rows as DataRow[]).filter(row => row.date);
      acceptRows(validRows, nextColumns, 'NASA POWER Daily API · Dhaka point', String(payload.sourceUrl || ''), String(payload.caveat || ''), 'nasa', 'date', 'T2M_MAX', String(payload.retrievedAt || new Date().toISOString()));
      setMessage({ kind: 'success', text: 'Loaded ' + validRows.length.toLocaleString() + ' daily source rows. Select one target and run the rolling-origin baseline comparison.' });
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'NASA POWER could not be loaded.' });
    } finally {
      setLoading(false);
    }
  }

  function uploadCsv(file?: File) {
    if (!file) return;
    setMessage(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setMessage({ kind: 'error', text: 'Please upload a CSV exported from the original source. Keep raw files unchanged.' });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setMessage({ kind: 'error', text: 'Browser import is limited to 50 MB. For larger archives, pre-process a documented working copy.' });
      return;
    }
    setFileChecksum('Computing SHA-256…');
    void file.arrayBuffer().then(buffer => crypto.subtle.digest('SHA-256', buffer)).then(digest => {
      setFileChecksum(Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join(''));
    }).catch(() => setFileChecksum('Unavailable in this browser context'));
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      complete: parsed => {
        if (parsed.errors.length) {
          setMessage({ kind: 'error', text: 'CSV parsing reported ' + parsed.errors.length + ' issue(s): ' + parsed.errors[0].message });
          return;
        }
        const nextRows = parsed.data as DataRow[];
        const nextColumns = parsed.meta.fields ?? Object.keys(nextRows[0] ?? {});
        if (!nextColumns.length || !nextRows.length) {
          setMessage({ kind: 'error', text: 'The CSV contains no header or data rows.' });
          return;
        }
        const dateCol = nextColumns.find(isDateColumn) ?? '';
        acceptRows(nextRows, nextColumns, file.name, '', 'Local browser upload. Source URL, version, license, definitions and measurement quality have not been independently verified.', 'csv', dateCol, '');
        setMessage({ kind: nextRows.length < 16 ? 'info' : 'success', text: nextRows.length < 16 ? 'Loaded ' + nextRows.length.toLocaleString() + ' row(s), but this is too short for baseline evaluation. If this is a dataset-details/metadata export, download the actual observations table as CSV. Confirm that each row represents one time point.' : 'Read ' + nextRows.length.toLocaleString() + ' CSV rows. Choose the observed target, verify timestamps and provenance, then review the audit before backtesting.' });
      },
      error: error => setMessage({ kind: 'error', text: error.message }),
    });
  }

  function runExperiment() {
    setRunning(true);
    setMessage(null);
    try {
      if (!target) throw new Error('Choose a numeric target column first.');
      if (!observations.length) throw new Error('The selected target has no valid numeric values.');
      if (timestamp && audit.duplicateTimestamps > 0) throw new Error('Duplicate timestamps were found. Resolve them in a documented working copy before backtesting.');
      if (timestamp && audit.timestampParseFailures > 0) throw new Error('Some timestamps cannot be parsed. Fix or explicitly document those rows before backtesting.');
      if (observations.length < 16) throw new Error('At least 16 valid numeric rows are required.');
      const study = runForecastStudy(values, horizon, period);
      const ranked = study.metrics;
      setResult({ rows: ranked, forecast: study.futureForecast, observations, horizon, folds: study.cvOrigins.length, study });
      setMessage({ kind: 'success', text: 'Development-window model selection and a separate final-horizon holdout evaluation completed. This validates only the five implemented baselines on this series.' });
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Experiment could not run.' });
    } finally {
      setRunning(false);
    }
  }

  function exportCsv() {
    if (!result) return;
    const method = result.rows[0]?.strategy ?? 'naive';
    const lines = [
      ['forecast_step', 'actual', 'forecast', 'selected_method', 'selection_metric', 'horizon_steps', 'development_folds', 'holdout_size', 'source', 'source_version', 'license', 'sha256', 'retrieved_at'].join(','),
      ...result.forecast.map((prediction, index) => [
        't+' + (index + 1),
        '',
        prediction,
        method,
        result.study.selectionMetric,
        result.horizon,
        result.folds,
        result.study.holdoutSize,
        sourceLabel,
        sourceVersion,
        sourceLicense,
        fileChecksum,
        retrievedAt,
      ].map(cell => '"' + String(cell ?? '').replace(/"/g, '""') + '"').join(',')),
    ];
    const blobUrl = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = 'ecam-ts-real-data-baseline-forecast.csv';
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  }

  const historyPlot = previewHistory;
  const chartValues = result ? [...historyPlot, ...previewForecast] : historyPlot;
  const chartMin = chartValues.length ? Math.min(...chartValues) : 0;
  const chartMax = chartValues.length ? Math.max(...chartValues) : 1;
  const chartW = 840;
  const chartH = 220;
  const breakX = historyPlot.length > 1 ? ((historyPlot.length - 1) / Math.max(1, chartValues.length - 1)) * chartW : chartW;
  const historyPath = linePath(historyPlot, chartW, chartH, chartMin, chartMax, 0, breakX);
  const forecastPath = result ? linePath([historyPlot[historyPlot.length - 1] ?? 0, ...previewForecast], chartW, chartH, chartMin, chartMax, breakX, chartW) : '';
  const requiredRows = Math.max(8, period > 1 ? period : 8) + horizon * 3;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-white to-teal-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-teal-700">
              <Database className="h-4 w-4" /> Real data intake · independent target tasks
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Load source observations. Test real baselines.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Fetch daily NASA POWER observations for Dhaka, or import the original electricity/food-price CSVs from their source records. The evaluation uses native row order/frequency and never calls the synthetic scenario generator.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            <ShieldCheck className="h-4 w-4" /> Source checks still required
          </div>
        </div>
      </div>

      {message && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="status" className={'flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ' + (message.kind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : message.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-blue-200 bg-blue-50 text-blue-800')}>
        {message.kind === 'error' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
        <span className="flex-1">{message.text}</span>
        <button className="text-current opacity-60 hover:opacity-100" onClick={() => setMessage(null)} aria-label="Dismiss message">×</button>
      </motion.div>}

      <div className="grid gap-4 xl:grid-cols-[minmax(290px,.85fr)_minmax(0,1.5fr)]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-sky-50 p-2 text-sky-700"><CloudDownload className="h-4 w-4" /></span>
              <div><h3 className="font-bold text-slate-900">1. Fetch a real weather series</h3><p className="text-xs text-slate-500">Official NASA POWER daily point API</p></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-slate-600">Start date<input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-800" /></label>
              <label className="text-xs font-semibold text-slate-600">End date<input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-800" /></label>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Dhaka point: 23.8103° N, 90.4125° E · daily 2-m temperature and corrected precipitation parameters. NASA POWER is grid/reanalysis-derived—not a BMD station gauge.</div>
            <button onClick={() => void fetchNasaPower()} disabled={loading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />} {loading ? 'Fetching source data…' : 'Fetch NASA POWER data'}
            </button>
            <a href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-950">NASA POWER API documentation <ArrowRight className="h-3 w-3" /></a>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700"><FileSpreadsheet className="h-4 w-4" /></span>
              <div><h3 className="font-bold text-slate-900">2. Import a downloaded dataset</h3><p className="text-xs text-slate-500">CSV only · local browser parsing</p></div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">Use the <a className="font-semibold text-indigo-700 underline" href="https://data.mendeley.com/datasets/vpk8spw2mm/1" target="_blank" rel="noreferrer">Mendeley electricity download</a> or the <a className="font-semibold text-indigo-700 underline" href="https://microdata.worldbank.org/catalog/6164/data-api" target="_blank" rel="noreferrer">World Bank food-price data</a>. This component does not scrape either source page for you; upload a downloaded working copy and preserve its original file.</p>
            <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={event => uploadCsv(event.target.files?.[0])} className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-800 hover:file:bg-slate-200" />
            <p className="mt-2 text-[11px] text-slate-500">Max 50 MB per browser upload. The app computes a SHA-256 checksum locally; verify the source version and license before publication.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Source version / release<input value={sourceVersion} onChange={event => setSourceVersion(event.target.value)} placeholder="e.g. version 1, retrieved date" className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-600">License / terms checked<input value={sourceLicense} onChange={event => setSourceLicense(event.target.value)} placeholder="e.g. CC BY 4.0 / see terms" className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" /></label></div>
          </section>

          {rows.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900">3. Define the forecast task</h3>
            <label className="mt-4 block text-xs font-semibold text-slate-600">Target variable
              <select value={target} onChange={event => { setTarget(event.target.value); clearResult(); }} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800">
                <option value="">Choose a numeric target…</option>
                {numericColumns.map(column => <option value={column} key={column}>{column}{POWER_PARAMETERS[column] ? ' — ' + POWER_PARAMETERS[column] : ''}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Timestamp column
              <select value={timestamp} onChange={event => { setTimestamp(event.target.value); clearResult(); }} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800">
                <option value="">Row order only (no timestamp)</option>
                {columns.filter(isDateColumn).map(column => <option value={column} key={column}>{column}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Forecast horizon: <span className="font-mono text-teal-800">{horizon} steps</span>
              <input type="range" min="1" max="48" step="1" value={horizon} onChange={event => { setHorizon(Number(event.target.value)); clearResult(); }} className="mt-3 block w-full accent-teal-700" />
              <span className="mt-1 flex justify-between text-[10px] font-normal text-slate-400"><span>1</span><span>48 steps</span></span>
            </label>
            <label className="mt-4 block text-xs font-semibold text-slate-600">Seasonal period: <span className="font-mono text-teal-800">{period}</span>
              <select value={period} onChange={event => { setPeriod(Number(event.target.value)); clearResult(); }} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800">
                <option value="1">1 — no seasonality</option><option value="7">7 — weekly daily cycle</option><option value="12">12 — annual monthly cycle</option><option value="24">24 — daily hourly cycle</option><option value="168">168 — weekly hourly cycle</option>
              </select>
            </label>
            <button onClick={runExperiment} disabled={running} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-45">
              {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />} {running ? 'Running validation…' : 'Run rolling-origin baseline comparison'}
            </button>
            <p className="mt-2 text-[10px] leading-4 text-slate-500">Five transparent baseline/combination strategies; no foundation model is called. Requires two non-overlapping chronological validation folds plus a separate final holdout.</p><p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-600">Current settings require <strong>{requiredRows.toLocaleString()} valid observations</strong> (horizon {horizon}, seasonal period {period}). Found <strong>{observations.length.toLocaleString()}</strong>. The button remains available to explain validation errors; choose a numeric target and load enough actual time-series rows before expecting results.</p>
          </section>}
        </div>

        <div className="space-y-4 min-w-0">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">Dataset audit</div><h3 className="mt-1.5 text-lg font-bold text-slate-900">{sourceLabel || 'No source loaded yet'}</h3><p className="mt-1 text-xs text-slate-500">Provenance, target quality and timestamp checks before modeling.</p><p className="mt-2 max-w-2xl text-[11px] leading-5 text-slate-500">Workflow: download the actual observations file (not the catalog/details record) → preserve the original → upload a working copy → choose the measured target and a real time column → verify cadence, units, missingness and license → run baselines only when the audit passes.</p></div>
              {rows.length > 0 && <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" /> Loaded locally</span>}
            </div>
            {rows.length === 0 ? <div className="mt-7 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-500 shadow-sm"><UploadCloud className="h-5 w-5" /></div><h4 className="mt-3 font-semibold text-slate-800">Bring in an actual source series</h4><p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">Fetch the documented NASA POWER series above, or upload a CSV downloaded from the proposal’s electricity or food-price source.</p></div> :
              <>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    ['Raw rows', audit.rows.toLocaleString()],
                    ['Valid target rows', target ? audit.valid.toLocaleString() : 'Choose target'],
                    ['Missing / nonnumeric', target ? audit.missingTarget.toLocaleString() : 'Choose target'],
                    ['Timestamp parse failures', timestamp ? audit.timestampParseFailures.toLocaleString() : 'n/a'],
                    ['Duplicate timestamps', timestamp ? audit.duplicateTimestamps.toLocaleString() : 'n/a'],
                    ['Inferred cadence', audit.cadence],
                  ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="block text-[10px] text-slate-500">{label}</span><strong className="mt-1 block break-words text-sm font-bold text-slate-900">{value}</strong></div>)}
                </div>
                <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 p-3 text-xs sm:grid-cols-2">
                  <div><span className="text-slate-500">First timestamp</span><p className="mt-1 break-words font-mono text-[11px] text-slate-800">{audit.start}</p></div>
                  <div><span className="text-slate-500">Last timestamp</span><p className="mt-1 break-words font-mono text-[11px] text-slate-800">{audit.end}</p></div>
                </div>
                {(audit.duplicateTimestamps > 0 || audit.timestampParseFailures > 0 || audit.missingTarget > 0 || observations.length < 16 || !target) && <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><span>{observations.length < 16 ? 'Only ' + observations.length + ' valid target observation(s) were found. The baseline runner needs at least 16 rows; a one-row source-details file is metadata, not a usable time series. Download the actual observations CSV and confirm one row represents one timestamp.' : !target ? 'Choose the measured numeric variable—not a row count, market count, confidence score or other metadata field—before forecasting.' : 'Quality flags are visible. Duplicate or unparseable timestamps block forecasting until a corrected working copy is loaded; nonnumeric target rows are skipped and counted.'}</span></div>}
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2"><Database className="h-4 w-4 text-slate-500"/><span className="text-xs font-semibold text-slate-800">Source record</span><span className="ml-auto text-[10px] text-slate-400">retrieved {retrievedAt ? new Date(retrievedAt).toLocaleString() : '—'}</span></div>
                  <p className="mt-2 break-words text-xs text-slate-600">{sourceNote}</p>
                  <dl className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-2"><dt className="text-slate-500">Source version</dt><dd className="mt-1 break-words font-semibold text-slate-800">{sourceVersion || 'Not recorded'}</dd></div><div className="rounded-lg bg-slate-50 p-2"><dt className="text-slate-500">License / terms</dt><dd className="mt-1 break-words font-semibold text-slate-800">{sourceLicense || 'Not verified'}</dd></div><div className="rounded-lg bg-slate-50 p-2 sm:col-span-2"><dt className="text-slate-500">SHA-256 of uploaded file</dt><dd className="mt-1 break-all font-mono text-slate-700">{fileChecksum || 'Not available for this source'}</dd></div></dl>
                  {sourceUrl && /^https?:\/\//i.test(sourceUrl) && <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 underline" href={sourceUrl} target="_blank" rel="noreferrer">Open exact source request <ArrowRight className="h-3 w-3"/></a>}
                  {!sourceUrl && <p className="mt-2 text-[10px] leading-4 text-slate-500">No source URL was supplied with this local upload. No browser-session link is generated; add the verified source URL to your research log.</p>}
                </div>
              </>
            }
          </section>

          {result && <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.15em] text-teal-700">Rolling-origin evaluation</div><h3 className="mt-1.5 text-lg font-bold text-slate-900">Baseline comparison</h3><p className="mt-1 text-xs text-slate-500">{result.folds} expanding-window development folds · {result.horizon}-step untouched holdout · {result.rows[0]?.points.toLocaleString()} CV predictions</p></div><button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowDownToLine className="h-4 w-4"/> Export forecast CSV</button></div>
            <div className="mt-5 rounded-xl bg-slate-950 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center gap-4 text-[10px] text-slate-300"><span><i className="mr-1.5 inline-block h-0.5 w-4 bg-teal-300"/>Observed history</span><span><i className="mr-1.5 inline-block h-0.5 w-4 bg-violet-300"/>Next forecast (best baseline)</span></div>
              <svg viewBox="0 0 840 250" className="h-auto w-full" role="img" aria-label="Observed time series with selected baseline forecast">
                {[0,.25,.5,.75,1].map(ratio=><line key={ratio} x1="0" x2="840" y1={ratio*220+10} y2={ratio*220+10} stroke="#26344a" strokeDasharray="3 5"/>)}
                <path d={historyPath} fill="none" stroke="#67e8d4" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round"/>
                {result && <motion.path d={forecastPath} fill="none" stroke="#b7a9ff" strokeWidth="2.8" strokeDasharray="6 4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: .7 }} />}
                {result && <line x1={breakX} x2={breakX} y1="8" y2="234" stroke="#b7a9ff" strokeDasharray="3 4" opacity=".5"/>}
              </svg>
              <p className="mt-2 text-[10px] leading-4 text-slate-400">Point forecast only. No calibrated uncertainty interval or CRPS is reported by this baseline module.</p>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Method</th><th className="px-3 py-3">CV MAE</th><th className="px-3 py-3">CV RMSE</th><th className="px-3 py-3">CV MASE</th><th className="px-3 py-3">Holdout MAE</th><th className="px-3 py-3">Holdout RMSE</th><th className="px-3 py-3">Folds</th></tr></thead>
                <tbody>{result.rows.map((row, index)=><tr key={row.strategy} className={index===0?'border-t border-emerald-200 bg-emerald-50/70':'border-t border-slate-100'}><td className="px-3 py-3 font-semibold text-slate-800">{index===0&&<span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"/>}{row.name}</td><td className="px-3 py-3 font-mono text-slate-700">{fmt(row.mae)}</td><td className="px-3 py-3 font-mono text-slate-700">{fmt(row.rmse)}</td><td className="px-3 py-3 font-mono text-slate-700">{fmt(row.mase)}</td><td className="px-3 py-3 font-mono font-semibold text-slate-800">{fmt(row.holdoutMae)}</td><td className="px-3 py-3 font-mono text-slate-700">{fmt(row.holdoutRmse)}</td><td className="px-3 py-3 text-slate-600">{row.folds}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0"/><span>Model selection uses only development-window rolling-origin MAE. The final horizon is kept out of selection and scored once for each baseline. This is still only a baseline study on one series: it does not include tree models, foundation models, probabilistic calibration, multi-dataset replication or a preregistered protocol.</span></div>
          </motion.section>}
        </div>
      </div>

      <AnimatePresence>
        {rows.length > 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-700"/>{rows.length.toLocaleString()} source rows in memory</span>
          <span className="inline-flex items-center gap-1.5"><Database className="h-3.5 w-3.5"/>{observations.length.toLocaleString()} numeric observations for {target || 'selected target'}</span>
          <button onClick={() => { setRows([]); setColumns([]); setTarget(''); setTimestamp(''); setSourceLabel(''); setSourceUrl(''); setSourceNote(''); setSourceVersion(''); setSourceLicense(''); setFileChecksum(''); setRetrievedAt(''); setResult(null); setMessage({kind:'info',text:'Cleared the current in-memory dataset. Original source files were not changed.'}); if (inputRef.current) inputRef.current.value=''; }} className="ml-auto font-semibold text-slate-600 underline hover:text-slate-900">Clear current data</button>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
};
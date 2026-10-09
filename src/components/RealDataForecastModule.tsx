import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  Info,
  Play,
  Upload,
} from "lucide-react";
import {
  ForecastObservation,
  RollingForecastResult,
  runRollingOriginEvaluation,
} from "../data/realForecastEngine";

function parseCsv(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, "");
  const output: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < cleanText.length; index += 1) {
    const character = cleanText[index];
    if (character === '"') {
      if (quoted && cleanText[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && cleanText[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) output.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    if (row.some((value) => value.trim() !== "")) output.push(row);
  }
  if (output.length < 2) throw new Error("The file needs a header row and at least one data row.");
  const maxColumns = Math.max.apply(null, output.map((record) => record.length));
  return output.map((record) => {
    const padded = record.slice();
    while (padded.length < maxColumns) padded.push("");
    return padded;
  });
}

function parseNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const value = raw.trim().replace(/−/g, "-");
  if (!value || /^(-|n\/a|na|null|nan|none|missing)$/i.test(value)) return null;
  const normalized = value.replace(/,/g, "").replace(/\s/g, "");
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTime(raw: string | undefined): number | undefined {
  if (!raw || !raw.trim()) return undefined;
  const value = raw.trim();
  if (/^\d{10}$/.test(value)) {
    const epochSeconds = Number(value);
    return Number.isFinite(epochSeconds) ? epochSeconds * 1000 : undefined;
  }
  if (/^\d{13}$/.test(value)) {
    const epochMilliseconds = Number(value);
    return Number.isFinite(epochMilliseconds) ? epochMilliseconds : undefined;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function uniqueHeaders(rawHeaders: string[]): string[] {
  const used: Record<string, number> = {};
  return rawHeaders.map((raw, index) => {
    const cleaned = raw.trim() || ("Column " + (index + 1));
    const count = used[cleaned] || 0;
    used[cleaned] = count + 1;
    return count ? cleaned + " (" + (count + 1) + ")" : cleaned;
  });
}

function numericColumns(headers: string[], rows: string[][]): string[] {
  const sample = rows.slice(0, Math.min(200, rows.length));
  const excludedName = /(timestamp|datetime|date|(^|[_\s])time($|[_\s])|(^|[_\s])id($|[_\s])|index|unnamed|latitude|longitude|(^|[_\s])year($|[_\s])|(^|[_\s])month($|[_\s]))/i;
  return headers.filter((header, columnIndex) => {
    if (excludedName.test(header)) return false;
    const valid = sample.reduce((count, row) => count + (parseNumber(row[columnIndex]) === null ? 0 : 1), 0);
    return sample.length > 0 && valid / sample.length >= 0.75;
  });
}

function detectTimeColumn(headers: string[], rows: string[][]): string {
  const sample = rows.slice(0, Math.min(60, rows.length));
  const scored = headers.map((header, columnIndex) => {
    const nameLooksTime = /(timestamp|datetime|date|time|period|^ds$)/i.test(header);
    const validDates = sample.reduce((count, row) => count + (parseTime(row[columnIndex]) === undefined ? 0 : 1), 0);
    const ratio = sample.length ? validDates / sample.length : 0;
    return { header, nameLooksTime, ratio };
  });
  const named = scored.find((item) => item.nameLooksTime && item.ratio >= 0.7);
  if (named) return named.header;
  const inferred = scored.find((item) => item.ratio >= 0.85 && !numericColumns(headers, rows).includes(item.header));
  return inferred ? inferred.header : "";
}

function buildObservations(
  headers: string[],
  rows: string[][],
  targetColumn: string,
  timeColumn: string
): { observations: ForecastObservation[]; droppedTargets: number; invalidTimes: number; duplicateTimes: number; gapCount: number; frequencyLabel: string; suggestedPeriod: number; suggestedHorizon: number } {
  const targetIndex = headers.indexOf(targetColumn);
  const timeIndex = timeColumn ? headers.indexOf(timeColumn) : -1;
  const observations: ForecastObservation[] = [];
  let droppedTargets = 0;
  let invalidTimes = 0;

  rows.forEach((row, index) => {
    const value = parseNumber(row[targetIndex]);
    if (value === null) {
      droppedTargets += 1;
      return;
    }
    if (timeIndex >= 0) {
      const timeMs = parseTime(row[timeIndex]);
      if (timeMs === undefined) {
        invalidTimes += 1;
        return;
      }
      observations.push({
        timestamp: row[timeIndex].trim(),
        timeMs,
        value,
      });
    } else {
      observations.push({ timestamp: "Row " + (index + 1), value });
    }
  });

  if (timeIndex >= 0) observations.sort((left, right) => (left.timeMs || 0) - (right.timeMs || 0));

  const timeCounts: Record<string, number> = {};
  let duplicateTimes = 0;
  observations.forEach((row) => {
    if (typeof row.timeMs !== "number") return;
    const key = String(row.timeMs);
    if (timeCounts[key]) duplicateTimes += 1;
    timeCounts[key] = (timeCounts[key] || 0) + 1;
  });

  const deltas: number[] = [];
  for (let index = 1; index < observations.length; index += 1) {
    const previous = observations[index - 1].timeMs;
    const current = observations[index].timeMs;
    if (typeof previous === "number" && typeof current === "number" && current > previous) {
      deltas.push(current - previous);
    }
  }
  const sortedDeltas = deltas.slice().sort((a, b) => a - b);
  const medianDelta = sortedDeltas.length
    ? sortedDeltas[Math.floor(sortedDeltas.length / 2)]
    : 0;
  const gapCount = medianDelta > 0 ? deltas.filter((delta) => delta > medianDelta * 1.8).length : 0;

  let frequencyLabel = timeIndex < 0 ? "Row order (no timestamps)" : "Irregular / unknown";
  let suggestedPeriod = 1;
  let suggestedHorizon = 1;
  if (medianDelta > 0 && medianDelta <= 90 * 60 * 1000) {
    frequencyLabel = "Sub-daily (~" + Math.max(1, Math.round(medianDelta / 60000)) + " min)";
    suggestedPeriod = Math.max(2, Math.min(168, Math.round(86400000 / medianDelta)));
    suggestedHorizon = Math.min(48, suggestedPeriod);
  } else if (medianDelta > 90 * 60 * 1000 && medianDelta <= 36 * 60 * 60 * 1000) {
    frequencyLabel = "Daily / near-daily";
    suggestedPeriod = 7;
    suggestedHorizon = 7;
  } else if (medianDelta > 4 * 86400000 && medianDelta <= 10 * 86400000) {
    frequencyLabel = "Weekly";
    suggestedPeriod = 52;
    suggestedHorizon = 4;
  } else if (medianDelta > 20 * 86400000 && medianDelta <= 45 * 86400000) {
    frequencyLabel = "Monthly";
    suggestedPeriod = 12;
    suggestedHorizon = 3;
  } else if (medianDelta > 70 * 86400000 && medianDelta <= 120 * 86400000) {
    frequencyLabel = "Quarterly / multi-month";
    suggestedPeriod = 4;
    suggestedHorizon = 2;
  } else if (medianDelta > 0) {
    frequencyLabel = "Timed observations (verify cadence)";
    suggestedPeriod = 1;
    suggestedHorizon = 1;
  }

  return { observations, droppedTargets, invalidTimes, duplicateTimes, gapCount, frequencyLabel, suggestedPeriod, suggestedHorizon };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function downloadForecast(result: RollingForecastResult, targetColumn: string): void {
  const rows: Array<Array<string | number>> = [
    ["record_type", "target", "step", "timestamp", "forecast", "lower_80_interval", "upper_80_interval"],
  ];
  result.forecastPoints.forEach((point) => {
    rows.push(["forecast", targetColumn, point.step, point.timestamp, point.yHat, point.lower80, point.upper80]);
  });
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ecam-ts-forecast.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatMetric(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export const RealDataForecastModule: React.FC = () => {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [targetColumn, setTargetColumn] = useState("");
  const [timeColumn, setTimeColumn] = useState("");
  const [horizon, setHorizon] = useState(24);
  const [seasonalPeriod, setSeasonalPeriod] = useState(24);
  const [foldCount, setFoldCount] = useState(5);
  const [trainFraction, setTrainFraction] = useState(0.6);
  const [result, setResult] = useState<RollingForecastResult | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const candidates = useMemo(() => numericColumns(headers, rows), [headers, rows]);
  const dataProfile = useMemo(
    () => buildObservations(headers, rows, targetColumn, timeColumn),
    [headers, rows, targetColumn, timeColumn]
  );

  const resetResult = () => {
    setResult(null);
    setError("");
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setError("");
    setResult(null);
    try {
      const parsed = parseCsv(await file.text());
      const nextHeaders = uniqueHeaders(parsed[0]);
      const nextRows = parsed.slice(1);
      const numeric = numericColumns(nextHeaders, nextRows);
      if (!numeric.length) throw new Error("No numeric target column was detected. Check the CSV header and target values.");
      const detectedTime = detectTimeColumn(nextHeaders, nextRows);
      const defaultTarget = numeric[0];
      const profile = buildObservations(nextHeaders, nextRows, defaultTarget, detectedTime);

      setFileName(file.name);
      setHeaders(nextHeaders);
      setRows(nextRows);
      setTargetColumn(defaultTarget);
      setTimeColumn(detectedTime);
      setSeasonalPeriod(profile.suggestedPeriod);
      setHorizon(profile.suggestedHorizon);
      setFoldCount(5);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "CSV parsing failed.");
      setFileName("");
      setHeaders([]);
      setRows([]);
      setTargetColumn("");
      setTimeColumn("");
    }
  };

  const runEvaluation = () => {
    setError("");
    setResult(null);
    if (!targetColumn) {
      setError("Choose a numeric target column first.");
      return;
    }
    if (dataProfile.duplicateTimes > 0) {
      setError("Found " + dataProfile.duplicateTimes + " duplicate timestamps. Aggregate or remove duplicate timestamps before evaluation so each time point has one target value.");
      return;
    }
    if (dataProfile.observations.length < 20) {
      setError("Only " + dataProfile.observations.length + " usable observations remain. At least 20 are required for this rolling-origin engine.");
      return;
    }
    setIsRunning(true);
    try {
      const evaluated = runRollingOriginEvaluation(dataProfile.observations, {
        horizon,
        seasonalPeriod,
        folds: foldCount,
        initialTrainFraction: trainFraction,
      });
      setResult(evaluated);
    } catch (evaluationError) {
      setError(evaluationError instanceof Error ? evaluationError.message : "Rolling-origin evaluation failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const historyForChart = dataProfile.observations.slice(-80);
  const chartValues = historyForChart.map((point) => point.value).concat(result ? result.forecastPoints.map((point) => point.yHat) : []);
  const chartMin = chartValues.length ? Math.min.apply(null, chartValues) : 0;
  const chartMax = chartValues.length ? Math.max.apply(null, chartValues) : 1;
  const chartRange = chartMax - chartMin || 1;
  const chartWidth = 960;
  const chartHeight = 300;
  const leftPad = 55;
  const rightPad = 25;
  const topPad = 22;
  const bottomPad = 35;
  const chartCount = historyForChart.length + (result ? result.forecastPoints.length : 0);
  const xAt = (index: number) => leftPad + (index / Math.max(1, chartCount - 1)) * (chartWidth - leftPad - rightPad);
  const yAt = (value: number) => topPad + (1 - (value - chartMin) / chartRange) * (chartHeight - topPad - bottomPad);
  const historyPath = historyForChart.map((point, index) => xAt(index) + "," + yAt(point.value)).join(" ");
  const forecastPath = result
    ? [historyForChart.length - 1].concat(result.forecastPoints.map((point, index) => historyForChart.length + index))
        .map((index, pointIndex) => {
          const value = pointIndex === 0
            ? historyForChart[historyForChart.length - 1]?.value
            : result.forecastPoints[index - historyForChart.length]?.yHat;
          return xAt(index) + "," + yAt(value === undefined ? 0 : value);
        }).join(" ")
    : "";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
                <Activity className="h-3.5 w-3.5" /> ECAM-TS · real-data engine
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">CSV Rolling Forecast Lab</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Upload your own series, evaluate forecasts on chronological rolling origins, and let validation error choose the model for that data.
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4 text-cyan-300" /> Rolling-origin validation</div>
              <div className="mt-1 text-xs text-slate-400">No random shuffle · No fixed winner</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr] sm:p-7">
          <div className="space-y-4">
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
              <Upload className="mb-3 h-7 w-7 text-blue-700" />
              <span className="font-semibold text-slate-900">Choose a CSV time-series file</span>
              <span className="mt-1 text-xs text-slate-500">The file is parsed in your browser and is not uploaded to a server.</span>
              <input
                type="file"
                accept=".csv,.txt,text/csv"
                className="sr-only"
                onChange={(event) => handleUpload(event.target.files?.[0])}
              />
              <span className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Browse CSV</span>
            </label>

            {fileName && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-700" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-emerald-900">{fileName}</div>
                  <div className="text-xs text-emerald-800">{rows.length.toLocaleString()} data rows · {headers.length} columns</div>
                </div>
                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-700" />
              </div>
            )}

            {headers.length > 0 && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Timestamp column</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={timeColumn}
                    onChange={(event) => { setTimeColumn(event.target.value); resetResult(); }}
                  >
                    <option value="">Use row order (no time column)</option>
                    {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Numeric target to forecast</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={targetColumn}
                    onChange={(event) => { setTargetColumn(event.target.value); resetResult(); }}
                  >
                    {candidates.map((header) => <option key={header} value={header}>{header}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Forecast horizon</label>
                    <input type="number" min={1} max={1000} value={horizon} onChange={(event) => { setHorizon(Math.max(1, Number(event.target.value) || 1)); resetResult(); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Seasonal period (m)</label>
                    <input type="number" min={1} max={10000} value={seasonalPeriod} onChange={(event) => { setSeasonalPeriod(Math.max(1, Number(event.target.value) || 1)); resetResult(); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Rolling folds</label>
                    <select value={foldCount} onChange={(event) => { setFoldCount(Number(event.target.value)); resetResult(); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      {[2, 3, 4, 5, 6, 7, 8].map((fold) => <option key={fold} value={fold}>{fold} folds</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Initial training window</label>
                    <select value={trainFraction} onChange={(event) => { setTrainFraction(Number(event.target.value)); resetResult(); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      <option value={0.5}>50% of observations</option>
                      <option value={0.6}>60% of observations</option>
                      <option value={0.7}>70% of observations</option>
                      <option value={0.8}>80% of observations</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={runEvaluation}
                  disabled={isRunning || !targetColumn}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4" /> {isRunning ? "Evaluating rolling origins…" : "Run rolling-origin evaluation"}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Usable observations</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{dataProfile.observations.length.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Detected cadence</div>
                <div className="mt-1 text-sm font-bold text-slate-900">{dataProfile.frequencyLabel}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Rows dropped (target)</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{dataProfile.droppedTargets.toLocaleString()}</div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                <div className="text-sm text-blue-950">
                  <div className="font-semibold">Engine candidates</div>
                  <p className="mt-1 text-xs leading-5 text-blue-900">
                    Last-value naive, seasonal naive, robust damped trend, ridge autoregression, and an adaptive ensemble whose weights use only earlier rolling folds. The lowest measured rolling MAE selects the deployment forecaster.
                  </p>
                </div>
              </div>
            </div>

            {dataProfile.observations.length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Data validation</h3>
                  <span className="text-xs text-slate-500">Before model fitting</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between gap-3"><span className="text-slate-500">Invalid timestamps skipped</span><span className="font-semibold text-slate-800">{dataProfile.invalidTimes}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-500">Duplicate timestamp rows</span><span className={dataProfile.duplicateTimes ? "font-semibold text-rose-700" : "font-semibold text-emerald-700"}>{dataProfile.duplicateTimes}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-500">Large cadence gaps detected</span><span className={dataProfile.gapCount ? "font-semibold text-amber-700" : "font-semibold text-emerald-700"}>{dataProfile.gapCount}</span></div>
                </div>
                {(dataProfile.duplicateTimes > 0 || dataProfile.gapCount > 0 || dataProfile.droppedTargets > 0) && (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                    <strong>Data-quality note:</strong> the engine drops nonnumeric target values. Resolve duplicate timestamps before forecasting. Missing timestamps or large gaps can make row-based seasonal periods misleading; verify cadence and set the seasonal period to match the target series.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div><div className="font-semibold">Forecast could not run</div><p className="mt-1">{error}</p></div>
        </div>
      )}

      {result && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected model</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{result.bestModelName}</div>
              <div className="mt-1 text-xs text-slate-500">Selected by rolling-validation MAE</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validation MAE</div>
              <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{formatMetric(result.metrics.find((item) => item.id === result.bestModelId)?.mae || 0)}</div>
              <div className="mt-1 text-xs text-slate-500">In the target's original units</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rolling origins</div>
              <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{result.validationOrigins}</div>
              <div className="mt-1 text-xs text-slate-500">{result.validationPredictions} scored origin-step predictions</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validation MASE</div>
              <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{formatMetric(result.metrics.find((item) => item.id === result.bestModelId)?.mase || 0)}</div>
              <div className="mt-1 text-xs text-slate-500">Below 1 beats the seasonal scaling baseline</div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Activity className="h-4 w-4 text-blue-700" /> Forecast trajectory</div>
                <h3 className="mt-1 text-lg font-bold text-slate-900">Observed history + selected model forecast</h3>
                <p className="mt-1 text-xs text-slate-500">80% empirical interval estimated from this model’s rolling residuals; not a guaranteed coverage interval.</p>
              </div>
              <button type="button" onClick={() => downloadForecast(result, targetColumn)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <Download className="h-4 w-4" /> Download forecast CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <svg viewBox={"0 0 " + chartWidth + " " + chartHeight} className="min-w-[640px] w-full">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = topPad + ratio * (chartHeight - topPad - bottomPad);
                  const value = chartMax - ratio * chartRange;
                  return (
                    <g key={ratio}>
                      <line x1={leftPad} y1={y} x2={chartWidth - rightPad} y2={y} stroke="#E2E8F0" strokeDasharray="3 4" />
                      <text x={leftPad - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748B">{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</text>
                    </g>
                  );
                })}
                {historyPath && <polyline points={historyPath} fill="none" stroke="#0F766E" strokeWidth="2.2" strokeLinejoin="round" />}
                <line x1={xAt(historyForChart.length - 1)} y1={topPad} x2={xAt(historyForChart.length - 1)} y2={chartHeight - bottomPad} stroke="#94A3B8" strokeDasharray="4 4" />
                {result.forecastPoints.map((point, index) => {
                  const x = xAt(historyForChart.length + index);
                  const upperY = yAt(point.upper80);
                  const lowerY = yAt(point.lower80);
                  return <g key={point.step}><line x1={x} y1={upperY} x2={x} y2={lowerY} stroke="#93C5FD" strokeWidth="5" strokeLinecap="round" /><circle cx={x} cy={yAt(point.yHat)} r="3.5" fill="#1D4ED8" /></g>;
                })}
                {forecastPath && <polyline points={forecastPath} fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round" />}
                <text x={leftPad} y={chartHeight - 8} fontSize="10" fill="#0F766E">Observed history (last {historyForChart.length} rows)</text>
                <text x={chartWidth - rightPad} y={chartHeight - 8} textAnchor="end" fontSize="10" fill="#1D4ED8">Forecast (+{horizon} steps)</text>
              </svg>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">Measured rolling-origin leaderboard</h3>
              <p className="mt-1 text-xs text-slate-500">All candidates use the same chronological origins and horizon. Lower is better for MAE, RMSE and MASE. WAPE is reported as a percentage.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Rank / model</th><th className="px-3 py-3">Family</th><th className="px-3 py-3 text-right">MAE</th><th className="px-3 py-3 text-right">RMSE</th><th className="px-3 py-3 text-right">MASE</th><th className="px-3 py-3 text-right">WAPE</th><th className="px-3 py-3 text-right">Points</th>
                </tr></thead>
                <tbody>
                  {result.metrics.map((metric, index) => (
                    <tr key={metric.id} className={"border-b border-slate-100 " + (metric.id === result.bestModelId ? "bg-emerald-50/60" : "")}>
                      <td className="px-3 py-3 font-semibold text-slate-900">{index + 1}. {metric.name}{metric.id === result.bestModelId ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">SELECTED</span> : null}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">{metric.family}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">{formatMetric(metric.mae)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">{formatMetric(metric.rmse)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">{formatMetric(metric.mase)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">{formatMetric(metric.wapePct)}%</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">{metric.samples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">Rolling fold audit</h3>
              <p className="mt-1 text-xs text-slate-500">Each fold trains only on rows before its forecast origin.</p>
              <div className="mt-3 space-y-2">
                {result.folds.map((fold) => (
                  <div key={fold.fold} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-800">Fold {fold.fold} · origin {fold.origin}</span>
                    <span className="text-slate-600">{fold.trainingRows.toLocaleString()} train / {fold.scoredRows} scored</span>
                    <span className="font-mono font-bold text-slate-900">Adaptive MAE {formatMetric(fold.adaptiveMae)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">Final ensemble weights</h3>
              <p className="mt-1 text-xs text-slate-500">Normalized inverse rolling-validation MAE for the future ensemble; these weights are descriptive, not FFORMA-trained weights.</p>
              <div className="mt-4 space-y-3">
                {Object.entries(result.ensembleWeights).sort((a, b) => b[1] - a[1]).map(([id, weight]) => (
                  <div key={id}>
                    <div className="mb-1 flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">{id.replace(/_/g, " ")}</span><span className="font-mono text-slate-600">{(weight * 100).toFixed(1)}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: (weight * 100) + "%" }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p><strong>Interpretation:</strong> this is a real evaluation of the uploaded values, not a claim that the candidate pool contains every current foundation model. Model rankings depend on this series, horizon and validation setup. A locked final holdout is still recommended before reporting paper-level results. The app does not fabricate TimesFM, Chronos, Moirai, CRPS, or causal festival-effect results.</p>
          </div>
        </>
      )}

      {!result && !error && !fileName && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["1", "Upload and validate", "Detect time / numeric columns, sort timestamps, and flag duplicates and gaps."],
            ["2", "Roll forward in time", "Create multiple forecast origins with strictly historical training windows."],
            ["3", "Choose from evidence", "Compare baseline and regularized models using MAE, RMSE, MASE and WAPE."],
          ].map((item) => (
            <div key={item[0]} className="rounded-xl border border-slate-200 bg-white p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">{item[0]}</span>
              <h3 className="mt-3 font-bold text-slate-900">{item[1]}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item[2]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

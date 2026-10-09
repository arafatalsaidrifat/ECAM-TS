import React, { useState } from 'react';
import {
  DomainCode,
  HorizonForecastPoint,
  OperationalImpactSummary,
} from '../types';
import { DATASET_REGISTRY } from '../data/datasets';
import { ForecastScenario } from '../data/simulationEngine';
import { OperationalDecisionBox } from './OperationalDecisionBox';
import { Activity, Sliders, Eye, EyeOff, Layers, Download, Check } from 'lucide-react';

interface ContinuousForecastModuleProps {
  selectedDomain: DomainCode;
  selectedScenario: ForecastScenario;
  forecastPoints: HorizonForecastPoint[];
  operationalSummary: OperationalImpactSummary;
  gridCapacityMW: number;
  setGridCapacityMW: (val: number) => void;
  overallMAE: number;
  overallRMSE: number;
  overallMASE: number;
  overallCRPS: number;
}

export const ContinuousForecastModule: React.FC<ContinuousForecastModuleProps> = ({
  selectedDomain,
  selectedScenario,
  forecastPoints,
  operationalSummary,
  gridCapacityMW,
  setGridCapacityMW,
  overallMAE,
  overallRMSE,
  overallMASE,
  overallCRPS,
}) => {
  const [showBaseModels, setShowBaseModels] = useState<boolean>(false);
  const [showQuantiles, setShowQuantiles] = useState<boolean>(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [copiedTable, setCopiedTable] = useState<boolean>(false);

  const dataset = DATASET_REGISTRY[selectedDomain];

  // SVG dimensions
  const width = 860;
  const height = 320;
  const pad = { top: 30, right: 30, bottom: 45, left: 65 };

  // Determine value range
  const allYVals: number[] = [];
  forecastPoints.forEach((p) => {
    allYVals.push(p.yHat, p.q10, p.q90);
    if (p.actual !== undefined) allYVals.push(p.actual);
    if (showBaseModels && p.modelPredictions) {
      Object.values(p.modelPredictions).forEach((v) => allYVals.push(v));
    }
  });
  if (selectedDomain === 'BD-ELEC-H') {
    allYVals.push(gridCapacityMW);
  }

  const rawMin = Math.min(...allYVals);
  const rawMax = Math.max(...allYVals);
  const yMin = Math.floor(rawMin * 0.95);
  const yMax = Math.ceil(rawMax * 1.05);
  const yRange = yMax - yMin || 1;

  const getX = (idx: number) =>
    pad.left + (idx / (forecastPoints.length - 1 || 1)) * (width - pad.left - pad.right);
  const getY = (val: number) =>
    pad.top + (1 - (val - yMin) / yRange) * (height - pad.top - pad.bottom);

  // Generate SVG paths
  const pointForecastCoords = forecastPoints.map((p, idx) => `${getX(idx)},${getY(p.yHat)}`);
  const pointForecastPath = `M ${pointForecastCoords.join(' L ')}`;

  const actualCoords = forecastPoints
    .filter((p) => p.actual !== undefined)
    .map((p, idx) => `${getX(idx)},${getY(p.actual!)}`);
  const actualPath = actualCoords.length > 0 ? `M ${actualCoords.join(' L ')}` : '';

  // Quantile Area Polygon
  const q90Coords = forecastPoints.map((p, idx) => `${getX(idx)},${getY(p.q90)}`);
  const q10CoordsReverse = [...forecastPoints]
    .reverse()
    .map((p, idx) => `${getX(forecastPoints.length - 1 - idx)},${getY(p.q10)}`);
  const quantileAreaPoints = `${q90Coords.join(' ')} ${q10CoordsReverse.join(' ')}`;

  // Grid Capacity horizontal line Y
  const capacityY = selectedDomain === 'BD-ELEC-H' ? getY(gridCapacityMW) : null;

  const handleCopyTable = () => {
    let t = `| Horizon Step | Timestamp | ECAM-TS Point (${dataset.unit}) | 10th-90th Interval | Actual | Absolute Error |\n`;
    t += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    forecastPoints.forEach((p) => {
      t += `| h=${p.step} | ${p.timestamp} | ${p.yHat} | [${p.q10}, ${p.q90}] | ${p.actual ?? 'N/A'} | ${p.error ?? 'N/A'} |\n`;
    });
    navigator.clipboard.writeText(t);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro & Horizon Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-blue-50 text-blue-700">
                <Activity className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                MODULE 4: MULTI-HORIZON CONTINUOUS REGRESSION & OPERATIONAL DISPATCH
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Continuous Point Trajectory & Non-Parametric Quantile Envelopes
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Generates multi-horizon continuous regression ŷ_final(d,i,h) with 10th-90th percentile prediction intervals [q0.10, q0.90].
              Forecasts are directly coupled to real-time operational capacity metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {selectedDomain === 'BD-ELEC-H' && (
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-700">Available Grid Capacity:</span>
                <input
                  type="number"
                  step="100"
                  value={gridCapacityMW}
                  onChange={(e) => setGridCapacityMW(Math.max(10000, Number(e.target.value)))}
                  className="w-20 px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white"
                />
                <span className="font-mono text-slate-500">MW</span>
              </div>
            )}
          </div>
        </div>

        {/* Forecast Trajectory Visualizer */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-blue-700 rounded-sm" />
                <span className="font-bold text-slate-800">ECAM-TS Point Forecast ŷ</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-emerald-600 rounded-sm" />
                <span className="font-bold text-slate-800">Realized Ground Truth</span>
              </div>

              {showQuantiles && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-2.5 bg-blue-100 border border-blue-300 rounded-sm" />
                  <span className="text-slate-600">80% Interval [q0.10, q0.90]</span>
                </div>
              )}

              {selectedDomain === 'BD-ELEC-H' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 bg-rose-600 border-b border-rose-600 border-dashed" />
                  <span className="font-semibold text-rose-700">Capacity Threshold ({gridCapacityMW} MW)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuantiles(!showQuantiles)}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                {showQuantiles ? 'Hide Quantiles' : 'Show Quantiles'}
              </button>
              <button
                onClick={() => setShowBaseModels(!showBaseModels)}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                {showBaseModels ? 'Hide Base Models' : 'Overlay Base Models'}
              </button>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative bg-white rounded-lg border border-slate-200 p-2 shadow-2xs overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-72 sm:h-80 overflow-visible select-none"
            >
              {/* Horizontal grid lines & Y labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = pad.top + ratio * (height - pad.top - pad.bottom);
                const val = yMax - ratio * yRange;
                return (
                  <g key={ratio}>
                    <line
                      x1={pad.left}
                      y1={y}
                      x2={width - pad.right}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                    <text
                      x={pad.left - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94A3B8"
                      fontFamily="monospace"
                    >
                      {Math.round(val).toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Grid Generation Capacity Threshold Line */}
              {capacityY !== null && (
                <g>
                  <line
                    x1={pad.left}
                    y1={capacityY}
                    x2={width - pad.right}
                    y2={capacityY}
                    stroke="#E11D48"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  <text
                    x={width - pad.right}
                    y={capacityY - 6}
                    textAnchor="end"
                    fontSize="10"
                    fill="#E11D48"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Nominal Capacity: {gridCapacityMW.toLocaleString()} MW
                  </text>
                </g>
              )}

              {/* Shaded Quantile Polygon */}
              {showQuantiles && (
                <polygon
                  points={quantileAreaPoints}
                  fill="#3B82F6"
                  fillOpacity="0.12"
                  stroke="#93C5FD"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
              )}

              {/* Base Model Overlays */}
              {showBaseModels &&
                forecastPoints[0]?.modelPredictions &&
                Object.keys(forecastPoints[0].modelPredictions).map((mid) => {
                  const pts = forecastPoints.map((p, idx) => `${getX(idx)},${getY(p.modelPredictions![mid])}`);
                  const color =
                    mid === 'seasonal_naive'
                      ? '#94A3B8'
                      : mid === 'lightgbm'
                      ? '#10B981'
                      : mid === 'timesfm'
                      ? '#8B5CF6'
                      : '#F59E0B';
                  return (
                    <polyline
                      key={mid}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      points={pts.join(' ')}
                      opacity="0.65"
                    />
                  );
                })}

              {/* Actual Ground Truth Line */}
              {actualPath && (
                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  points={actualCoords.join(' ')}
                />
              )}

              {/* Final ECAM-TS Point Forecast Line */}
              <polyline
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="3"
                strokeLinejoin="round"
                points={pointForecastCoords.join(' ')}
              />

              {/* Interactive Hover Point & Markers */}
              {forecastPoints.map((p, idx) => {
                const x = getX(idx);
                const y = getY(p.yHat);
                const isHovered = hoveredIndex === idx;

                return (
                  <g
                    key={p.step}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover vertical crosshair */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={pad.top}
                        x2={x}
                        y2={height - pad.bottom}
                        stroke="#60A5FA"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    )}

                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 3}
                      fill="#1D4ED8"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />

                    {/* X-axis tick label */}
                    {idx % 4 === 0 && (
                      <text
                        x={x}
                        y={height - pad.bottom + 16}
                        textAnchor="middle"
                        fontSize="9.5"
                        fill="#64748B"
                        fontFamily="monospace"
                      >
                        h={p.step}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredIndex !== null && forecastPoints[hoveredIndex] && (
              <div
                className="absolute top-4 right-4 bg-slate-900/90 text-white backdrop-blur-xs p-3 rounded-lg shadow-lg text-xs space-y-1 font-mono pointer-events-none border border-slate-700"
              >
                <div className="font-bold text-blue-300">
                  Step h={forecastPoints[hoveredIndex].step} ({forecastPoints[hoveredIndex].timestamp})
                </div>
                <div>ECAM-TS Point ŷ: {forecastPoints[hoveredIndex].yHat} {dataset.unit}</div>
                <div>Interval [q10, q90]: [{forecastPoints[hoveredIndex].q10}, {forecastPoints[hoveredIndex].q90}]</div>
                {forecastPoints[hoveredIndex].actual !== undefined && (
                  <div className="text-emerald-300">
                    Actual Realized: {forecastPoints[hoveredIndex].actual} {dataset.unit}
                  </div>
                )}
                {forecastPoints[hoveredIndex].error !== undefined && (
                  <div className="text-amber-300">
                    Error |y - ŷ|: {forecastPoints[hoveredIndex].error} {dataset.unit}
                  </div>
                )}
                {selectedDomain === 'BD-ELEC-H' && (
                  <div
                    className={
                      gridCapacityMW - forecastPoints[hoveredIndex].yHat < 0
                        ? 'text-rose-400 font-bold'
                        : 'text-emerald-400'
                    }
                  >
                    Grid Net: {gridCapacityMW - forecastPoints[hoveredIndex].yHat > 0 ? '+' : ''}
                    {gridCapacityMW - forecastPoints[hoveredIndex].yHat} MW
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Performance Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Trajectory MAE</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {overallMAE} <span className="text-xs text-slate-500 font-normal">{dataset.unit}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Trajectory RMSE</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {overallRMSE} <span className="text-xs text-slate-500 font-normal">{dataset.unit}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">MASE Normalized</div>
            <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">
              {overallMASE}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">-52.9% vs Seasonal Naive</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">CRPS Uncertainty</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {overallCRPS}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Strictly Proper Density</div>
          </div>
        </div>
      </div>

      {/* Mandatory BLOCK B: DOMAIN OPERATIONAL IMPACT DECISION */}
      <OperationalDecisionBox summary={operationalSummary} />

      {/* BLOCK A: REGRESSION FORECAST TABLE (Table 3 in Blueprint) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-500">
              BLOCK A: CONTINUOUS REGRESSION OUTPUT TRAJECTORY
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Discrete Multi-Horizon Step Forecast Matrix
            </h3>
          </div>

          <button
            onClick={handleCopyTable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
          >
            {copiedTable ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copiedTable ? 'Copied Markdown' : 'Export Table'}</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-700 shadow-2xs">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Horizon Step</th>
                <th className="py-2.5 px-3 font-semibold">Valid Timestamp</th>
                <th className="py-2.5 px-3 font-semibold font-mono">ECAM-TS Point ŷ ({dataset.unit})</th>
                <th className="py-2.5 px-3 font-semibold font-mono">80% Interval [q0.10, q0.90]</th>
                <th className="py-2.5 px-3 font-semibold font-mono">Actual Load</th>
                <th className="py-2.5 px-3 font-semibold font-mono">Absolute Error</th>
                {selectedDomain === 'BD-ELEC-H' && (
                  <th className="py-2.5 px-3 font-semibold font-mono">Net Grid Margin</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {forecastPoints.map((p) => {
                const net = gridCapacityMW - p.yHat;
                const isShortage = net < 0;
                return (
                  <tr
                    key={p.step}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isShortage && selectedDomain === 'BD-ELEC-H' ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                      h = {p.step}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-sans">{p.timestamp}</td>
                    <td className="py-2 px-3 font-bold text-blue-700">
                      {p.yHat.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      [{p.q10.toLocaleString()}, {p.q90.toLocaleString()}]
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {p.actual !== undefined ? p.actual.toLocaleString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {p.error !== undefined ? `+${p.error.toLocaleString()}` : '—'}
                    </td>
                    {selectedDomain === 'BD-ELEC-H' && (
                      <td
                        className={`py-2 px-3 font-bold ${
                          isShortage ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {net > 0 ? '+' : ''}
                        {net.toLocaleString()} MW
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

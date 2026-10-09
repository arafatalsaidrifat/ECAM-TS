import assert from "node:assert/strict";
import { runRollingOriginEvaluation } from "../src/data/realForecastEngine";

const observations = Array.from({ length: 180 }, (_, index) => {
  const date = new Date(Date.UTC(2021, 0, 1) + index * 86400000);
  const value = 48 + 0.08 * index + 3.5 * Math.sin((2 * Math.PI * index) / 7) + 0.35 * Math.sin(index * 1.7);
  return {
    timestamp: date.toISOString().slice(0, 10),
    timeMs: date.getTime(),
    value,
  };
});

const result = runRollingOriginEvaluation(observations, {
  horizon: 7,
  seasonalPeriod: 7,
  folds: 5,
  initialTrainFraction: 0.6,
});

assert.equal(result.forecastPoints.length, 7, "forecast must contain the selected horizon");
assert.equal(result.validationOrigins, 5, "requested rolling origins should be evaluated");
assert.ok(result.metrics.length >= 4, "baseline and learned candidates should be compared");
assert.ok(result.metrics.every((metric) => Number.isFinite(metric.mae) && Number.isFinite(metric.rmse) && Number.isFinite(metric.mase)));
assert.ok(result.forecastPoints.every((point) => Number.isFinite(point.yHat) && point.lower80 <= point.upper80));
const weightTotal = Object.values(result.ensembleWeights).reduce((sum, weight) => sum + weight, 0);
assert.ok(Math.abs(weightTotal - 1) < 1e-8, "ensemble weights must sum to one");
assert.ok(result.folds.every((fold) => fold.trainingRows < observations.length && fold.scoredRows === 7));
console.log("ECAM-TS rolling forecast smoke test passed:", result.bestModelName, "MAE =", result.metrics[0].mae.toFixed(4));

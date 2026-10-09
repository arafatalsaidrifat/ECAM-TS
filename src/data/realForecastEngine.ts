export interface ForecastObservation {
  timestamp: string;
  timeMs?: number;
  value: number;
}

export interface RollingForecastOptions {
  horizon: number;
  seasonalPeriod: number;
  folds: number;
  initialTrainFraction: number;
}

export interface ModelScore {
  id: string;
  name: string;
  family: string;
  mae: number;
  rmse: number;
  mase: number;
  wapePct: number;
  samples: number;
}

export interface ForecastPoint {
  step: number;
  timestamp: string;
  yHat: number;
  lower80: number;
  upper80: number;
  modelPredictions: Record<string, number>;
}

export interface FoldSummary {
  fold: number;
  origin: string;
  trainingRows: number;
  scoredRows: number;
  adaptiveMae: number;
}

export interface RollingForecastResult {
  bestModelId: string;
  bestModelName: string;
  metrics: ModelScore[];
  forecastPoints: ForecastPoint[];
  folds: FoldSummary[];
  ensembleWeights: Record<string, number>;
  maseScale: number;
  validationOrigins: number;
  validationPredictions: number;
  selectedResiduals: number[];
}

type PredictionMap = Record<string, number[]>;

const MODEL_NAMES: Record<string, { name: string; family: string }> = {
  naive: { name: "Last-value naive", family: "Simple baseline" },
  seasonal_naive: { name: "Seasonal naive", family: "Seasonal baseline" },
  damped_trend: { name: "Robust damped trend", family: "Statistical baseline" },
  ridge_autoregression: { name: "Ridge autoregression", family: "Regularized ML" },
  adaptive_ensemble: { name: "ECAM adaptive ensemble", family: "Validation-weighted ensemble" },
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function quantile(values: number[], probability: number): number {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const position = Math.max(0, Math.min(1, probability)) * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const fraction = position - lower;
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

function mae(actual: number[], predicted: number[]): number {
  if (!actual.length) return 0;
  return mean(actual.map((value, index) => Math.abs(value - predicted[index])));
}

function makeNaiveForecast(history: number[], horizon: number): number[] {
  const last = history[history.length - 1];
  return Array.from({ length: horizon }, () => last);
}

function makeSeasonalNaiveForecast(history: number[], horizon: number, period: number): number[] {
  if (period <= 1 || history.length < period) return makeNaiveForecast(history, horizon);
  const lastSeason = history.slice(history.length - period);
  return Array.from({ length: horizon }, (_, index) => lastSeason[index % period]);
}

function makeDampedTrendForecast(history: number[], horizon: number): number[] {
  const windowSize = Math.min(history.length, 96);
  const window = history.slice(history.length - windowSize);
  const centerX = (windowSize - 1) / 2;
  const centerY = mean(window);
  let numerator = 0;
  let denominator = 0;

  for (let index = 0; index < windowSize; index += 1) {
    numerator += (index - centerX) * (window[index] - centerY);
    denominator += (index - centerX) * (index - centerX);
  }

  let slope = denominator > 0 ? numerator / denominator : 0;
  const differences: number[] = [];
  for (let index = 1; index < window.length; index += 1) {
    differences.push(window[index] - window[index - 1]);
  }
  const differenceMedian = median(differences);
  const absoluteDeviations = differences.map((value) => Math.abs(value - differenceMedian));
  const robustScale = median(absoluteDeviations) * 1.4826;
  if (robustScale > 0) {
    const slopeLimit = robustScale * 2.5;
    slope = Math.max(-slopeLimit, Math.min(slopeLimit, slope));
  }

  const last = history[history.length - 1];
  const damping = 0.82;
  return Array.from({ length: horizon }, (_, index) => {
    const step = index + 1;
    const dampedSteps = (1 - Math.pow(damping, step)) / (1 - damping);
    return last + slope * dampedSteps;
  });
}

function featureAt(values: number[], targetIndex: number, offsets: number[]): number[] {
  const features = offsets.map((offset) => values[targetIndex - offset]);
  const meanWindow = Math.min(7, targetIndex);
  let recentTotal = 0;
  for (let index = targetIndex - meanWindow; index < targetIndex; index += 1) {
    recentTotal += values[index];
  }
  features.push(meanWindow > 0 ? recentTotal / meanWindow : values[targetIndex - 1]);
  return features;
}

function featureForNext(values: number[], offsets: number[]): number[] {
  const length = values.length;
  const features = offsets.map((offset) => values[length - offset]);
  const meanWindow = Math.min(7, length);
  let recentTotal = 0;
  for (let index = length - meanWindow; index < length; index += 1) {
    recentTotal += values[index];
  }
  features.push(meanWindow > 0 ? recentTotal / meanWindow : values[length - 1]);
  return features;
}

function solveLinearSystem(matrix: number[][], vector: number[]): number[] | null {
  const size = vector.length;
  const augmented = matrix.map((row, index) => row.slice().concat(vector[index]));

  for (let pivot = 0; pivot < size; pivot += 1) {
    let bestRow = pivot;
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[bestRow][pivot])) {
        bestRow = row;
      }
    }
    if (Math.abs(augmented[bestRow][pivot]) < 1e-10) return null;

    const temporary = augmented[pivot];
    augmented[pivot] = augmented[bestRow];
    augmented[bestRow] = temporary;

    const divisor = augmented[pivot][pivot];
    for (let column = pivot; column <= size; column += 1) {
      augmented[pivot][column] /= divisor;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === pivot) continue;
      const factor = augmented[row][pivot];
      for (let column = pivot; column <= size; column += 1) {
        augmented[row][column] -= factor * augmented[pivot][column];
      }
    }
  }

  return augmented.map((row) => row[size]);
}

function makeRidgeAutoregressionForecast(history: number[], horizon: number, period: number): number[] {
  if (history.length < 16) return makeDampedTrendForecast(history, horizon);

  const offsets = [1, 2, 3];
  if (period > 3 && history.length >= period * 2) offsets.push(period);
  if (period > 3 && history.length >= period * 3) offsets.push(period * 2);
  const maxOffset = Math.max.apply(null, offsets);
  if (history.length - maxOffset < 12) return makeDampedTrendForecast(history, horizon);

  const featureRows: number[][] = [];
  const targets: number[] = [];
  for (let targetIndex = maxOffset; targetIndex < history.length; targetIndex += 1) {
    featureRows.push(featureAt(history, targetIndex, offsets));
    targets.push(history[targetIndex]);
  }

  const featureCount = featureRows[0].length;
  const featureMeans: number[] = [];
  const featureScales: number[] = [];
  for (let column = 0; column < featureCount; column += 1) {
    const columnValues = featureRows.map((row) => row[column]);
    const columnMean = mean(columnValues);
    const variance = mean(columnValues.map((value) => (value - columnMean) * (value - columnMean)));
    featureMeans.push(columnMean);
    featureScales.push(Math.sqrt(variance) || 1);
  }

  const targetMean = mean(targets);
  const targetVariance = mean(targets.map((value) => (value - targetMean) * (value - targetMean)));
  const targetScale = Math.sqrt(targetVariance) || 1;
  const design = featureRows.map((row) => [1].concat(row.map((value, index) => (value - featureMeans[index]) / featureScales[index])));
  const normalizedTargets = targets.map((value) => (value - targetMean) / targetScale);
  const dimension = featureCount + 1;
  const gram = Array.from({ length: dimension }, () => Array.from({ length: dimension }, () => 0));
  const rhs = Array.from({ length: dimension }, () => 0);

  for (let row = 0; row < design.length; row += 1) {
    for (let left = 0; left < dimension; left += 1) {
      rhs[left] += design[row][left] * normalizedTargets[row];
      for (let right = 0; right < dimension; right += 1) {
        gram[left][right] += design[row][left] * design[row][right];
      }
    }
  }

  const ridgePenalty = 1;
  for (let index = 1; index < dimension; index += 1) {
    gram[index][index] += ridgePenalty;
  }
  for (let index = 0; index < dimension; index += 1) {
    gram[index][index] += 1e-8;
  }

  const coefficients = solveLinearSystem(gram, rhs);
  if (!coefficients || coefficients.some((value) => !Number.isFinite(value))) {
    return makeDampedTrendForecast(history, horizon);
  }

  const workingHistory = history.slice();
  const output: number[] = [];
  for (let step = 0; step < horizon; step += 1) {
    const currentFeatures = featureForNext(workingHistory, offsets);
    let normalizedPrediction = coefficients[0];
    for (let column = 0; column < featureCount; column += 1) {
      normalizedPrediction += coefficients[column + 1] * ((currentFeatures[column] - featureMeans[column]) / featureScales[column]);
    }
    const prediction = targetMean + targetScale * normalizedPrediction;
    const safePrediction = Number.isFinite(prediction) ? prediction : workingHistory[workingHistory.length - 1];
    output.push(safePrediction);
    workingHistory.push(safePrediction);
  }

  return output;
}

function forecastBaseModels(history: number[], horizon: number, period: number): PredictionMap {
  const predictions: PredictionMap = {
    naive: makeNaiveForecast(history, horizon),
    damped_trend: makeDampedTrendForecast(history, horizon),
    ridge_autoregression: makeRidgeAutoregressionForecast(history, horizon, period),
  };
  if (period > 1) {
    predictions.seasonal_naive = makeSeasonalNaiveForecast(history, horizon, period);
  }
  return predictions;
}

function normalizedInverseErrorWeights(
  ids: string[],
  errorHistory: Record<string, number[]>
): Record<string, number> {
  const observedErrors = ids.map((id) => mean(errorHistory[id] || []));
  if (!observedErrors.some((value) => Number.isFinite(value) && value > 0)) {
    const equalWeight = ids.length ? 1 / ids.length : 0;
    return Object.fromEntries(ids.map((id) => [id, equalWeight]));
  }

  const finitePositive = observedErrors.filter((value) => Number.isFinite(value) && value > 0);
  const scale = median(finitePositive) || 1;
  const rawWeights = ids.map((id, index) => {
    const score = observedErrors[index];
    return Number.isFinite(score) ? 1 / (0.15 + Math.max(0, score) / scale) : 0;
  });
  const total = rawWeights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    const equalWeight = 1 / ids.length;
    return Object.fromEntries(ids.map((id) => [id, equalWeight]));
  }
  return Object.fromEntries(ids.map((id, index) => [id, rawWeights[index] / total]));
}

function weightedForecast(predictions: PredictionMap, weights: Record<string, number>, horizon: number): number[] {
  const ids = Object.keys(predictions);
  return Array.from({ length: horizon }, (_, step) => {
    let prediction = 0;
    let totalWeight = 0;
    for (const id of ids) {
      const weight = weights[id] || 0;
      prediction += weight * predictions[id][step];
      totalWeight += weight;
    }
    if (totalWeight <= 0) return mean(ids.map((id) => predictions[id][step]));
    return prediction / totalWeight;
  });
}

function computeMetrics(actual: number[], predicted: number[], scale: number): Omit<ModelScore, "id" | "name" | "family"> {
  const errors = actual.map((value, index) => value - predicted[index]);
  const absolute = errors.map((value) => Math.abs(value));
  const squared = errors.map((value) => value * value);
  const denominator = actual.reduce((sum, value) => sum + Math.abs(value), 0);
  return {
    mae: mean(absolute),
    rmse: Math.sqrt(mean(squared)),
    mase: mean(absolute) / (scale || 1),
    wapePct: denominator > 0 ? (absolute.reduce((sum, value) => sum + value, 0) / denominator) * 100 : 0,
    samples: actual.length,
  };
}

function calculateMaseScale(history: number[], period: number): number {
  const differences: number[] = [];
  const differencePeriod = period > 1 && history.length > period ? period : 1;
  for (let index = differencePeriod; index < history.length; index += 1) {
    differences.push(Math.abs(history[index] - history[index - differencePeriod]));
  }
  return mean(differences) || 1;
}

function formatDate(date: Date, keepTime: boolean): string {
  const iso = date.toISOString();
  return keepTime ? iso.slice(0, 16).replace("T", " ") : iso.slice(0, 10);
}

function makeFutureLabels(observations: ForecastObservation[], horizon: number): string[] {
  const lastObservation = observations[observations.length - 1];
  if (observations.length < 2 || typeof lastObservation.timeMs !== "number") {
    return Array.from({ length: horizon }, (_, index) => "Step +" + (index + 1));
  }

  const dated = observations.filter((row) => typeof row.timeMs === "number" && Number.isFinite(row.timeMs));
  if (dated.length < 2) {
    return Array.from({ length: horizon }, (_, index) => "Step +" + (index + 1));
  }

  const monthSteps: number[] = [];
  const deltas: number[] = [];
  for (let index = 1; index < dated.length; index += 1) {
    const previous = new Date(dated[index - 1].timeMs as number);
    const current = new Date(dated[index].timeMs as number);
    const months = (current.getUTCFullYear() - previous.getUTCFullYear()) * 12 + current.getUTCMonth() - previous.getUTCMonth();
    if (months > 0) monthSteps.push(months);
    deltas.push((dated[index].timeMs as number) - (dated[index - 1].timeMs as number));
  }

  const likelyMonthly = monthSteps.length / Math.max(1, dated.length - 1) >= 0.7 && median(monthSteps) === 1;
  const medianDelta = median(deltas.filter((value) => value > 0)) || 86400000;
  const originalLast = lastObservation.timestamp;
  const showTime = originalLast.indexOf(":") >= 0;
  const monthOnly = /^\d{4}-\d{2}$/.test(originalLast);
  const startDate = new Date(lastObservation.timeMs);

  return Array.from({ length: horizon }, (_, index) => {
    const date = new Date(startDate.getTime());
    const step = index + 1;
    if (likelyMonthly) {
      const wantedDay = date.getUTCDate();
      date.setUTCDate(1);
      date.setUTCMonth(date.getUTCMonth() + step);
      const lastDayOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
      date.setUTCDate(Math.min(wantedDay, lastDayOfMonth));
    } else {
      date.setTime(startDate.getTime() + medianDelta * step);
    }
    if (monthOnly && likelyMonthly) {
      return date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0");
    }
    return formatDate(date, showTime);
  });
}

export function runRollingOriginEvaluation(
  observations: ForecastObservation[],
  requestedOptions: RollingForecastOptions
): RollingForecastResult {
  const values = observations.map((observation) => observation.value);
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("The selected target contains non-numeric or infinite values. Choose a numeric target column.");
  }

  const length = values.length;
  const horizon = Math.floor(requestedOptions.horizon);
  const period = Math.max(1, Math.floor(requestedOptions.seasonalPeriod));
  const requestedFolds = Math.max(2, Math.min(8, Math.floor(requestedOptions.folds)));
  const fraction = Math.max(0.3, Math.min(0.8, requestedOptions.initialTrainFraction));

  if (horizon < 1 || horizon > 1000) throw new Error("Forecast horizon must be between 1 and 1000 steps.");
  if (length < Math.max(20, horizon + 12)) {
    throw new Error("Not enough usable rows. Upload at least " + Math.max(20, horizon + 12) + " numeric observations for this horizon, or shorten the horizon.");
  }

  const initialTrainSize = Math.max(8, Math.floor(length * fraction));
  const lastValidOrigin = length - horizon;
  if (initialTrainSize > lastValidOrigin) {
    throw new Error("The initial training window leaves no validation horizon. Reduce the training percentage or forecast horizon.");
  }

  const possibleOriginCount = lastValidOrigin - initialTrainSize + 1;
  const foldCount = Math.min(requestedFolds, possibleOriginCount);
  const origins: number[] = [];
  for (let fold = 0; fold < foldCount; fold += 1) {
    const origin = foldCount === 1
      ? initialTrainSize
      : Math.round(initialTrainSize + (fold * (possibleOriginCount - 1)) / (foldCount - 1));
    if (origins[origins.length - 1] !== origin) origins.push(origin);
  }

  const firstTraining = values.slice(0, origins[0]);
  const maseScale = calculateMaseScale(firstTraining, period);
  const baseIds = ["naive"];
  if (period > 1) baseIds.push("seasonal_naive");
  baseIds.push("damped_trend", "ridge_autoregression");

  const predictionsByModel: PredictionMap = {};
  const actualByModel: Record<string, number[]> = {};
  const residualsByModel: Record<string, number[]> = {};
  const priorAbsoluteErrors: Record<string, number[]> = {};
  const foldSummaries: FoldSummary[] = [];
  for (const id of baseIds.concat(["adaptive_ensemble"])) {
    predictionsByModel[id] = [];
    actualByModel[id] = [];
    residualsByModel[id] = [];
  }
  for (const id of baseIds) priorAbsoluteErrors[id] = [];

  origins.forEach((origin, foldIndex) => {
    const training = values.slice(0, origin);
    const actual = values.slice(origin, origin + horizon);
    const basePredictions = forecastBaseModels(training, horizon, period);
    const priorWeights = normalizedInverseErrorWeights(baseIds, priorAbsoluteErrors);
    const adaptivePrediction = weightedForecast(basePredictions, priorWeights, horizon);
    const everyPrediction: PredictionMap = Object.assign({}, basePredictions, {
      adaptive_ensemble: adaptivePrediction,
    });

    let foldAbsoluteError = 0;
    for (const id of Object.keys(everyPrediction)) {
      const currentPredictions = everyPrediction[id];
      predictionsByModel[id].push.apply(predictionsByModel[id], currentPredictions);
      actualByModel[id].push.apply(actualByModel[id], actual);
      for (let index = 0; index < actual.length; index += 1) {
        const residual = actual[index] - currentPredictions[index];
        residualsByModel[id].push(residual);
        if (id === "adaptive_ensemble") foldAbsoluteError += Math.abs(residual);
      }
    }

    foldSummaries.push({
      fold: foldIndex + 1,
      origin: observations[origin] ? observations[origin].timestamp : "Row " + (origin + 1),
      trainingRows: origin,
      scoredRows: actual.length,
      adaptiveMae: foldAbsoluteError / actual.length,
    });

    for (const id of baseIds) {
      const prediction = basePredictions[id];
      for (let index = 0; index < actual.length; index += 1) {
        priorAbsoluteErrors[id].push(Math.abs(actual[index] - prediction[index]));
      }
    }
  });

  const metrics: ModelScore[] = Object.keys(predictionsByModel).map((id) => {
    const meta = MODEL_NAMES[id] || { name: id, family: "Candidate" };
    const valuesForModel = computeMetrics(actualByModel[id], predictionsByModel[id], maseScale);
    return Object.assign({ id, name: meta.name, family: meta.family }, valuesForModel);
  }).sort((left, right) => left.mae - right.mae);

  const best = metrics[0];
  const baseMetrics: Record<string, number[]> = {};
  for (const id of baseIds) {
    const score = metrics.find((metric) => metric.id === id);
    baseMetrics[id] = score ? [score.mae] : [];
  }
  const ensembleWeights = normalizedInverseErrorWeights(baseIds, baseMetrics);
  const finalBasePredictions = forecastBaseModels(values, horizon, period);
  const finalEnsemblePredictions = weightedForecast(finalBasePredictions, ensembleWeights, horizon);
  const selectedPredictions = best.id === "adaptive_ensemble"
    ? finalEnsemblePredictions
    : finalBasePredictions[best.id];

  if (!selectedPredictions || selectedPredictions.length !== horizon) {
    throw new Error("The selected model failed to produce the requested horizon. Try a shorter horizon or another target column.");
  }

  const residuals = residualsByModel[best.id] || [];
  const lowerResidual = residuals.length >= 5 ? quantile(residuals, 0.1) : -1.2816 * best.rmse;
  const upperResidual = residuals.length >= 5 ? quantile(residuals, 0.9) : 1.2816 * best.rmse;
  const futureLabels = makeFutureLabels(observations, horizon);
  const forecastPoints: ForecastPoint[] = selectedPredictions.map((prediction, index) => {
    const modelPredictions: Record<string, number> = {};
    for (const id of baseIds) modelPredictions[id] = finalBasePredictions[id][index];
    modelPredictions.adaptive_ensemble = finalEnsemblePredictions[index];
    return {
      step: index + 1,
      timestamp: futureLabels[index],
      yHat: prediction,
      lower80: prediction + lowerResidual,
      upper80: prediction + upperResidual,
      modelPredictions,
    };
  });

  return {
    bestModelId: best.id,
    bestModelName: best.name,
    metrics,
    forecastPoints,
    folds: foldSummaries,
    ensembleWeights,
    maseScale,
    validationOrigins: origins.length,
    validationPredictions: actualByModel[best.id].length,
    selectedResiduals: residuals,
  };
}

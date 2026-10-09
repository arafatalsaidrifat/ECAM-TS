export type ForecastStrategy = 'naive' | 'seasonal_naive' | 'moving_average' | 'drift' | 'equal_weight';
export type ForecastMetric = {
  strategy: ForecastStrategy;
  name: string;
  mae: number;
  rmse: number;
  mase: number | null;
  folds: number;
  points: number;
  holdoutMae: number;
  holdoutRmse: number;
  holdoutMase: number | null;
  holdoutPoints: number;
};
export type ForecastStudy = {
  metrics: ForecastMetric[];
  selectedStrategy: ForecastStrategy;
  holdoutActual: number[];
  holdoutPredictions: Record<ForecastStrategy, number[]>;
  futureForecast: number[];
  cvOrigins: number[];
  holdoutSize: number;
  developmentSize: number;
  selectionMetric: 'MAE';
};

export const STRATEGIES: Array<{ id: ForecastStrategy; name: string; description: string }> = [
  { id: 'naive', name: 'Naive', description: 'Repeats the latest value.' },
  { id: 'seasonal_naive', name: 'Seasonal naive', description: 'Repeats the last observed seasonal cycle.' },
  { id: 'moving_average', name: 'Moving average', description: 'Repeats a trailing mean.' },
  { id: 'drift', name: 'Drift', description: 'Extends the historical average slope.' },
  { id: 'equal_weight', name: 'Equal-weight ensemble', description: 'Averages the four simple baselines.' },
];

export function forecastSeries(history: number[], horizon: number, strategy: ForecastStrategy, period: number): number[] {
  if (!history.length) throw new Error('No numeric observations to forecast.');
  if (!Number.isInteger(horizon) || horizon < 1) throw new Error('Forecast horizon must be a positive integer.');
  if (!Number.isInteger(period) || period < 1) throw new Error('Seasonal period must be a positive integer.');
  const n = history.length;
  const last = history[n - 1];
  const naive = Array.from({ length: horizon }, () => last);
  const seasonal = Array.from({ length: horizon }, (_, i) => n >= period && period > 1 ? history[n - period + (i % period)] : last);
  const window = Math.max(1, Math.min(n, period > 1 ? period : 7));
  const movingMean = history.slice(-window).reduce((sum, value) => sum + value, 0) / window;
  const moving = Array.from({ length: horizon }, () => movingMean);
  const slope = n > 1 ? (last - history[0]) / (n - 1) : 0;
  const drift = Array.from({ length: horizon }, (_, i) => last + slope * (i + 1));
  if (strategy === 'naive') return naive;
  if (strategy === 'seasonal_naive') return seasonal;
  if (strategy === 'moving_average') return moving;
  if (strategy === 'drift') return drift;
  return naive.map((_, i) => (naive[i] + seasonal[i] + moving[i] + drift[i]) / 4);
}

function score(actual: number[], predicted: number[], train: number[], period: number) {
  const errors = actual.map((value, index) => value - predicted[index]);
  const mae = errors.reduce((sum, error) => sum + Math.abs(error), 0) / Math.max(1, errors.length);
  const rmse = Math.sqrt(errors.reduce((sum, error) => sum + error * error, 0) / Math.max(1, errors.length));
  const seasonalDiffs = period > 1 && train.length > period
    ? train.slice(period).map((value, index) => Math.abs(value - train[index]))
    : train.slice(1).map((value, index) => Math.abs(value - train[index]));
  const scale = seasonalDiffs.length ? seasonalDiffs.reduce((sum, value) => sum + value, 0) / seasonalDiffs.length : 0;
  return { mae, rmse, mase: scale > 0 ? mae / scale : null, points: actual.length };
}

/**
 * Selects the method using expanding-window rolling-origin MAE on development data.
 * The final horizon is held out from model selection and evaluated once after selection.
 */
export function runForecastStudy(values: number[], horizon: number, period: number, maxFolds = 8): ForecastStudy {
  if (values.some(value => !Number.isFinite(value))) throw new Error('Series contains non-finite values; clean missing targets before evaluation.');
  if (!Number.isInteger(horizon) || horizon < 1 || !Number.isInteger(period) || period < 1) throw new Error('Horizon and seasonal period must be positive integers.');
  const holdoutSize = horizon;
  const developmentSize = values.length - holdoutSize;
  // Require a full seasonal cycle in every training fold when seasonality is enabled.
  // The final horizon is separate, so development needs two additional validation windows.
  const minimumTrain = Math.max(8, period > 1 ? period : 8);
  const minimumRows = minimumTrain + horizon * 3;
  if (values.length < minimumRows) {
    throw new Error(`Not enough observations for this setup. Need at least ${minimumRows} valid rows for a ${horizon}-step horizon, seasonal period ${period}, two non-overlapping validation folds and a separate final holdout; currently have ${values.length}. Reduce the horizon/seasonal period or load more observations.`);
  }
  const development = values.slice(0, developmentSize);
  const holdoutActual = values.slice(developmentSize);
  const latestOrigin = development.length - horizon;
  const earliestOrigin = minimumTrain;
  const origins: number[] = [];
  // Each fold validates the next horizon-sized block; validation windows cannot overlap.
  for (let origin = earliestOrigin; origin <= latestOrigin && origins.length < maxFolds; origin += horizon) origins.push(origin);
  if (origins.length < 2) {
    throw new Error(`Could not form two non-overlapping validation folds. Need at least ${minimumRows} valid observations for the current horizon and seasonal period.`);
  }

  const cvByStrategy = new Map<ForecastStrategy, { actual: number[]; predicted: number[]; scales: Array<number | null> }>();
  for (const method of STRATEGIES) {
    const actualAll: number[] = [];
    const predictedAll: number[] = [];
    const scaled: Array<number | null> = [];
    for (const origin of origins) {
      const train = development.slice(0, origin);
      const actual = development.slice(origin, origin + horizon);
      const predicted = forecastSeries(train, actual.length, method.id, period);
      actualAll.push(...actual);
      predictedAll.push(...predicted);
      const part = score(actual, predicted, train, period);
      scaled.push(part.mase);
    }
    cvByStrategy.set(method.id, { actual: actualAll, predicted: predictedAll, scales: scaled });
  }
  const cvScores = STRATEGIES.map(method => {
    const result = cvByStrategy.get(method.id)!;
    const s = score(result.actual, result.predicted, development.slice(0, earliestOrigin), period);
    return { strategy: method.id, name: method.name, mae: s.mae, rmse: s.rmse, mase: result.scales.some(v => v !== null) ? result.scales.filter((v): v is number => v !== null).reduce((sum, v) => sum + v, 0) / result.scales.filter((v): v is number => v !== null).length : null, folds: origins.length, points: result.actual.length };
  }).sort((a, b) => a.mae - b.mae);
  const selectedStrategy = cvScores[0].strategy;
  const holdoutPredictions = Object.fromEntries(STRATEGIES.map(method => [method.id, forecastSeries(development, holdoutSize, method.id, period)])) as Record<ForecastStrategy, number[]>;
  const metrics: ForecastMetric[] = cvScores.map(row => {
    const holdout = score(holdoutActual, holdoutPredictions[row.strategy], development, period);
    return { ...row, holdoutMae: holdout.mae, holdoutRmse: holdout.rmse, holdoutMase: holdout.mase, holdoutPoints: holdout.points };
  });
  return {
    metrics,
    selectedStrategy,
    holdoutActual,
    holdoutPredictions,
    futureForecast: forecastSeries(values, horizon, selectedStrategy, period),
    cvOrigins: origins,
    holdoutSize,
    developmentSize,
    selectionMetric: 'MAE',
  };
}

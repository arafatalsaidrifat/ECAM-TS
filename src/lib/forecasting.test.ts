import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { forecastSeries, runForecastStudy } from './forecasting';

test('naive forecasts repeat the latest observed value', () => {
  assert.deepEqual(forecastSeries([2, 4, 7], 3, 'naive', 1), [7, 7, 7]);
});

test('seasonal naive repeats the last complete seasonal cycle', () => {
  assert.deepEqual(forecastSeries([1, 2, 3, 4, 5, 6], 4, 'seasonal_naive', 3), [4, 5, 6, 4]);
});

test('study keeps a final horizon separate from model selection', () => {
  const values = Array.from({ length: 120 }, (_, i) => 20 + Math.sin(i * 2 * Math.PI / 7) * 4 + i * 0.1);
  const study = runForecastStudy(values, 7, 7);
  assert.equal(study.holdoutActual.length, 7);
  assert.equal(study.futureForecast.length, 7);
  assert.ok(study.cvOrigins.length >= 2);
  assert.ok(study.developmentSize + study.holdoutSize === values.length);
  assert.ok(study.metrics.every(row => Number.isFinite(row.mae) && Number.isFinite(row.holdoutMae)));
});

test('study rejects insufficient history rather than reporting misleading scores', () => {
  assert.throws(() => runForecastStudy([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, 1), /Not enough data/);
});

test('study rejects non-finite target values', () => {
  assert.throws(() => runForecastStudy([1, 2, Number.NaN, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 2, 1), /non-finite/);
});

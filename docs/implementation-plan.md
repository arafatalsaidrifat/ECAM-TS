# ECAM-TS implementation and research protocol

## Current status
ECAM-TS is a research workbench prototype. The legacy scenario charts, fixed leaderboard numbers, routing weights, operational impacts and stress tests still come from a simulator/static mock values. They are for interface exploration and committee-defense discussion only; they are not measured model results.

The Real Data Intake & Backtest view is the only path that currently evaluates a user-loaded source series. It supports NASA POWER daily weather observations for the documented Dhaka grid point and CSV imports for other series.

## Scientific pipeline implemented in this iteration
1. Import source CSV or fetch NASA POWER data, retain source URL/retrieval time and expose target/timestamp audits.
2. Require timestamp uniqueness and parseability when a timestamp is selected; do not silently deduplicate or impute missing targets.
3. Define a single numeric target, forecast horizon and seasonal period.
4. Split the last forecast horizon into an untouched chronological holdout.
5. Select among five transparent baselines using expanding-window rolling-origin MAE on development data only.
6. Score each baseline on the held-out horizon separately; the holdout scores must not determine the selected strategy.
7. Fit the selected baseline on all observed values for the operational next-horizon forecast and export forecasts with selection metric, fold count, holdout size, source label and retrieval timestamp.
8. Unit tests cover naive/seasonal forecasts, final holdout separation, insufficient data and non-finite target rejection. CI should run type-check, tests and production build.

This is a reproducible baseline protocol, not yet a fully validated ECAM-TS paper pipeline. The holdout is one horizon long and its uncertainty is high; use repeated outer rolling-origin evaluation across multiple time periods and datasets before drawing research conclusions.

## Next scientific milestones
### A. Freeze dataset specifications
For each domain, record exact version/hash, license, geography, units, native cadence, timezone, missing/sentinel codes, revision policy, forecast target, forecast origin, horizon, feature availability times and aggregation rules. Preserve immutable raw files; transformations must be scripted and versioned.

### B. Pre-register the evaluation protocol
Set train/validation/test dates, forecast horizons, seasonal periods, model families, metrics, seeds, retraining policy, ablations and statistical comparisons before examining the final test results. No random shuffling for temporal forecasting. Use the same origins and horizons for every eligible model.

### C. Implement actual model adapters
Add seasonal naive, ETS/ARIMA, LightGBM/XGBoost with fold-local lag/calendar features, and pinned Chronos-2/TimesFM/Moirai adapters where licenses, compute, runtime and input-frequency assumptions permit. Record model version, checkpoint, parameters, runtime, failures and dependency versions. Do not represent an unimplemented model as a measured score.

### D. Feature and leakage discipline
At every origin, only use fields that would have been available at that issue time. Fit imputation, scaling, feature selection and hyperparameter search within training folds. Weather covariates for past electricity forecasts must be archived forecasts available at the origin, not realized future weather. Event/festival calendars must be versioned and known in advance.

### E. Evaluation and uncertainty
Report MAE, RMSE and MASE with scale definitions; report per-horizon and per-regime results, fold-level scores, naive-baseline skill, runtime and failure rates. Add probabilistic forecasts only with documented quantile/interval calibration and pinball loss/coverage/CRPS implementation. Do not derive CRPS from MAE or label arbitrary bands as calibrated intervals.

### F. Adaptive routing novelty
Generate out-of-fold predictions for each candidate model at the same forecast origins. Train the router only on these out-of-fold predictions and past-available context features. Compare equal weights, best single model, static validation-weighted ensemble, and learned router on outer held-out origins. Tune router complexity only inside inner folds. Report per-domain/per-regime performance, calibration of model selection, confidence intervals and paired tests. Avoid claiming novelty until the related-work table establishes it.

### G. Production readiness
Move large data processing and model inference from browser memory to a versioned backend job system. Add dataset/experiment persistence, job status, idempotent runs, cancellation, artifact storage, access control, rate limits, request validation, structured logs, monitoring, reproducible container builds, secret management and documented restore procedures. Pin dependencies and use a lockfile; add security scanning and CI for unit/integration/e2e tests.

## What is deliberately not claimed
- No full ECAM-TS router has been trained.
- No tree-based or foundation model has been evaluated by this UI yet.
- No multi-dataset replication, calibrated probabilistic forecasts, formal significance tests, or operational deployment has been completed.
- A passing TypeScript build and unit tests verify code paths, not the scientific validity of the research hypothesis.

## References
- Hyndman & Athanasopoulos, Forecasting: Principles and Practice, forecast accuracy and time-series cross-validation: https://otexts.robjhyndman.com/fpp3/accuracy.html
- Cerqueira et al. (2022), Forecast evaluation for data scientists: common pitfalls and best practices: https://doi.org/10.1007/s10618-022-00894-5
- NASA POWER daily API documentation: https://power.larc.nasa.gov/docs/services/api/temporal/daily/

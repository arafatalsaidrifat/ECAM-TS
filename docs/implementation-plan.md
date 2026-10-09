# ECAM-TS implementation and research protocol

## Current code reality
The original GitHub app is a scenario simulator with a synthetic series generator in \`src/data/simulationEngine.ts\`, static model metrics in \`src/data/datasets.ts\`, and heuristic routing weights. Those modules are useful for UI/defense demonstrations but are not measured experimental results. The new Data Intake Lab is an isolated real-data path; it does not silently feed uploaded data into the existing synthetic scenario screens.

## What is implemented in this change
- A dedicated Data Intake Lab view with an actual NASA POWER Daily API connector fixed to the Dhaka point and CSV import for user-downloaded source files.
- Target/timestamp selection, counts for invalid target values and timestamp problems, duplicate detection, cadence inference, source URL/retrieval metadata, and exportable forecast rows.
- Five transparent reference strategies: naive, seasonal naive, trailing moving average, drift, equal-weight mean.
- Multi-fold chronological evaluation, with non-overlapping forecast windows where data volume permits, scored by MAE, RMSE and MASE. These folds are a first-pass utility, not the preregistered paper experiment.
- Motion for React transitions and clear status notices.
- Repository notices that current scenario outputs, router weights and the fixed leaderboard table remain synthetic/static until connected to actual files and benchmark jobs.

## Data acquisition decisions
1. **Hourly electricity:** use the public Mendeley Data record and download its CSV through the source page. Version 1 is dated 30 March 2026, describes records from April 2015 through March 2026 and includes national generation, recorded demand and estimated load-shedding fields. Confirm columns, time zone, license and data corrections in the exact downloaded file. Do not equate recorded demand with latent demand under outages; do not add load-shedding unless the meaning and units support it. https://data.mendeley.com/datasets/vpk8spw2mm/1
2. **Food prices:** use a pinned version of the World Bank monthly market/product panel. The catalog says 110 Bangladesh markets, spans Jan 2007–Sep 2026 on the 2026-09-28 snapshot and is updated/revised; a newer snapshot may now be published. Store the exact version and file checksum; modeled estimates and ML-assisted imputation are part of the data definition. https://microdata.worldbank.org/catalog/6164/data-api
3. **Weather:** the server endpoint queries NASA POWER daily point data for 23.8103 N, 90.4125 E, returning T2M, T2M_MAX, T2M_MIN and PRECTOTCORR for a date range. NASA POWER describes analysis-ready gridded/reanalysis data; it is not a BMD station record. https://power.larc.nasa.gov/docs/services/api/temporal/daily/
4. **External stress test:** UCI Air Quality is an Italian 2004–2005 sensor series with substantial missingness; do not use it to support Dhaka claims.
5. **Hydrology:** keep river/gauge levels as a conditional extension until a reproducible historical file, metadata and license are verified.

## Evaluation protocol required for the paper
- Define each task as target + unit + site/market + sampling frequency + issue time + horizon + available covariates.
- Keep hourly energy, monthly food prices and daily weather as independent targets at their native frequencies.
- Freeze exact source versions and a final chronological holdout. Use expanding/rolling validation inside the training block; no random shuffle.
- Fit imputation, scaling, transforms and feature engineering on each training fold only. At each issue time, use only history and exogenous values genuinely available by that time.
- Compare persistence/naive and seasonal-naive, ETS/ARIMA/Theta, and a properly tuned lag/covariate tree model before adding pretrained models.
- Add pinned, licensed and versioned Chronos-2, TimesFM, and Moirai/Uni2TS adapters where input length, future covariate support, hardware and output distributions are compatible.
- Compare best single model, equal-weight mean, regularized stacking and then FFORMA-style routing. Meta-training must use out-of-fold base predictions; keep the final block untouched until selection is frozen.
- Report MAE/RMSE in native units; MASE with the seasonal scaling denominator specified. Report CRPS/quantile loss only when comparable predictive distributions exist; report compute/runtime and uncertainty.
- Pre-register separate lead-up, holiday, post-event recovery, Durga Puja, evening peak and extreme-weather windows. Event effects are hypotheses; a raw difference is not causal evidence.

## Novelty guardrail
Do not claim ECAM-TS is the first adaptive router for time-series foundation models. TimeRouter (arXiv preprint posted 10 June 2026) explicitly studies efficient routing among pretrained TSFMs, selective gating and ensemble fallback. A defensible contribution must emerge from a systematic literature review and could focus more narrowly on leakage-safe Bangladesh-relevant multi-domain evaluation and versioned local event-window ablations. https://arxiv.org/abs/2606.11625

## Next milestones
1. Download and audit the selected Mendeley and World Bank files; persist data cards and SHA256 checksums.
2. Add ingestion/normalization to an experiment store, with documented corrections, timezone handling, market/product grouping and panel-aware splits.
3. Add classical statistical and tree-based adapters with consistent rolling-origin code; store every forecast row and model version.
4. Add foundation-model adapters and compatibility tests; don't fetch model weights from a page render.
5. Implement OOF forecast storage and train constrained stackers/FFORMA-style routers only when enough independent series/origins exist.
6. Add experiment persistence, background jobs, authentication/authorization, upload quotas, monitoring, backups and production CORS before a public deployment.

## Source and runtime notes
- Motion for React is installed as \`motion\`; import from \`motion/react\`. Respect reduced-motion settings.
- The Data Intake Lab fetches NASA POWER through the existing Express server to avoid browser CORS issues; its CSV path runs in the browser session and doesn't upload the source file to a server.
- No external foundation-model weights are loaded by the lab.


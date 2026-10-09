# ECAM-TS Research Workbench

This repository is an interactive research prototype for **Event- and Context-Aware Adaptive Model Selection for Multi-Domain Time-Series Forecasting**.

## Important data-integrity status
The original dashboard views (historical scenario plots, fixed model leaderboard numbers, router weights, stress tests and operational summaries) are still generated using the scenario simulator and static mock-up metrics. They are suitable for interface/defense demonstrations only. They are **not** validated forecasts or research results and must not be cited as model performance on Bangladesh data.

Use the new **Real Data Intake & Backtest** tab to fetch NASA POWER daily observations for the Dhaka study point or load an original CSV downloaded from the electricity/food-price source record. This module runs a separate chronological baseline comparison on the loaded values. It does not silently connect those observations to the synthetic screens.

## Run locally
Requires Node.js/npm and a server-side Gemini API key only for the AI committee-defense endpoint.

1. Install dependencies with \`npm install\`.
2. Copy \`.env.example\` to a local environment file and set \`GEMINI_API_KEY\` server-side if you use defense inquiries.
3. Start with \`npm run dev\`.
4. Open the local URL printed in the terminal (the Express/Vite server is usually on port 3000).

## Real Data Intake & Backtest
- Fetches daily T2M, T2M_MAX, T2M_MIN and PRECTOTCORR from NASA POWER at 23.8103° N, 90.4125° E through \`GET /api/datasets/nasa-power\`.
- Or import a CSV (up to 50 MB) from the original source files in the browser; uploaded bytes are not sent to a server.
- Select the numeric target and timestamp column, inspect missing/invalid rows, timestamp parse failures, duplicates, start/end, and inferred cadence.
- The backtest compares naive, seasonal naive, trailing moving average, drift and equal-weight averaging across chronological folds and reports MAE/RMSE/MASE. It exports forecasts as CSV.
- The current module is a first-pass baseline utility, not the final paper protocol. It does not fit tree-based models, TimesFM, Chronos-2, Moirai or the FFORMA meta-router; it does not calibrate prediction intervals or compute CRPS.

## Proposal-aligned dataset sources
1. **Bangladesh hourly electricity:** [Mendeley Data, version 1](https://data.mendeley.com/datasets/vpk8spw2mm/1), DOI 10.17632/vpk8spw2mm.1, described as April 2015–March 2026 with ~92,000+ hourly records and CC BY 4.0. Contributors: Md Ibrahim Shekh and Rakibul Hasan Rafi. The \`demand_mw\` field is recorded consumption and can be supply-censored during load shedding. Do not add \`load_shedding\` to demand unless the source definitions and units support it.
2. **Bangladesh monthly food prices:** [World Bank Microdata catalog / data API](https://microdata.worldbank.org/catalog/6164/data-api), 110 markets, modeled monthly price estimates. The exact snapshot can change weekly; record version, download time, row filters, file checksums and source terms before use. The proposal's 2026-09-28 snapshot is reproducible if that exact export is obtained; the live catalog now reports a newer 2026-10-05 version covering through 2026-10-01. Explicitly pin the snapshot used in each experiment.
3. **Daily weather:** [NASA POWER Daily API docs](https://power.larc.nasa.gov/docs/services/api/temporal/daily/). This tool fetches selected daily parameters at a point using a documented API; it is not a BMD station dataset. For operational energy forecast tests, actual future weather is not an available covariate at the historical forecast origin—use archived weather forecasts instead.
4. **External benchmark:** [UCI Air Quality](https://archive.ics.uci.edu/dataset/360/air+quality) is an Italian 2004–2005 sensor series with substantial missingness; do not use it to claim anything about Dhaka pollution.
5. **Conditional extension:** [Bangladesh Flood Forecasting and Warning Centre](https://ffwc.gov.bd/) for hydrology, subject to finding reproducible historical gauge exports and checking licensing/metadata.

## Required research protocol
- Keep hourly energy, daily weather and monthly food prices as separate native-frequency target tasks.
- Freeze dataset versions and a final chronological holdout before tuning. Use rolling/expanding origins within training data; never random-shuffle time series.
- Fit transformations, scalers, feature selection and imputers only on training folds. Every feature and weather covariate must be known at the historical forecast issue time.
- Compare transparent baselines and solid statistical/tree models before pretrained foundation models.
- Compare best-single and equal weights before regularized stacking/FFORMA-style routing. Train weights only on out-of-fold predictions and leave the final test block untouched.
- Pre-register pre-Eid lead-up, Eid holiday, post-event recovery, Durga Puja, evening peak and weather-extreme windows. These are hypotheses; raw event/non-event differences do not establish causality.
- Report MAE/RMSE in native units, MASE and its scaling lag, uncertainty and compute. Use CRPS/quantile loss only for comparable predictive distributions.

## Novelty caution
Do not claim that ECAM-TS is the first adaptive routing framework for time-series foundation models. **TimeRouter**, a 2026 arXiv preprint, already studies adaptive routing among pretrained TSFMs, selective gating and ensemble fallback: https://arxiv.org/abs/2606.11625. Build the novelty statement after a systematic related-work review. A potentially narrower contribution is an independently audited Bangladesh-relevant multi-domain benchmark plus leakage-safe event-window ablations—but that remains a research hypothesis until tested.

## Software status
- React + TypeScript + Vite, Tailwind CSS 4, Motion for React (\`motion/react\`) and Lucide.
- Existing scenario modules continue to use synthetic data; the top-level notice labels them as such.
- Real-data intake has one live source connector (NASA POWER) and local CSV import.
- The app does not yet have persisted experiment records, authentication, background jobs, model weights for TSFMs, food-price live ingestion, model-serving hardware or deployment hardening.


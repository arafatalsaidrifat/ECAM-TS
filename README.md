# ECAM-TS — Real-data rolling forecast workbench

ECAM-TS is a research prototype for event/context-aware, multi-domain time-series forecasting. The default **Real CSV Forecast Lab** is the empirical workflow; preset event scenarios in the other legacy panels are simulations for conceptual demonstration and must not be cited as measured experimental results.

## Run locally

- Node.js compatible with package.json
- Install dependencies: npm install
- Start the development server: npm run dev
- Build the frontend: npm run build
- Type-check: npm run lint

## CSV workflow

1. Upload a UTF-8 CSV with a header row. Files are parsed inside the browser; the CSV is not sent to the app server.
2. Select a timestamp column (or use row order) and a numeric target.
3. Verify timestamps, duplicates, gaps, the seasonal period m, and the target's native unit.
4. Set the forecast horizon, rolling folds, and initial training-window fraction, then run the evaluation.
5. Compare candidates on the same chronological rolling origins and download the future forecast CSV.

## Current local engine

The current CPU-friendly implementation compares:

- Last-value naive.
- Seasonal naive (when m > 1).
- Robust damped trend.
- Ridge autoregression with a short-history fallback.
- ECAM adaptive inverse-error ensemble, whose fold weights use errors from earlier folds only.

Metrics include MAE, RMSE, MASE, and WAPE. The top-ranked candidate is selected by rolling-validation MAE for the requested dataset and horizon. An empirical 10th–90th residual band is shown as a practical interval estimate; it is not a guarantee of 80% coverage.

## Important limits

- A model that wins a validation setup is not guaranteed to be the best on another series or future period. Keep an untouched final chronological holdout for a research paper.
- Irregular timestamps, missing target values, and duplicates affect interpretation. The interface reports these issues and blocks duplicate-time evaluation; users must verify cadence before treating row offsets as hours/days.
- The browser engine does not currently execute pretrained TimesFM, Chronos, Moirai, or Time-MoE checkpoints, nor does it claim FFORMA training. Those remain integration candidates that require pinned versions, compatible inference adapters, and further fair rolling-origin evaluation.
- No benchmark table in a preset-scenario panel should be reported as empirical CSV performance. Forecast and festival-effect claims must be computed on an identified, licensed dataset.
- Weather, macroeconomic releases, and festival variables should only be used when they were known at the forecast origin. The first implemented CSV engine is univariate; covariate-aware modeling is an explicit next step.

## Research protocol

Use rolling/expanding origins, fit every transform using past-only data, use identical origins/horizons across candidates, report metric units and uncertainty, and freeze a separate final holdout before any publication-level claims. See the ECAM-TS proposal for the multi-domain data registry, festival feature plan, data cards, and risk register.

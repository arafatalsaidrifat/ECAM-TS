# Next milestones for ECAM-TS

## Milestone A — Establish reproducible source snapshots
Download the public electricity CSV from Mendeley Data and the chosen date-version of the World Bank food-price dataset. Store raw files read-only with source URL, retrieval timestamp, terms, data version, file SHA-256, row count, target/units dictionary and time-zone note. The NASA POWER connector logs the exact query URL, requested coordinates, requested period, retrieval timestamp and caveats; save each JSON response as a source artifact for reproducibility.

## Milestone B — Data contracts
A task configuration must declare (1) target column and unit, (2) geographical/market unit, (3) native cadence, (4) prediction issue time and horizon, (5) allowed covariates and their historical availability, and (6) seasonal scaling period. For panel data, group by market/product first; never concatenate food prices with hourly energy as if they were one target.

## Milestone C — Validation and baselines
The initial Data Intake Lab performs source structure checks and an exploratory rolling-origin baseline comparison. Next implement a shared evaluation package that stores per-origin predictions and actuals, preserves fold boundaries, reports MAE/RMSE/MASE by horizon and domain, and uses one untouched chronological test block. Add ETS/SARIMA/Theta and leakage-safe LightGBM/XGBoost lag-feature models before TSFMs.

## Milestone D — Event/context analysis
Source/version official Ramadan/Eid/national holiday/Durga Puja calendars. Pre-register event lead-up, event-day, recovery, evening peak, temperature and rainfall strata. Compare a matched model with/without context, report event episodes by year, block-bootstrap uncertainty, and avoid causal language without a credible identification strategy.

## Milestone E — Foundation models and routing
Add pinned Chronos-2, TimesFM and Moirai adapters with API/license/hardware compatibility tests. Record checkpoint hashes and runtime. Generate out-of-fold predictions from each candidate, then compare best-single, equal weight, regularized stacking and FFORMA-style feature routing. The router is a hypothesis and should be kept only if it generalizes on held-out time blocks/series.

## Milestone F — Productization
Persist dataset cards, source artifacts, environment lockfile, experiment configs/results and model metadata. Add job queues for slow jobs, signed artifact exports, authentication/authorization, upload quotas, audit logs, backups, rate limits, monitoring and deployment-specific CORS before a public deployment.

## Main engineering cautions
- Recorded power demand may be lower than latent demand during load shedding; don't reconstruct it by addition unless compatible definitions and units are verified.
- NASA POWER values are gridded/reanalysis-derived rather than BMD station measurements.
- The World Bank real-time food-price series is modeled/imputed and revised; snapshot version is part of the experiment.
- Current source simulator metrics and routing outputs are not empirical evidence.

## Immediate UI and repository polish completed

- Added a searchable **Data sources** page covering the four current research domains and cross-domain benchmarks.
- Source states distinguish the implemented NASA POWER request route from source candidates, manual downloads, and benchmarks. The UI explains what must be verified for each provider.
- Replaced “live data path” language on the synthetic hero visualization, marked static leaderboard values as illustrative placeholders, and reframed scenario actions as simulation-only.
- Added regression coverage for the source registry categories and exact domain accent palette.
- Recorded the full project requirements in `docs/ECAM_TS_MASTER_SPECIFICATION.md`.

## Next executable milestone (keep the research honest)
1. Test the NASA POWER route against a small date range, then persist the successful response as a fixture with query URL, retrieval timestamp, and SHA-256. Treat a provider outage as a visible failure, not a build failure.
2. Add an in-repository small synthetic CSV fixture strictly for smoke tests, labeled synthetic; it must never be mixed with local empirical evidence.
3. Refactor the five browser-baseline strategies behind a shared evaluation contract and export per-fold origins/predictions in addition to summary metrics.
4. Add statistical baselines and one supervised tree model in the research Python/Colab path. Run a leakage-specific test with identical origin/horizon information for every candidate.
5. Add the first compatible foundation-model adapter only after package/checkpoint/license/hardware compatibility is documented, then keep its results out of the legacy static leaderboard until measured on the same folds.
6. Implement the learned router using out-of-fold forecasts; compare best-single, equal-weight average, regularized stacking, and context-aware routing on outer holdouts.
7. Add residual monitoring and champion/challenger promotion gates only after forecasts are persisted with versioned data/model metadata.

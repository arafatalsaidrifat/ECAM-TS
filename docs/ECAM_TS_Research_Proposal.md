# ECAM-TS — Research Proposal Structure
**Planning edition · 9 October 2026 · For supervisor review**

> **Status:** Proposed study, not a report of completed experiments. Candidate datasets, terms, source access, literature novelty and all performance claims must be checked before the protocol is frozen.

## Working title
**ECAM-TS: Event- and Context-Aware Adaptive Model Selection for Multi-Domain Time-Series Forecasting**

## Executive summary
This study evaluates when individual forecasting models, equal-weight averaging, regularized stacking and feature-conditioned forecast weighting generalize best across selected Bangladesh-relevant time-series tasks. The primary candidate is hourly electricity data with known calendar/event context. A separate monthly food-price task is a transfer experiment only if its observation file, definitions, revisions and license pass the data audit.

The goal is not to assume one model wins. FFORMA and other existing methods are comparators, not claimed inventions. The contribution must be narrowed to what the literature review and leakage-safe evaluation support.

## 1. Background and motivation
Time series can contain trend, seasonality, autocorrelation, missing values, outliers, structural breaks and effects from known future covariates. Electricity load is typically hourly with daily and weekly rhythms. Food-price estimates are lower-frequency, market-specific and may be revised. Their units and data-generating processes must not be pooled as if they were one target.

For electricity, recorded demand may be censored during load shedding. Recorded demand, generation and latent demand are distinct quantities and must not be treated as interchangeable without compatible definitions and units.

## 2. Problem statement
Forecasting methods vary by domain, frequency, horizon and available context. Forecast combinations can improve robustness, but learned weights can overfit and fail to outperform simple averaging. Pretrained time-series models also vary in their performance, input constraints, covariate support, license and compute requirements. A controlled local comparison is needed to test whether event/calendar context adds value beyond strong baselines.

## 3. Aim and objectives
**Aim:** Evaluate when adaptive forecast combination and known context improve forecasting performance across selected Bangladesh-relevant time-series tasks.

- Audit source files, documentation, licenses/terms, cadence, missingness, revisions, units and target definitions.
- Build a reusable, versioned pipeline with chronological splits and rolling-origin evaluation.
- Compare statistical, supervised, pretrained and combination approaches where feasible.
- Isolate the incremental contribution of known calendar/event context through matched ablations.
- Report error, uncertainty, limitations and reproducible artifacts honestly.

## 4. Research questions
1. Which baseline and candidate model families perform reliably for the selected task and horizon?
2. Does equal-weight averaging or a learned combiner generalize better than the best individual model?
3. Does known calendar/event context improve combination weights beyond non-contextual routing?
4. Do any observed gains persist across held-out periods and, if feasible, a distinct domain?

## 5. Provisional hypotheses
- H1: Relative model performance varies across forecast origins, regimes and domains.
- H2: A combination method may improve robustness over a single model, but is not assumed to win.
- H3: Context features may improve some event-related periods; their incremental benefit must be measured against a matched no-context system.
- H4: Any gain may shrink or disappear under strict chronological evaluation, ablation or cross-period testing.

## 6. Conceptual framework
**Data audit → time-safe features → candidate forecasts → out-of-fold prediction matrix → combination/router → chronological evaluation → error and uncertainty analysis.**

Candidate context includes calendar and event indicators known at the forecast origin. Realized future weather or revised data unavailable at issue time must not leak into the input. Event associations alone do not establish causality.

## 7. Dataset plan and data-access gate
### Primary candidate: Bangladesh hourly electricity
Mendeley Data record: https://data.mendeley.com/datasets/vpk8spw2mm/1

Download and inspect the actual observation file. Confirm target meaning, unit, timezone, sampling cadence, missingness, load-shedding implications, revision/version, redistribution terms and SHA-256 checksum before use.

### Optional transfer task: Bangladesh food-price estimates
World Bank catalog/API entry: https://microdata.worldbank.org/catalog/6164/data-api

Confirm the actual extract is market/product/time observations—not a catalog details or summary row. Record market and product identifiers, currency/units, frequency, start/end dates, imputation/revision notes and terms. Analyze separate market-product series; do not collapse incompatible items into a single target.

### Dataset audit checklist
- Exact source URL, retrieval date, source version/DOI and checksum.
- Actual file/API response obtained and schema inspected.
- License/terms and redistribution status recorded.
- Timestamp timezone, cadence, units and target semantics confirmed.
- Missingness, duplicate timestamps, outliers, publication lag and revisions quantified.
- Future-known covariates separated from realized future observations.
- A fallback dataset activated if any critical data gate fails.

## 8. Methodology
### Baselines and candidate models
Start with naive, seasonal-naive, drift, moving average and equal-weight combinations. Add ETS/Theta and ARIMA/SARIMA where suitable, followed by leakage-safe LightGBM/XGBoost lag/calendar models. Evaluate only one or two pretrained models (for example Chronos, TimesFM or Moirai) after checking current interfaces, context support, checkpoint version, license and hardware.

### Combination methods
Compare best-single, equal-weight averaging, regularized stacking and a FFORMA-style feature-based combiner. Produce out-of-fold forecasts using chronological folds; never train a router on predictions generated from data that its training process has seen.

### Evaluation
Use expanding-window rolling-origin validation, multiple outer time blocks, an untouched final test block and repeated periods where data permit. Report MAE, RMSE and MASE by horizon/domain; add calibrated prediction intervals and appropriate probabilistic metrics only when implemented and validated. Report fold counts, forecast origins and uncertainty; do not select the winner using the final holdout.

## 9. Novelty and literature verification
Unsafe claim to avoid: “the first event-aware adaptive time-series forecasting system.” Event-aware load forecasting, meta-learning, forecast averaging and pretrained time-series models already exist.

**Provisional contribution to test:** a leakage-safe, Bangladesh-relevant empirical evaluation that isolates the incremental value of known calendar/event context in forecast-combination weights, compared with strong baselines on verified local data.

Falsification tests:
1. Find prior work already conditioning forecast-combination weights on event/calendar context.
2. Check whether the feature design is already standard in a directly comparable system.
3. Test whether context helps base models but not the combiner.
4. Test whether gains vanish under held-out years, outer rolling-origin evaluation or another dataset.
5. Check whether the number of independent series/events is too small to support a learned meta-model.

Search combinations of “event-aware forecast combination”, “context-aware model selection time series”, “holiday-aware ensemble load forecasting”, “calendar covariate FFORMA”, “adaptive ensemble electricity load Ramadan Eid” and “meta-learning forecasting exogenous variables”. Save query date, screening criteria, excluded near-matches and backward/forward citation checks. Verify venue rankings in the appropriate database and year; do not infer a CORE rank.

## 10. Risks, ethics and limitations
- Public data may omit operational covariates; forecasts cannot eliminate unobserved shocks.
- A single national series may not support broad claims about cross-series routing.
- Food-price estimates may be imputed/revised; version snapshots are part of the experiment.
- A predictive association around Ramadan/Eid is not proof of causation.
- Respect terms, cite providers and do not redistribute restricted files.
- A null result is a valid result; do not claim novelty or superiority without evidence.

## 11. Proposed 12-week schedule
1. Freeze scope and literature protocol; register candidate sources.
2. Download actual files, verify terms/targets, choose primary and fallback.
3. Clean data, inspect missingness/seasonality and implement chronological splits.
4. Implement seasonal-naive, ETS/ARIMA/Theta baselines.
5. Implement lag-feature tree model and known calendar features.
6. Generate leakage-safe out-of-fold forecasts and equal-weight ensemble.
7. Implement FFORMA-style feature-weighted combination.
8. Add event/context features to the meta-model.
9. Optional pretrained model and robustness tests.
10. Outer rolling-origin evaluation, ablations and statistical comparisons.
11. Error analysis, literature update and draft results.
12. Final report, code documentation, presentation and defense rehearsal.

## 12. Success criteria and supervisor decisions
Success means at least one verified dataset and complete data card; reproducible baseline results; fair comparison of at least four strategies; a context ablation that can show positive, neutral or negative effects; and transparent limitations/source citations.

Ask the supervisor to approve the title and scope, electricity target field, whether food-price transfer is required, minimum dataset count, compute limits, venue-ranking database and whether a careful empirical contribution is acceptable if no new algorithmic novelty is established.

## Core references and source entry points
- FFORMA, feature-based forecast model averaging: https://doi.org/10.1016/j.ijforecast.2019.02.011
- Forecast combinations review: https://arxiv.org/abs/2205.04216
- TimesFM: https://proceedings.mlr.press/v235/das24c.html
- Moirai: https://proceedings.mlr.press/v235/woo24a.html
- Chronos: https://arxiv.org/abs/2403.07815
- M4 Competition: https://doi.org/10.1016/j.ijforecast.2019.04.014
- Monash Forecasting Archive: https://forecastingdata.org/

**Document status:** Research planning structure, pending supervisor approval and source/literature verification. Replace this planning edition with the approved latest PDF when ready.

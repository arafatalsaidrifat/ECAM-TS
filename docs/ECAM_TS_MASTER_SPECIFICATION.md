# Master Prompt: ECAM-TS — Autonomous, Self-Improving, Multi-Domain Time-Series Forecasting and Decision-Support Platform
## Your role
Act as a senior time-series researcher, ML engineer, data engineer, MLOps architect, and product developer. Research the current technical landscape, inspect the existing ECAM-TS repository before editing anything, and then implement a realistic, testable version of the system described below. Prefer evidence, reproducibility, and a working vertical slice over a large collection of unfinished features.

## Mission
Build **ECAM-TS**, a multi-domain forecasting workbench that can discover and validate data sources, ingest time-series observations, run strong baseline and foundation models, select a model using leakage-free historical backtesting, produce calibrated forecasts where supported, explain the results in plain English, and continuously improve through a controlled evaluation-and-retraining loop.

The system must be understandable to both technical users and non-technical users. Explain what each model does, why it was selected, how accurate it has been on comparable historical forecasts, what remains uncertain, and which decisions the forecast can or cannot support.

Do not promise the “best accuracy,” guaranteed predictions, full autonomy, or automatic self-improvement before experiments demonstrate those capabilities. Use measured results and explicit limitations.

## 1. Existing project and implementation rules
1\. Begin by auditing the current repository, branch, files, tests, UI, forecasting functions, data-ingestion workflow, and any existing unfinished work. Preserve useful existing behavior and the four-domain interface. Do not replace the project with a separate throwaway demo.

2\. Provide a concise implementation plan, then make changes in small, coherent phases. Run the tests, type checks, lint/build commands that the repository actually supports, and relevant notebook or Python checks. Fix failures caused by your changes.

3\. Do not claim that a feature is implemented unless working code exists and it has been tested. Mark items honestly as **implemented**, **partially implemented**, **planned**, or **blocked by data/access/license/compute**.

4\. Reuse project conventions and dependencies where sensible. Pin or constrain model and library versions; document CPU/GPU needs, cache behavior, memory requirements, model weight licenses, and known incompatibilities.

5\. Keep secrets on the server or in environment variables. Never commit API keys or require private credentials for the baseline demo. Do not silently scrape sites where access or terms do not permit it.

6\. Make the MVP run with a small example dataset and simple baselines, even when a large model cannot download or a live source is unavailable. Optional heavyweight models must fail gracefully without preventing the rest of the application from working.

## 2. Domains and interface
Retain four dedicated domains. Each domain should have its own data connector status, dataset/source information, target units, forecast horizon defaults, quality checks, evaluation metrics, guidance rules, and clearly identifiable visual identity:

\- **Electricity and grid demand** — teal accents (\`#0d9488\`); show demand, supply, and load-shedding measures only when the data source provides them. Prioritize short-term load forecasting when a valid time-stamped historical series is available.

\- **Food and essential-commodity prices in Bangladesh** — amber accents (\`#b45309\`); identify commodity, market, geography, retail/wholesale/grower type, unit, and price frequency. Avoid blending incomparable markets or price units.

\- **Weather and climate indicators** — blue accents (\`#2563eb\`); distinguish observed weather, reanalysis, current forecast, and archived forecast-vintage data. These are not interchangeable.

\- **Air quality** — violet accents (\`#7c3aed\`); distinguish station measurements from gridded/model-derived estimates and forecasts. Display station/model and spatial-resolution details wherever available.

Use a responsive, professional research-workbench UI. Every domain should show: source freshness; data-quality status; target and horizon controls; historical series; forecast median or point estimate; prediction intervals when available; model comparison; backtest results; uncertainty; data provenance; and a readable report. Keep color coding consistent without sacrificing text contrast or accessibility.

## 3. Research before implementation
Conduct an up-to-date literature and technical review using peer-reviewed papers, recent preprints clearly labeled as preprints, official model repositories/model cards, official API documentation, and data-provider terms. Record publication/release dates and access dates. Cite every material non-obvious claim with a working source link.

Investigate at minimum:

\- Time-series foundation models, zero-shot forecasting, covariate-aware/multivariate forecasting, fine-tuning, and their limitations.

\- Classical/statistical and machine-learning baselines; learned model routing and constrained ensembling.

\- Rolling-origin/expanding-window evaluation; temporal data leakage; probabilistic forecast scoring and calibration.

\- Concept drift, residual monitoring, delayed labels, safe candidate promotion, and rollback.

\- Data lineage, source freshness, point-in-time feature availability, licenses, model-weight terms, and reproducibility.

\- Related systems and papers to determine whether the proposed contribution is genuinely novel.

Do not assume that a foundation model is superior simply because it is newer or larger. Do not repeat a benchmark leaderboard result as though it guarantees performance on Bangladesh data. Separate evidence from the literature, evidence from this project’s experiments, and untested hypotheses.

## 4. Data-source registry and live-data discovery
Build a **source registry** instead of hard-coding claims that every source has a stable real-time API. For each candidate source, record provider, URL, domain, target variables, geography, historical coverage, sampling frequency, last observed update, access method (API, download, or manual upload), authentication requirements, rate limits, license/terms, attribution requirements, schema, reliability, and last successful retrieval. Probe the source and save a small verified sample before marking it connected.

Start by investigating these source leads; verify actual access before depending on any one of them:

### Bangladesh-specific sources
\- Department of Agricultural Marketing (DAM) market-price reports: https://market.dam.gov.bd/commodity_wise_report?L=E . Its portal exposes commodity-wise, weekly, daily, and comparative reports. Determine whether data can be reliably downloaded in a machine-readable form. Do not describe a report page as an API unless an API is verified.

\- Bangladesh Bureau of Statistics (BBS), monthly price and wage/CPI releases: https://bbs.gov.bd/site/page/29b379ff-7bac-41d9-b321-e41929bab4a1 . Check the available Excel/PDF files, release calendar, revisions, and exact series definitions.

\- Power Grid Bangladesh demand, supply, and load-shedding records: https://erp.powergrid.gov.bd/web/generations/view_demand_supply_loadshed_bn . Verify historical completeness, time resolution, download/automation method, and units.

\- BPDB daily generation archive: https://misc.bpdb.gov.bd/daily-generation-archive . Treat daily archive files as daily data unless finer granularity is verified; do not infer an hourly series from daily totals.

### Weather and air-quality sources
\- Open-Meteo historical forecast API: https://open-meteo.com/en/docs/historical-forecast-api . Use forecast vintages archived at the prediction origin for realistic evaluations of weather as an exogenous variable.

\- Open-Meteo historical weather API: https://open-meteo.com/en/docs/historical-weather-api . Label historical reanalysis as observed/reanalysis context, not as an archived weather forecast.

\- Open-Meteo air-quality API: https://open-meteo.com/en/docs/air-quality-api . Verify pollutants, spatial/temporal resolution, geographic coverage, licensing, and the distinction between modeled estimates and station measurements.

\- OpenAQ API: https://docs.openaq.org/about/about . Check whether suitable measured stations and sufficiently recent PM2.5/PM10/NO2/O3/etc. observations exist for the selected Bangladeshi locations; coverage is not guaranteed everywhere.

### Benchmark datasets for method development
\- GIFT-Eval benchmark: https://github.com/SalesforceAIResearch/gift-eval

\- Monash Time Series Forecasting Repository: https://forecastingdata.org/

\- Investigate established electricity, traffic, weather, and long-term series benchmarks such as ECL/electricity, traffic, and ETT only after verifying source, license, train/test protocol, and the precise dataset version.

Maintain two separate evidence categories:

1\. **Operational data** that the application can refresh in practice.

2\. **Research benchmarks** used for reproducible model comparison.

A benchmark result must not be presented as a Bangladesh-specific finding. If a local source is download-only, unstable, incomplete, behind access controls, or legally unsuitable for automated retrieval, expose that limitation and offer a documented manual CSV/Parquet upload path rather than pretending live integration works.

## 5. Data ingestion, validation, and provenance
Implement a modular ingestion pipeline with:

\- Incremental retrieval, retries with backoff, request timeouts, rate-limit handling, caching, and provider-specific adapters.

\- Raw immutable snapshots and normalized/curated tables with timestamps, source ID, geographical/series identifiers, target name, units, frequency, timezone, retrieval time, publication/release time when known, data-vintage identifier, source URL, version, license/attribution, and checksum.

\- Duplicate timestamp detection, sorting, frequency inference, gaps, missing values, impossible values, unit changes, stale data, daylight-saving/time-zone issues, and abrupt structural changes.

\- A documented, domain-aware missing-data and anomaly policy. Do not automatically delete a genuine peak or fill long gaps without flagging the intervention. Preserve both raw and transformed values.

\- A data-quality report with severity, affected rows, selected repair, and whether the series is safe to forecast.

\- A CSV/Parquet import workflow with an explicit timestamp column, target column, optional ID/feature columns, frequency, timezone, units, and forecast horizon. Never select arbitrary numeric metadata as the target automatically.

\- Data and feature schemas, source adapters, and connectors that can be tested using local fixtures without network access.

The UI must distinguish **connected**, **stale**, **partial coverage**, **manual upload**, **unavailable**, and **license/permission not verified**. Show a last-updated timestamp and never label cached or historical data “real-time.”

## 6. Model pool and forecasting adapters
Use a common, well-defined model adapter interface for fit/forecast or zero-shot predict, probabilistic output when available, capability metadata, resource estimates, and structured errors. Start with a modest model pool; make extra models configurable rather than loading every model for every run.

### Mandatory baselines
\- Last-value/naive forecast.

\- Seasonal naive when the seasonal period is supported by enough history.

\- Drift baseline.

\- A simple moving-average or exponential-smoothing method.

\- One or more classical/statistical models such as AutoARIMA/ETS/Theta when appropriate.

### Supervised candidate
\- LightGBM or another suitable tree-based model with leakage-safe lag, rolling, calendar, event, and exogenous features. Add XGBoost only if dependency and compute costs justify it.

\- Support point and quantile forecasting where the model provides it. Fit preprocessing, imputation, transformations, feature selection, and tuning only within each training window.

### Foundation-model candidates to assess
\- Amazon Chronos family, including Chronos-2 where compatible: https://github.com/amazon-science/chronos-forecasting

\- Google TimesFM, including the current TimesFM 3.0 release where licensing and runtime permit: https://github.com/google-research/timesfm

\- Salesforce Uni2TS / Moirai family, including Moirai 2.0 where compatible: https://github.com/SalesforceAIResearch/uni2ts

\- Lag-Llama only as an optional candidate after confirming its maintained implementation, current model card, license, package compatibility, and compute needs.

For every candidate, document the exact checkpoint ID and revision, package version, model capabilities (univariate/multivariate, known future covariates, probabilistic outputs), context/horizon limits, compute and memory needs, supported device, license, and any usage restrictions. In particular, verify the current license for TimesFM 3.0 weights before any deployment or commercial use; do not assume source-code licensing automatically applies to all weights.

The router must only compare forecasts generated under the same information cutoff, target definition, frequency, forecast origins, and horizon. Support graceful fallback to baselines if a model cannot load or returns invalid output. Record errors and inference latency instead of silently excluding failed runs.

## 7. Feature engineering and external variables
Create reusable, frequency-aware feature builders. Candidate features may include past lags, rolling means/medians/standard deviations, exponentially weighted statistics, trend and volatility summaries, Fourier terms, calendar features, weekends, verified public holidays/festivals, and known events.

For exogenous factors, permit domain-specific variables such as archived weather forecasts for electricity demand, calendar/season/event effects for food prices, and weather covariates for air quality when evidence and temporal availability justify them. Keep a feature registry describing its calculation, units, source, event timestamp, publication/availability timestamp, and allowed forecast horizons.

Prevent target leakage and future-availability leakage. A variable timestamped to a month is not necessarily available at the start of that month. For each forecast origin, use only information that would really have been available then. Never use realized future weather in an operational forecast benchmark. If a “perfect future weather” test is useful, report it separately as a clearly labeled sensitivity experiment.

## 8. Reliable evaluation and fair comparison
Implement a shared rolling-origin/expanding-window backtesting engine. It must support multiple forecast origins, horizons, frequencies, and series. Save every origin, training cutoff, evaluation window, feature cutoff, model version, forecast, actual, and metric.

Rules:

1\. Never randomly shuffle chronological observations to make a forecasting train/test split.

2\. Use identical origins and horizons for all model candidates being compared. If the production task is a 24-step-ahead forecast, do not score one model using a series of teacher-forced one-step forecasts while scoring another on a single 24-step open-loop forecast.

3\. Decide explicitly whether the use case is recursive/direct multi-step forecasting or rolling one-step updating. Simulate that precise information flow during validation.

4\. Keep a final chronological holdout untouched until model choices, router logic, thresholds, and configuration are frozen. Do not repeatedly tune against it.

5\. Train any router/stacking model only on out-of-fold forecasts from earlier origins. Never train the router on predictions that used the same target observation as training data.

6\. Fit imputation, scaling, transformations, feature selection, hyperparameter tuning, and calibration only on each origin’s training data.

7\. Use multiple outer origins and, when enough series exist, held-out series/locations and leave-one-event-period/year-out checks. Make any minimum history requirement explicit; short data must produce a warning rather than an unsupported result.

8\. Report per-domain, per-series, and per-horizon performance. Never average raw MAE across MW, taka/kg, and pollutant concentration units. Use normalized metrics/ranks only with a documented definition.

### Metrics
Report suitable subsets of:

\- MAE and RMSE in the original target units.

\- MASE with its scaling baseline and seasonal period clearly identified.

\- WAPE or sMAPE only with the formula and zero/near-zero caveats; never rely on MAPE alone.

\- Pinball/quantile loss at predeclared quantiles, and weighted quantile loss when appropriate.

\- CRPS from predictive samples when possible. For empirical samples, use a valid sample-based CRPS estimator; do not label “twice the unweighted mean of a few pinball losses” as exact CRPS. If a discrete quantile approximation is used, state the formula and call it an approximation.

\- Prediction-interval coverage and interval width together; coverage alone is not enough.

\- Peak/event-window metrics when relevant, with event windows chosen before examining results.

\- Inference latency, memory use, failure rate, and model cost/compute requirements.

Where sample size and assumptions allow, consider block-bootstrap uncertainty estimates and paired forecast-comparison tests such as Diebold–Mariano. Prespecify primary comparisons or control for multiple comparisons. Include confidence intervals/effect sizes when feasible and avoid making a novelty claim from tiny differences without adequate evidence.

Produce a model leaderboard, error-over-time plot, forecast-versus-actual plot, residual/drift diagnostics, interval calibration view, and a reproducible evaluation report. Explain why the chosen model beat the strongest baseline in the tested cases, or state that it did not.

## 9. Controlled self-improvement loop
Define “self-improving” as a measurable, auditable feedback system—not a model that edits its own code or changes weights without checks.

Implement these modules as bounded agents/services (start as ordinary testable Python components; add an orchestration framework only if complexity justifies it):

\- **Data Curator Agent:** discovers/refreshes registered sources, validates schema/quality/freshness, and records data lineage.

\- **Model Evaluator and Router Agent:** evaluates eligible candidates through the shared backtesting engine and selects a model or constrained ensemble for the specific domain/series/horizon.

\- **Feature and Experiment Agent:** proposes features or configurations as experiments; every change is versioned and evaluated out-of-sample.

\- **Drift and Feedback Agent:** compares incoming actual values with saved forecasts once those actuals become available; tracks residual distributions, metric degradation, interval calibration, input drift, and source changes.

\- **Narrative and Action Agent:** converts validated forecast results and explicit domain rules into a readable report; it does not invent numeric forecasts or override model metrics.

\- **Orchestrator:** schedules refreshes, evaluations, reports, and candidate runs with transparent logs and bounded permissions.

Use a champion–challenger process:

1\. Log a forecast with model/checkpoint version, configuration, data hash/vintage, forecast origin, horizon, prediction interval, and output timestamp.

2\. When actual values arrive, score the old forecast; do not compare it with a different target window.

3\. Raise a retraining/re-evaluation trigger if a prespecified drift or performance threshold is breached, or if a scheduled evaluation is due.

4\. Train or configure a challenger using only data available before each training origin. Evaluate it on multiple new rolling origins against the current champion and strong baselines.

5\. Promote only if the challenger passes predeclared improvement, stability, data-quality, latency/resource, and calibration gates. Use shadow mode first if safe to do so.

6\. Save the experiment, evidence, reason for promotion/rejection, model version, and configuration. Support rollback to the last accepted model.

7\. Require an explicit approval gate for high-impact or operational changes. Keep model training, code deployment, and UI narrative generation as separate operations.

Allow dynamic ensemble weights or model-routing rules to update only from past out-of-sample forecast outcomes and only with regularization/guardrails. Do not fine-tune foundation-model weights on every new observation by default. Fine-tuning/LoRA should be an optional offline experiment with a cost and rollback plan. Never use a final test set as ongoing feedback for selecting the model that is then reported as having passed that test.

## 10. LLM reports and domain action guidance
Generate a structured report from the numeric forecasting output, evaluation history, data-quality flags, prediction intervals, and verified domain rules. The LLM must not compute or fabricate forecasts. It must not treat correlation as causation, imply that an exogenous feature caused a movement without an appropriate analysis, or convert weak predictions into confident commands.

For each forecast provide:

\- **Plain-language summary:** what is being forecast, time range, expected direction/pattern, target units, and an explanation of the selected model.

\- **Evidence:** recent actuals, forecast values, relevant metrics, backtest scope, strongest baseline, source freshness, and what the model has/has not been tested on.

\- **Uncertainty:** intervals or scenarios when supported, whether historical interval coverage has been tested, and a clear warning when reliable intervals are unavailable.

\- **What to do:** only relevant, specific, conditional suggestions tied to observed thresholds, business rules, or cited evidence. Explain the rationale and name who should verify the action when expert judgment is required.

\- **What not to do:** likely mistakes such as acting on stale data, treating an uncertain forecast as exact, assuming a trend is causal, or using a result outside its tested geography/frequency/horizon.

\- **Monitoring:** next refresh, drift status, and whether re-evaluation is recommended.

Recommendations must be framed as decision support, not guaranteed outcomes. Use domain guardrails: e.g. do not issue automatic grid-control commands; do not present price forecasts as assured market outcomes; do not present modeled air-quality estimates as ground-truth sensor measurements; and do not provide medical conclusions from ambient pollution data. If source quality is poor, forecast uncertainty is too high, or evidence is insufficient, state **“No reliable action recommendation from the available evidence.”**

Return schema-validated JSON for programmatic use plus a human-readable rendered version. Include fields such as \`domain\`, \`target\`, \`forecast_horizon\`, \`data_freshness\`, \`model_selected\`, \`baseline_comparison\`, \`trend\`, \`forecast\`, \`uncertainty\`, \`backtest_metrics\`, \`drift_status\`, \`retraining_recommended\`, \`what_to_do\`, \`what_not_to_do\`, \`limitations\`, and \`source_citations\`. Validate the JSON; if the LLM output is invalid, use a deterministic template fallback rather than crashing.

## 11. User education and transparency
Add an “How ECAM-TS Works” page or panel in plain English covering:

\- What a time series is and what forecasting can/cannot do.

\- The difference between observed values, modeled/reanalysis data, and forecasts.

\- The difference between a conventional model, a foundation model, an ensemble/router, and an LLM report writer.

\- What rolling-origin evaluation means, why leakage makes scores misleading, and how each metric should be interpreted.

\- How prediction intervals differ from guaranteed bounds.

\- How sources are refreshed and how users can see date, location, units, license, provenance, and quality.

\- What “self-improvement” means in this system, when re-evaluation occurs, and why a candidate may be rejected.

\- Known limitations, data-scarcity warnings, compute restrictions, and the fact that future observations are uncertain.

Include a short glossary and a transparent “Why was this model selected?” explanation for every result.

## 12. Google Colab / Jupyter implementation
Provide a reproducible notebook or notebook series that can run in Google Colab and local Jupyter. Use clear cells and markdown explanations, typed/modular Python where practical, configuration values at the top, pinned dependencies, fixed random seeds where relevant, and a CPU-safe small-model/default path.

The notebook should demonstrate, end to end:

1\. Load a verified public dataset or user-uploaded CSV.

2\. Inspect schema, timestamp frequency, units, missing data, outliers, and source metadata.

3\. Run baseline forecasts.

4\. Run at least one supervised model and one compatible foundation model if available.

5\. Compare the models using identical multi-origin backtesting.

6\. Calculate point and probabilistic metrics only where supported.

7\. Show plots, leaderboard, data/forecast provenance, and an actionable report.

8\. Demonstrate the feedback workflow with newly revealed historical actuals and a challenger evaluation. Clearly label simulated feedback if the notebook uses replayed historical data rather than a live production stream.

9\. Export results as CSV/Parquet and a human-readable report.

Do not assume free Colab always has a GPU, adequate RAM, unlimited usage, or a persistent filesystem. Load large models lazily, cache downloads, support reducing sample count/context length for smoke tests, and give meaningful instructions on model access and memory failures. Do not make an unverified claim that all models are trainable end-to-end on free Colab.

## 13. Architecture and deployment
Prefer a modular architecture with clear boundaries between:

\- Frontend/dashboard.

\- Ingestion/source registry and scheduled refresh.

\- Raw and curated data storage.

\- Forecasting/model adapter service.

\- Backtesting/experiment registry/model router.

\- Forecast ledger and residual/drift monitoring.

\- Report generation and domain rules.

For the MVP, a local-first design backed by local CSV/Parquet/SQLite (or existing project storage) is acceptable. Add FastAPI, PostgreSQL, background jobs, Docker, experiment tracking, cloud storage, or authentication only when the current repository and scope justify them. Avoid production microservices before the forecasting evidence is reliable.

Create configuration examples and documentation for environment variables, scheduled refresh frequency, supported connectors, local setup, notebook setup, model cache, and known source/model limitations. Make failed jobs visible and retryable. Keep an audit record of data refreshes, model evaluations, and promotions.

## 14. Novelty and research contribution
Before claiming novelty, build a comparison table covering closely related research and software. For each item include title, authors, date, venue/status, domain, models, data, evaluation design, major findings, limitations, and how ECAM-TS differs. Identify dataset overlap/pretraining contamination risks when possible.

Evaluate these as **candidate contributions to validate, not predetermined novelty claims**:

\- A source-provenance and freshness-aware forecasting workbench that separates operational Bangladesh data from public benchmarks.

\- Leakage-controlled, horizon-specific routing across classical methods, supervised ML, and foundation models under a constrained compute budget.

\- A drift-triggered champion–challenger loop with auditable promotion and rollback.

\- Action guidance grounded in calibrated forecasts, explicit domain rules, source freshness, and evaluation evidence.

\- A reproducible cross-domain comparison on data with verified timestamps and release availability.

Rank potential contributions by novelty, feasibility, data availability, compute cost, evaluation strength, and likelihood of supporting a defensible academic result. Recommend a small, strong research question rather than an unbounded claim that this system is universally more accurate.

## 15. Required deliverables
Deliver in this order:

1\. **Repository audit:** current state, working components, defects, technical debt, and anything that must be preserved.

2\. **Research review:** verified current model choices, related papers, dataset/access audit, license/compute table, and specific research gap.

3\. **System specification:** architecture diagram, component responsibilities, data schemas, API/data-flow definitions, agent responsibilities, and failure behavior.

4\. **Implementation roadmap:** phased tasks, dependencies, risks, and measurable acceptance criteria.

5\. **Working MVP implementation:** code changes in the existing repository, source adapters, forecasting interface, valid backtesting, initial router, provenance, reports, and required UI updates.

6\. **Colab/Jupyter notebook:** reproducible end-to-end experiment with a CPU-safe fallback path.

7\. **Automated tests:** especially timestamp/order validation, gaps/duplicates, minimum-history checks, multi-step leakage tests, forecast-origin consistency, baseline always available, quantile ordering/calibration metrics, source failure handling, invalid LLM JSON fallback, and model promotion/rollback.

8\. **Experimental report:** per-domain/dataset/horizon results; model versions; all origins; baselines; point/probabilistic metrics; uncertainty; runtime; memory; failure rate; ablations; and limitations.

9\. **User documentation:** simple English explanation, glossary, local setup, notebook setup, source access instructions, and an explanation of the four domains and their colors.

10\. **Final status report:** exact files changed, commands run, tests passed/failed, links and versions verified, data sources actually connected, features implemented/partial/planned, and remaining blockers.

## 16. Acceptance criteria
The MVP is acceptable only when:

\- It works without a foundation model or live API by using a known sample dataset and baselines.

\- All compared models use the same target, data cutoffs, forecast origins, and horizon in evaluation.

\- A leakage-focused test proves that no future target or future covariate is used at a forecast origin.

\- The final holdout is untouched during model and router selection.

\- Every displayed forecast can be traced to its source snapshot, origin, model version, and configuration.

\- Data staleness and uncertainty are visible to the user.

\- Self-improvement promotes a candidate only after passing recorded gates; a candidate can be rejected and the system can roll back.

\- The report explains metrics and limitations in understandable language and cannot crash the application if LLM output is malformed or the LLM is unavailable.

\- Source coverage and licenses are accurately labeled; no absent source/API is fabricated.

\- Tests and build commands are run and their real results are reported.

## 17. Execution instructions
Start by auditing the existing repository and checking the official model cards, packages, dataset pages, license terms, and APIs that are current today. Use web research to resolve uncertainty. Then present the most important findings and implement the highest-value end-to-end slice. Continue through the phases without repeatedly asking for approval for ordinary implementation details; make reasonable, documented choices. Stop and clearly identify a blocker only when an essential credential, private dataset, user decision, or external permission is genuinely required.

Do not produce only a proposal or a pile of pseudocode. Produce real code, real tests, and an honest report. Do not claim a model was trained, a dataset was connected, a test passed, or a performance improvement was achieved unless the corresponding operation was actually performed and its output was checked.

\---

# Source Links to Verify During Execution
\- Amazon Chronos: https://github.com/amazon-science/chronos-forecasting

\- Google TimesFM: https://github.com/google-research/timesfm

\- Salesforce Uni2TS / Moirai: https://github.com/SalesforceAIResearch/uni2ts

\- GIFT-Eval: https://github.com/SalesforceAIResearch/gift-eval

\- Open-Meteo historical forecast API: https://open-meteo.com/en/docs/historical-forecast-api

\- Open-Meteo historical weather API: https://open-meteo.com/en/docs/historical-weather-api

\- Open-Meteo air-quality API: https://open-meteo.com/en/docs/air-quality-api

\- OpenAQ API docs: https://docs.openaq.org/about/about

\- Bangladesh DAM commodity-price reports: https://market.dam.gov.bd/commodity_wise_report?L=E

\- Bangladesh BBS price and wage statistics: https://bbs.gov.bd/site/page/29b379ff-7bac-41d9-b321-e41929bab4a1

\- Power Grid Bangladesh demand/supply/load-shedding data: https://erp.powergrid.gov.bd/web/generations/view_demand_supply_loadshed_bn

\- BPDB daily generation archive: https://misc.bpdb.gov.bd/daily-generation-archive

\- Monash Forecasting Repository: https://forecastingdata.org/

# Research papers surfaced for initial review
\- L. Simeone (2026), *\*Time Series Foundation Models for Energy Load Forecasting on Consumer Hardware: A Multi-Dimensional Zero-Shot Benchmark\**, arXiv:2602.10848. https://consensus.app/papers/time-series-foundation-models-for-energy-load-forecasting-simeone/0221f3ee9c3057dfb6e0e7176f1d5255/

\- Marcel Meyer, David Zapata, Sascha Kaltenpoth, and Oliver Müller (2024), *\*Benchmarking Time Series Foundation Models for Short-Term Household Electricity Load Forecasting\**, IEEE Access, 13, 218141–218153. https://consensus.app/papers/benchmarking-time-series-foundation-models-for-shortterm-meyer-zapata/d6fcf48b4dc456a0bf9e969c40aaa72a/

\- Jittarin Jetwiriyanon, Teo Sušnjak, and Surangika Ranathunga (2025), *\*Generalisation Bounds of Zero-Shot Economic Forecasting using Time Series Foundation Models\**, arXiv:2506.15705. https://consensus.app/papers/generalisation-bounds-of-zeroshot-economic-forecasting-jetwiriyanon-sušnjak/067e6eaedbbd5634abe22dc2fe840ac0/

## 18. Alignment with the research proposal and staged scope

The academic center of ECAM-TS is **event- and context-aware adaptive model selection for multi-domain time-series forecasting**. Preserve the proposal’s electricity-first question: test whether known calendar/event context (Ramadan, Eid-ul-Fitr, Eid-ul-Adha, Durga Puja, weekdays/weekends, lead-up, event-core, and recovery windows) improves held-out forecasts, especially in pre-specified evening/peak periods. Treat behavioural explanations and previously suggested demand-change magnitudes as hypotheses until verified against traceable observations.

The four visible product domains remain the current interface scope: **(1) Bangladesh electricity/grid demand, (2) Bangladesh food/essential-commodity prices, (3) weather/climate, and (4) air quality**. The broader research portfolio may screen macroeconomic series, crop yields/agriculture, river levels/flood/hydrology, traffic, retail activity, solar/renewables, public-health surveillance, and water demand, but these are candidate extensions rather than promised integrated domains. Add them only after source coverage, terms, target definitions, usable history, and project timeline pass an explicit gate.

Do not pool targets with different units and native frequencies into one synthetic target. Use one shared evaluation protocol with domain-specific tasks. Keep electricity as the initial anchor if the actual time-stamped target is verified; treat food-price and macroeconomic series as independent lower-frequency tasks; use weather/air-quality data as targets or exogenous context only when their role and issue-time availability are clear. Recorded electricity demand, generation, and latent demand are different quantities, especially during load shedding.

## 19. Front-end design constraints for the existing React application

Apply the supplied interface specification to the existing Vite + React + TypeScript + Motion project—not by replacing it with a standalone HTML prototype. Maintain a responsive research-studio navbar, workbench, source registry, roadmap, and footer. Use a dark navy header with a light analytical canvas and keep the domain design tokens consistent:
- Electricity: teal `#0d9488`.
- Food prices: amber `#b45309`.
- Weather: blue `#2563eb`.
- Air quality: violet `#7c3aed`.

Motion should clarify state changes and create tactile depth, not disguise mock values as live activity. Prefer transform/opacity animations, CSS radial lighting, and the existing Motion library. If adding a pointer-reactive canvas/WebGL background, lazy-load it, keep a gradient fallback, handle context loss, avoid blocking the main thread, and honor `prefers-reduced-motion`. Do not claim live telemetry, FPS, or source connectivity unless those values are genuinely measured. Every nav item/CTA must go to a real interface or perform its stated action. Show clear empty, loading, error, stale, and success states, with concise help near controls whose choice affects scientific validity.

## 20. Priority order for implementation

**Phase 1 — trustworthy vertical slice:** honest source registry and status labels; CSV/manual ingest and existing NASA POWER endpoint; input/data audit; rolling-origin baseline comparison; source provenance; transparent forecast/report; four-domain theme tokens; an offline smoke-test dataset; automated checks and plain-English setup docs.

**Phase 2 — shared scientific engine:** one backtest contract and per-origin prediction ledger; statistical models; fold-local lag/calendar features and a supervised tree model; reproducible configs and exports.

**Phase 3 — comparative research:** add the first compatible foundation-model adapter only after license/runtime checks; generate out-of-fold forecasts at identical forecast origins/horizons; compare best-single, equal weights, regularized stacking and FFORMA-style/context-conditioned routing; run matched context ablations.

**Phase 4 — controlled adaptation:** historical forecast ledger, delayed actual scoring, residual/input drift alerts, calibration monitoring, champion/challenger experiments, guarded promotion and rollback.

**Phase 5 — operations:** persistent experiment/data artifacts, background jobs, deployment security, quotas, observability and recovery. Do not build production infrastructure at the cost of an untrustworthy experimental protocol.

A phase is complete only when acceptance tests and evidence artifacts exist. When data/time/permissions block a milestone, record the blocker and keep a runnable smaller implementation rather than creating a fake working-state indicator.

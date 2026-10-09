# ECAM-TS Source Registry and Access Protocol

The source registry is part of the application at **Data sources**. This guide records the difference between a source lead and a connected, repeatable data adapter.

## Status definitions

| Status | Meaning |
|---|---|
| **Adapter implemented** | Application code exists to request the source. A successful response and usable schema must still be checked when a request is run. |
| **Manual download** | The provider publishes a data record or file pathway; the user should download the actual observations and preserve the original. |
| **Candidate / access needs verification** | A possible source has been identified, but this repository does not claim that an automated connector is working. |
| **Benchmark only** | A research dataset for reproducible method checks; it is not a real-time operational feed or proof of Bangladesh-specific performance. |

Never infer connectivity from a clickable source URL. Do not call a static report page an API unless the API endpoint and access terms have been verified. Record retrieval time, response status, schema, row count, coverage, timezone, target units, license/terms, and SHA-256 for each downloaded file or saved data snapshot.

## Source-by-source guidance

| Source | Initial use | Access state in this repository | Critical checks |
|---|---|---|---|
| NASA POWER Daily Point API | Dhaka-area daily temperature/precipitation | Request route implemented in the Workbench | Validate API response for the requested date range, unit metadata, missing codes, actual cadence, and query URL. Values are gridded/reanalysis-derived, not BMD station observations. |
| Mendeley Bangladesh electricity record | Candidate historical electricity series | Manual download | Download and inspect the actual observation file and data dictionary. Verify that each row is a time point; confirm target definition, timestamp, timezone, missingness, units, source version, and license. |
| Power Grid Bangladesh demand/supply/load-shedding portal | Operational electricity observations if historical exports support it | Candidate; download/automation method unverified | Confirm machine-readable export/API, timestamp granularity, units, historical completeness, and how load shedding affects recorded demand. |
| BPDB daily generation archive | Daily generation series | Candidate; manual/source access must be verified | Treat as daily unless finer cadence is documented. Do not turn daily totals into hourly targets. |
| DAM commodity price reports | Bangladesh market/product food-price series | Candidate; export mechanism unverified | Verify market, commodity, retail/wholesale type, unit, frequency, downloadable history, revisions, and terms. |
| World Bank real-time food-price catalogue | Market/product panel, if downloaded extract contains observations | Manual download | Avoid one-row catalogue metadata exports. Record exact version, imputation/revision notes, geography, product, market, price unit, coverage, and license/terms. |
| BBS price/wage/CPI releases | Monthly economic context or separate task | Candidate; files/release timing must be checked | Record reference period and publication date separately. A monthly value may not have been available at the beginning of that month. |
| Open-Meteo historical forecast archive | Weather forecast vintages as time-safe exogenous data | Candidate; not connected by the current UI | Preserve forecast issue time and lead time. Use the vintage available at the simulated forecast origin. |
| Open-Meteo historical weather | Descriptive/reanalysis context | Candidate; not a historical forecast archive | Do not use reanalysis as though it were the weather forecast known at historical issue time. |
| Open-Meteo air-quality API | Modeled air-quality values/forecasts | Candidate; not connected by the current UI | Check pollutant coverage, geography, units, temporal resolution, current API terms, and observed-versus-modeled distinction. |
| OpenAQ | Monitoring station pollutant readings | Candidate; not connected by the current UI | Verify station availability, station IDs, pollutant metadata, units, freshness, missing periods, and API access for the selected location. |
| Monash Forecasting Repository | Research benchmark tasks | Benchmark only | Pin dataset/split versions and licenses. Results are not automatically local Bangladesh results. |
| GIFT-Eval | Research benchmark tasks | Benchmark only | Pin benchmark commit/configuration and evaluate models under the same origins, horizons, and information set. |

## Required record for a new source

Before adding a source as “connected,” save the following with the test artifact:

- Provider name and exact source/API URL.
- Access method: API, direct download, or manual upload.
- Retrieved-at timestamp and published/release time if known.
- Source version/DOI/commit and terms/license/attribution.
- File or response checksum; retain the raw response/snapshot unchanged.
- Geographic scope and the exact target/series definition.
- Native frequency, timezone, units, expected and observed row counts, first/last timestamps.
- Missing-value/sentinel codes, revision policy, and known limitations.
- Last successful retrieval, HTTP/status result, schema validation, and a small sanitized fixture for offline tests.

For operational forecasting, each feature also needs an **availability time**. Historical weather features must use weather forecast vintages available at that origin, not future realized weather. Macroeconomic series must account for release lag and revision. For the food-price panel, group by market/product before forecasting; do not collapse incompatible units or markets into one target.

## What the current application does

The Data sources UI is a catalogue and navigation surface. It does not scrape every listed page. “Open import workflow” takes the user to the Workbench. The user must still select/download the actual observation file, specify its target and timestamp, audit data quality, and run the baseline evaluation. The NASA POWER route makes a request only when invoked and exposes errors if the response is not usable.

Do not display “live” or “connected” because a source is listed. Update the status only after a working integration test demonstrates that the connector retrieved and validated data.

# ECAM-TS Research Workbench

Interactive research prototype for **Event- and Context-Aware Adaptive Model Selection for Multi-Domain Time-Series Forecasting**.

## Current scientific status
The legacy scenario screens (historical scenario plots, fixed leaderboard metrics, heuristic router weights, stress tests and operational summaries) still use synthetic or static demonstration values. They are not validated research results and must not be cited as benchmark scores.

The **Workbench** view supports NASA POWER daily weather observations for the documented Dhaka point and CSV import for downloaded source data. It audits the selected target/timestamps, selects among transparent baseline strategies using expanding-window rolling-origin validation, evaluates them on a separate final chronological horizon, and exports the future point forecast. It currently covers five baselines only; it is not a complete ECAM-TS model pipeline.

## Run locally
Requires Node.js 22+ and npm. A Gemini API key is only required for the optional committee-defense endpoint.
1. `npm install`
2. Copy `.env.example` to `.env.local` and configure optional server secrets.
3. `npm run dev`
4. Open the local URL printed by Vite/tsx.

## Validation
- `npm run lint` — TypeScript checks.
- `npm test` — unit tests for the forecasting utility.
- `npm run build` — Vite production build.
- `npm run check` — runs all three checks sequentially.

## Scientific boundaries
- Keep raw source files immutable and record the source version, license, checksum, retrieval time, units, cadence and timezone.
- Use only information available at each forecast origin. In particular, realized future weather must not be joined to historical electricity forecasts as though it were a forecast known at the time.
- The final horizon is kept out of baseline selection. It is one holdout block, not sufficient evidence for paper-wide claims.
- Foundation-model adapters, tree models, learned routing, probabilistic calibration, repeated outer holdouts, persistent experiment tracking and production security remain future milestones.

See [the implementation and research protocol](docs/implementation-plan.md).

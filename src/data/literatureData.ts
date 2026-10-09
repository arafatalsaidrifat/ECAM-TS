import { ScholarlyPaper } from '../types';

export const CORE_SCIENTIFIC_LITERATURE: ScholarlyPaper[] = [
  {
    id: 'lit-1',
    title: 'A Decoder-Only Foundation Model for Time-Series Forecasting (TimesFM)',
    authors: 'Das, A., Kong, W., Sen, R., & Zhou, Y. (Google Research)',
    year: 2024,
    journal: 'International Conference on Machine Learning (ICML 2024)',
    doi: '10.48550/arXiv.2310.10688',
    abstract:
      'Presents TimesFM, a 200M parameter pretrained time-series foundation model based on a decoder-only transformer with patched input tokenization. Evaluated across diverse frequencies, TimesFM exhibits zero-shot performance competitive with fully supervised deep learning forecasters.',
    url: 'https://arxiv.org/abs/2310.10688',
    source: 'arXiv / Google Research',
    provenance: 'Peer-Reviewed Conference (ICML)',
  },
  {
    id: 'lit-2',
    title: 'Chronos: Learning the Language of Time Series',
    authors: 'Ansari, A. F., Stella, L., Turkmen, C., et al. (Amazon Web Services)',
    year: 2024,
    journal: 'Transactions on Machine Learning Research (TMLR)',
    doi: '10.48550/arXiv.2403.07815',
    abstract:
      'Introduces Chronos, a framework for pretrained probabilistic time series models based on language model architectures. Chronos tokenizes time series via scaling and quantization into fixed vocabularies, trained with cross-entropy loss to yield probabilistic quantile forecasts.',
    url: 'https://arxiv.org/abs/2403.07815',
    source: 'TMLR / Amazon AWS',
    provenance: 'Peer-Reviewed Journal',
  },
  {
    id: 'lit-3',
    title: 'Unified Training of Universal Time Series Forecasting Models (Moirai)',
    authors: 'Woo, G., Liu, C., Sahoo, D., Kumar, A., & Hoi, S. (Salesforce Research)',
    year: 2024,
    journal: 'International Conference on Machine Learning (ICML 2024)',
    doi: '10.48550/arXiv.2402.02592',
    abstract:
      'Proposes MOIRAI, a masked encoder-decoder foundation model for universal time series forecasting trained on LOTSA (Large-scale Open Time Series Archive). Handles any-variate inputs with multi-patch size projection layers.',
    url: 'https://arxiv.org/abs/2402.02592',
    source: 'ICML / Salesforce',
    provenance: 'Peer-Reviewed Conference (ICML)',
  },
  {
    id: 'lit-4',
    title: 'FFORMA: Feature-based Forecast Model Averaging',
    authors: 'Montero-Manso, P., Athanasopoulos, G., Hyndman, R. J., & Talagala, T. S.',
    year: 2020,
    journal: 'International Journal of Forecasting, 36(1), 86-92',
    doi: '10.1016/j.ijforecast.2019.02.011',
    abstract:
      'Introduces Feature-based FORecast Model Averaging (FFORMA), a meta-learning method where time series features (STL decomposition, autocorrelation, spectral entropy) condition an XGBoost model that assigns combination weights across candidate statistical forecasters.',
    url: 'https://doi.org/10.1016/j.ijforecast.2019.04.011',
    source: 'International Journal of Forecasting',
    provenance: 'Peer-Reviewed Journal (M4 Winner)',
  },
  {
    id: 'lit-5',
    title: 'Strictly Proper Scoring Rules, Prediction, and Estimation',
    authors: 'Gneiting, T., & Raftery, A. E.',
    year: 2007,
    journal: 'Journal of the American Statistical Association (JASA), 102(477), 359-378',
    doi: '10.1198/016214506000001437',
    abstract:
      'Foundational mathematical treatise on probabilistic forecast evaluation. Derives the Continuous Ranked Probability Score (CRPS) as an integral transform over quantile verification, ensuring truthfulness in density estimation.',
    url: 'https://doi.org/10.1198/016214506000001437',
    source: 'JASA',
    provenance: 'Seminal Statistical Theory',
  },
  {
    id: 'lit-6',
    title: 'Electricity Load and Generation Profiles across Bangladesh National Grid',
    authors: 'Shekh, M. I., & Rafi, R. H.',
    year: 2026,
    journal: 'Mendeley Data, Version 1 (dataset record)',
    doi: '10.17632/vpk8spw2mm.1',
    abstract:
      'The repository record describes hourly generation, recorded demand, estimated load-shedding and fuel/import fields scraped from PGCB public ERP pages, covering April 2015 to March 2026. It is a dataset record, not a peer-reviewed forecasting study; independently inspect the downloaded CSV and do not infer festival effects from the metadata alone.',
    url: 'https://data.mendeley.com/datasets/vpk8spw2mm/1',
    source: 'Mendeley Data / PGCB-derived',
    provenance: 'Open dataset record · not a paper',
  },
];

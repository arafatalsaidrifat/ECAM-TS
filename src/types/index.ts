export type DomainCode = 'BD-ELEC-H' | 'BD-FOOD-M' | 'BD-WEAT-D' | 'EXT-AIR-H';

export type ModelFamily =
  | 'Simple Baseline'
  | 'Classical Statistical'
  | 'Supervised Tree'
  | 'Foundation Model'
  | 'Meta-Learned Combination'
  | 'Heuristic Ensemble';

export interface DatasetMetadata {
  code: DomainCode;
  title: string;
  variableName: string;
  scope: string;
  nativeCadence: string;
  sourceEndpoint: string;
  citationDOI: string;
  forecastHorizon: string;
  horizonSteps: number;
  unit: string;
  totalTimestamps: number;
  missingRatio: number;
  baselineThreshold: number;
  thresholdLabel: string;
  description: string;
  covariates: string[];
}

export interface CandidateModel {
  id: string;
  name: string;
  shortName: string;
  family: ModelFamily;
  checkpoint: string;
  description: string;
  mae: number;
  rmse: number;
  mase: number;
  crps: number;
  latencyMs: number;
  badge: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  actual: number;
  trend: number;
  seasonal: number;
  residual: number;
  covariate1?: number; // e.g. Temp (°C) or Inflation
  covariate2?: number; // e.g. Humidity (%) or Crop Cycle
  eventPhase?: 'baseline' | 'lead_up' | 'event_core' | 'recovery';
  isImputed?: boolean;
}

export interface HorizonForecastPoint {
  step: number;
  timestamp: string;
  yHat: number;
  q10: number;
  q90: number;
  actual?: number;
  error?: number;
  modelPredictions?: Record<string, number>;
}

export interface ConditioningVector {
  trendStrength: number; // Ft
  seasonalStrength: number; // Fs
  spectralEntropy: number; // Hspec
  autocorr1: number; // ACF(1)
  autocorrSeason: number; // ACF(m)
  coolingDegreeDays: number; // CDD18.3
  eventPhase: 'baseline' | 'lead_up' | 'event_core' | 'recovery';
  leadUpProximityDays: number;
  holidayFlag: number;
  recoveryProximityDays: number;
}

export interface OperationalImpactSummary {
  domain: DomainCode;
  peakValue: number;
  capacityOrCeiling: number;
  netBalance: number;
  netBalancePct: number;
  isDeficit: boolean;
  deficitDurationHours: number;
  alertLevel: 'optimal' | 'moderate' | 'warning' | 'critical';
  title: string;
  summaryText: string;
  recommendedAction: string;
  physicalUnit: string;
}

export interface AblationSettings {
  leadUpFeatures: boolean;
  coreHolidayFlags: boolean;
  recoveryLagTerms: boolean;
  weatherInteraction: boolean;
}

export interface StressTestState {
  missingDataPct: number; // 0 to 20
  temperatureShockDeg: number; // 0 to 5.0
  festivalDateShiftDays: number; // 0 to 10
  description: string;
  activeType: 'none' | 'missing_data' | 'temp_shock' | 'festival_shift';
}

export interface FacultyInquiry {
  id: string;
  role: string;
  question: string;
  answer?: string;
  isLoading?: boolean;
  timestamp: string;
}

export interface ScholarlyPaper {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
  citationCount?: number;
  abstract: string;
  url: string;
  source: string;
  provenance: string;
}

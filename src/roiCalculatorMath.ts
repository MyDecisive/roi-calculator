export type RoiCalculatorConfig = {
  RATE_LOG_GB: number;
  RATE_TRACE_IN_MM: number;
  RATE_TRACE_OUT_MM: number;
  RATE_HOST: number;
  RATE_CONTAINER: number;
  DAYS_PER_MONTH: number;
  CTA_GET_STARTED_URL: string;
  CTA_CONTACT_URL: string;
};

export type RoiCalculatorInputs = {
  logGB: number | string;
  traceGB: number | string;
  traceCt: number | string;
  containers: number | string;
  hosts: number | string;
  overage: number | string;
  filterPct: number | string;
};

export type RoiCalculatorResults = {
  beforeMonthly: number;
  afterMonthly: number;
  monthlySavings: number;
  annualSavings: number;
  savingsPct: number;
  gbAvoidedDay: number;
  tracesAvoidedDay: number;
  bytesOutDay: number;
  keepRate: number;
  filterPct: number;
};

export const DEFAULT_CONFIG: RoiCalculatorConfig = {
  RATE_LOG_GB: 2.5,
  RATE_TRACE_IN_MM: 2.5,
  RATE_TRACE_OUT_MM: 1.27,
  RATE_HOST: 15,
  RATE_CONTAINER: 1,
  DAYS_PER_MONTH: 30,
  CTA_GET_STARTED_URL: 'https://mydecisive.ai/octant',
  CTA_CONTACT_URL: 'https://mydecisive.ai#contact-us'
};

export const DEFAULT_INPUTS: RoiCalculatorInputs = {
  logGB: 800,
  traceGB: 200,
  traceCt: 1500000000,
  containers: 1200,
  hosts: 300,
  overage: '',
  filterPct: 70
};

// MDAI Infrastructure Cost Calculation
// AWS list price constants (verified July 2026, us-east-1)
// Compute priced as 1-Year Standard Reserved Instances, No Upfront
export const MDAI_COMPUTE_COST_PER_UNIT = 635.41;   // 7 EC2 instances (RI) + EKS control plane (flat)
export const MDAI_EBS_COST_PER_UNIT = 449.60;       // 5x 1TB gp3, 2 with provisioned perf
export const MDAI_S3_STORAGE_PRICE_PER_GIB = 0.023; // S3 Standard, first 50TB tier
export const MDAI_S3_PUT_PRICE_PER_1000 = 0.005;    // S3 Standard PUT/COPY/POST/LIST

// MDAI engineering constants
export const MDAI_T_REF_GB_PER_DAY = 20000;  // confirmed: 20TB/day sustained per reference cluster
export const MDAI_RETENTION_DAYS = 2;        // confirmed: S3 rolling buffer retention
export const MDAI_RETAINED_FRACTION = 1.0;   // confirmed: 100% of raw V written to S3 (no filtering before write)
export const MDAI_AVG_OBJECT_SIZE_MB = 1;    // confirmed: 1MB avg SmartHub batch write size

export type MdaiInfraCostResult = {
  clusterUnits: number;
  computeCost: number;
  ebsCost: number;
  s3StorageCost: number;
  s3RequestCost: number;
  total: number;
};

export function mdaiInfraCostPerMonth(V_gb_per_day: number): MdaiInfraCostResult {
  const N = Math.ceil(V_gb_per_day / MDAI_T_REF_GB_PER_DAY);
  const computeCost = N * MDAI_COMPUTE_COST_PER_UNIT;
  const ebsCost = N * MDAI_EBS_COST_PER_UNIT;

  const s3StorageGB = V_gb_per_day * MDAI_RETAINED_FRACTION * MDAI_RETENTION_DAYS;
  const s3StorageCost = s3StorageGB * MDAI_S3_STORAGE_PRICE_PER_GIB;

  const s3PutsPerMonth = (s3StorageGB * 1024 / MDAI_AVG_OBJECT_SIZE_MB) * (30 / MDAI_RETENTION_DAYS);
  const s3RequestCost = (s3PutsPerMonth / 1000) * MDAI_S3_PUT_PRICE_PER_1000;

  return {
    clusterUnits: N,
    computeCost,
    ebsCost,
    s3StorageCost,
    s3RequestCost,
    total: computeCost + ebsCost + s3StorageCost + s3RequestCost
  };
}

function safeNumber(value: number | string | undefined): number {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function calculateRoi(
  inputs: Partial<RoiCalculatorInputs> = DEFAULT_INPUTS,
  config: Partial<RoiCalculatorConfig> = DEFAULT_CONFIG
): RoiCalculatorResults {
  const mergedInputs = { ...DEFAULT_INPUTS, ...inputs };
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const logGBday = safeNumber(mergedInputs.logGB);
  const traceGBday = safeNumber(mergedInputs.traceGB);
  const traceCtday = safeNumber(mergedInputs.traceCt);
  const containers = safeNumber(mergedInputs.containers);
  const hosts = safeNumber(mergedInputs.hosts);
  const overage = safeNumber(mergedInputs.overage);
  const filterPct = Math.min(95, Math.max(0, safeNumber(mergedInputs.filterPct)));
  const filterRate = filterPct / 100;
  const keepRate = 1 - filterRate;
  const days = mergedConfig.DAYS_PER_MONTH;

  const logGBmo = logGBday * days;
  const traceCtMo = traceCtday * days;
  const logsBefore = logGBmo * mergedConfig.RATE_LOG_GB;
  const tracesBefore = (traceCtMo / 1e6) * mergedConfig.RATE_TRACE_IN_MM;
  const infrastructure =
    containers * mergedConfig.RATE_CONTAINER + hosts * mergedConfig.RATE_HOST;
  const beforeMonthly = logsBefore + tracesBefore + infrastructure + overage;

  const logsAfter = logGBmo * keepRate * mergedConfig.RATE_LOG_GB;
  const tracesAfter = ((traceCtMo * keepRate) / 1e6) * mergedConfig.RATE_TRACE_OUT_MM;
  const afterMonthly = logsAfter + tracesAfter + infrastructure + overage * keepRate;
  const monthlySavings = Math.max(0, beforeMonthly - afterMonthly);

  return {
    beforeMonthly,
    afterMonthly,
    monthlySavings,
    annualSavings: monthlySavings * 12,
    savingsPct: beforeMonthly > 0 ? Math.round((monthlySavings / beforeMonthly) * 100) : 0,
    gbAvoidedDay: (logGBday + traceGBday) * filterRate,
    tracesAvoidedDay: traceCtday * filterRate,
    bytesOutDay: (logGBday + traceGBday) * keepRate,
    keepRate,
    filterPct
  };
}

export function formatMoney(value: number): string {
  const n = Math.max(0, Math.round(value));
  if (n >= 1e6) {
    return `$${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, '')}M`;
  }
  if (n >= 1e3) {
    return `$${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '')}K`;
  }
  return `$${n.toLocaleString('en-US')}`;
}

export function formatMoneyExact(value: number): string {
  return `$${Math.max(0, Math.round(value)).toLocaleString('en-US')}`;
}

export function formatGb(value: number): string {
  if (value >= 1024) {
    return `${(value / 1024).toFixed(value >= 10240 ? 0 : 1).replace(/\.0$/, '')} TB`;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, '')} GB`;
}

export function formatCount(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return Math.round(value).toLocaleString('en-US');
}

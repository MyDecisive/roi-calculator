import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG,
  DEFAULT_INPUTS,
  calculateRoi,
  formatCount,
  formatGb,
  formatMoney,
  formatMoneyExact
} from './roiCalculatorMath';

describe('calculateRoi', () => {
  it('calculates the default planning estimate', () => {
    const result = calculateRoi();

    expect(result.beforeMonthly).toBe(178_200);
    expect(result.afterMonthly).toBeCloseTo(40_845);
    expect(result.monthlySavings).toBeCloseTo(137_355);
    expect(result.annualSavings).toBeCloseTo(1_648_260);
    expect(result.savingsPct).toBe(77);
    expect(result.gbAvoidedDay).toBe(700);
    expect(result.tracesAvoidedDay).toBeCloseTo(1_050_000_000);
    expect(result.bytesOutDay).toBeCloseTo(300);
    expect(result.keepRate).toBeCloseTo(0.3);
    expect(result.filterPct).toBe(70);
  });

  it('keeps infrastructure cost unchanged when telemetry is fully retained', () => {
    const result = calculateRoi({ ...DEFAULT_INPUTS, filterPct: 0 });

    expect(result.gbAvoidedDay).toBe(0);
    expect(result.tracesAvoidedDay).toBe(0);
    expect(result.bytesOutDay).toBe(1000);
    expect(result.afterMonthly).toBeLessThan(result.beforeMonthly);
    expect(result.monthlySavings).toBe(55_350);
  });

  it('clamps filter percentage to the slider maximum', () => {
    const result = calculateRoi({ filterPct: 120 });

    expect(result.filterPct).toBe(95);
    expect(result.keepRate).toBeCloseTo(0.05);
  });

  it('supports custom example rate assumptions', () => {
    const result = calculateRoi(
      {
        logGB: 10,
        traceGB: 0,
        traceCt: 1_000_000,
        containers: 2,
        hosts: 1,
        overage: 100,
        filterPct: 50
      },
      {
        ...DEFAULT_CONFIG,
        RATE_LOG_GB: 1,
        RATE_TRACE_IN_MM: 2,
        RATE_TRACE_OUT_MM: 1,
        RATE_HOST: 10,
        RATE_CONTAINER: 5,
        DAYS_PER_MONTH: 30
      }
    );

    expect(result.beforeMonthly).toBe(480);
    expect(result.afterMonthly).toBe(235);
    expect(result.monthlySavings).toBe(245);
    expect(result.annualSavings).toBe(2940);
    expect(result.savingsPct).toBe(51);
  });

  it('treats negative and empty inputs as zero', () => {
    const result = calculateRoi({
      logGB: -10,
      traceGB: '',
      traceCt: -1,
      containers: -2,
      hosts: -3,
      overage: '',
      filterPct: -50
    });

    expect(result.beforeMonthly).toBe(0);
    expect(result.afterMonthly).toBe(0);
    expect(result.monthlySavings).toBe(0);
    expect(result.savingsPct).toBe(0);
  });
});

describe('formatters', () => {
  it('formats compact and exact money values', () => {
    expect(formatMoney(999)).toBe('$999');
    expect(formatMoney(12_500)).toBe('$12.5K');
    expect(formatMoney(1_250_000)).toBe('$1.25M');
    expect(formatMoneyExact(1_250_000)).toBe('$1,250,000');
  });

  it('formats telemetry quantities', () => {
    expect(formatGb(750)).toBe('750 GB');
    expect(formatGb(1536)).toBe('1.5 TB');
    expect(formatCount(950)).toBe('950');
    expect(formatCount(12_000)).toBe('12K');
    expect(formatCount(1_500_000)).toBe('1.5M');
    expect(formatCount(1_500_000_000)).toBe('1.5B');
  });
});

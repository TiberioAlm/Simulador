import { describe, expect, it } from 'vitest';
import { fmtAliq, fmtBase, fmtMon, fmtPct, parseBR, percentToRatio, ratioToPercent } from '../format';

describe('format helpers', () => {
  it('parses Brazilian numbers into floats', () => {
    expect(parseBR('1.234,50')).toBeCloseTo(1234.5);
    expect(parseBR('R$ 9.999.999,99')).toBeCloseTo(9_999_999.99);
    expect(parseBR('0')).toBe(0);
  });

  it('formats monetary values with locale awareness', () => {
    expect(fmtMon(1234.56)).toBe('R$ 1.234,56');
    expect(fmtMon(500, { currency: 'USD' })).toBe('$500.00');
  });

  it('formats percentages and aliquots', () => {
    expect(fmtPct(12.3456)).toBe('12,35%');
    expect(fmtAliq(0.175)).toBe('17,50%');
    expect(fmtBase(1200)).toBe('R$ 1.200,00');
  });

  it('converts between percent and ratios', () => {
    expect(percentToRatio('25')).toBe(0.25);
    expect(ratioToPercent(0.5)).toBe('50,00%');
  });
});

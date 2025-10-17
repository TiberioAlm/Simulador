export type CurrencyCode = 'BRL' | 'USD';

const defaultCurrency: CurrencyCode = 'BRL';

const normalizeLocaleNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (!value) {
    return 0;
  }
  const cleaned = String(value)
    .trim()
    .replace(/[^0-9,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parseBR = (value: string | number | null | undefined): number => {
  return normalizeLocaleNumber(value);
};

const currencyFormatter = (
  currency: CurrencyCode = defaultCurrency,
  decimals = 2
) =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

export const fmtMon = (
  value: number | null | undefined,
  options?: { currency?: CurrencyCode; decimals?: number }
): string => {
  const { currency = defaultCurrency, decimals = 2 } = options || {};
  const num = normalizeLocaleNumber(value ?? 0);
  return currencyFormatter(currency, decimals).format(num || 0);
};

export const fmtPct = (value: number | null | undefined, digits = 2): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  const num = typeof value === 'number' ? value : normalizeLocaleNumber(value);
  if (!Number.isFinite(num)) {
    return '—';
  }
  return `${num.toFixed(digits).replace('.', ',')}%`;
};

export const fmtAliq = (value: number | null | undefined, digits = 2): string => {
  if (value === null || value === undefined || value === '—') {
    return '—';
  }
  if (typeof value === 'string') {
    return value;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '—';
  }
  return fmtPct(num * 100, digits);
};

export const fmtBase = (
  value: number | string | null | undefined,
  options?: { currency?: CurrencyCode; decimals?: number }
): string => {
  if (value === null || value === undefined || value === '—') {
    return '—';
  }
  if (typeof value === 'string' && value.trim() === '—') {
    return '—';
  }
  const num = typeof value === 'number' ? value : normalizeLocaleNumber(value);
  if (!Number.isFinite(num)) {
    return '—';
  }
  return fmtMon(num, options);
};

export const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
};

export const percentToRatio = (value: number | string | null | undefined): number => {
  const normalized = normalizeLocaleNumber(value);
  return clamp01(normalized / 100);
};

export const ratioToPercent = (value: number, digits = 2): string => fmtPct(value * 100, digits);

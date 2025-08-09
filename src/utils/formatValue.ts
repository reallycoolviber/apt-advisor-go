export type FormatValueType = 'price' | 'fee' | 'area' | 'debt_per_sqm' | 'rooms' | 'fee_per_sqm' | 'price_per_sqm';

const svNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat('sv-SE', options).format(value);

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isFinite(value) ? value : null;
  const cleaned = value.toString().replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

export function formatValue(value: number | string | null | undefined, type: string): string {
  const n = toNumber(value);
  if (n === null) return '';

  switch (type as FormatValueType) {
    case 'price': {
      if (n >= 1_000_000) {
        const millions = n / 1_000_000;
        const formatted = svNumber(millions, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        return `${formatted} miljoner kr`;
      }
      return `${svNumber(Math.round(n))} kr`;
    }
    case 'fee': {
      return `${svNumber(Math.round(n))} kr/mån`;
    }
    case 'area': {
      return `${svNumber(Math.round(n))} kvm`;
    }
    case 'debt_per_sqm':
    case 'fee_per_sqm':
    case 'price_per_sqm': {
      return `${svNumber(Math.round(n), { useGrouping: true })} kr/kvm`;
    }
    case 'rooms': {
      return `${svNumber(Math.round(n))} rum`;
    }
    default:
      return String(value ?? '');
  }
}

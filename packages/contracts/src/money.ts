export function toCents(value: number): number {
  return Math.round(value * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function parseBRL(input: string): number {
  const cleaned = input.trim().replace(/^R\$/, '').trim();
  if (!/^-?(\d+|\d{1,3}(\.\d{3})+)(,\d{1,2})?$/.test(cleaned))
    return Number.NaN;
  const negative = cleaned.startsWith('-');
  const unsigned = negative ? cleaned.slice(1) : cleaned;
  const [whole = '', decimals = ''] = unsigned.split(',');
  const cents =
    Number(whole.replace(/\./g, '')) * 100 + Number(decimals.padEnd(2, '0'));
  const result = negative ? -cents : cents;
  return Number.isSafeInteger(result) ? result : Number.NaN;
}

import { describe, expect, it } from 'vitest';

import { formatBRL, fromCents, parseBRL, toCents } from '../src/money.js';

describe('toCents', () => {
  it('converts reais to integer cents', () => {
    expect(toCents(10.5)).toBe(1050);
    expect(toCents(0.1)).toBe(10);
    expect(toCents(1.234)).toBe(123);
  });
});

describe('fromCents', () => {
  it('converts integer cents to reais', () => {
    expect(fromCents(123456)).toBe(1234.56);
    expect(fromCents(0)).toBe(0);
  });
});

describe('formatBRL', () => {
  it('formats cents as Brazilian currency', () => {
    expect(formatBRL(123456)).toBe('R$\u00a01.234,56');
  });

  it('formats zero', () => {
    expect(formatBRL(0)).toBe('R$\u00a00,00');
  });

  it('formats small values', () => {
    expect(formatBRL(100)).toBe('R$\u00a01,00');
  });
});

describe('parseBRL', () => {
  it('parses 1.234,56 to cents', () => {
    expect(parseBRL('1.234,56')).toBe(123456);
  });

  it('parses with R$ prefix', () => {
    expect(parseBRL('R$ 1.234,56')).toBe(123456);
  });

  it('parses without thousands separator', () => {
    expect(parseBRL('1234,56')).toBe(123456);
  });

  it('parses decimal only', () => {
    expect(parseBRL('0,50')).toBe(50);
  });

  it('parses whole reais', () => {
    expect(parseBRL('1.234')).toBe(123400);
  });

  it('returns NaN for unparseable input', () => {
    expect(Number.isNaN(parseBRL(''))).toBe(true);
  });

  it('returns NaN for misplaced minus sign', () => {
    expect(Number.isNaN(parseBRL('1-234,56'))).toBe(true);
  });

  it('returns NaN for non-numeric characters', () => {
    expect(Number.isNaN(parseBRL('12abc,34'))).toBe(true);
  });

  it('returns NaN for malformed grouping', () => {
    expect(Number.isNaN(parseBRL('12.34'))).toBe(true);
  });

  it('returns NaN for more than two decimals', () => {
    expect(Number.isNaN(parseBRL('1,234'))).toBe(true);
  });
});

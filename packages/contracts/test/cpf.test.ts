import { describe, expect, it } from 'vitest';

import { formatCpf, isValidCpf, normalizeCpf } from '../src/cpf.js';

describe('normalizeCpf', () => {
  it('strips formatting and keeps digits', () => {
    expect(normalizeCpf('021.805.141-73')).toBe('02180514173');
  });

  it('preserves leading zeros', () => {
    expect(normalizeCpf('02180514173')).toBe('02180514173');
  });

  it('pads shorter inputs to 11 digits', () => {
    expect(normalizeCpf('2180514173')).toBe('02180514173');
  });

  it('removes spaces and other characters', () => {
    expect(normalizeCpf(' 021.805.141-73 ')).toBe('02180514173');
  });
});

describe('isValidCpf', () => {
  it('accepts a valid CPF with leading zero', () => {
    expect(isValidCpf('01234567890')).toBe(true);
  });

  it('accepts a valid formatted CPF', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('accepts a valid unformatted CPF', () => {
    expect(isValidCpf('52998224725')).toBe(true);
  });

  it('accepts a valid CPF that needs padding', () => {
    expect(isValidCpf('1234567890')).toBe(true);
  });

  it('rejects repeated digits', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('00000000000')).toBe(false);
  });

  it('rejects wrong check digits', () => {
    expect(isValidCpf('52998224724')).toBe(false);
  });

  it('rejects too-short input', () => {
    expect(isValidCpf('123')).toBe(false);
  });

  it('rejects non-digit input', () => {
    expect(isValidCpf('abc')).toBe(false);
  });
});

describe('formatCpf', () => {
  it('formats an 11-digit CPF', () => {
    expect(formatCpf('02180514173')).toBe('021.805.141-73');
  });

  it('formats a formatted CPF idempotently', () => {
    expect(formatCpf('021.805.141-73')).toBe('021.805.141-73');
  });

  it('pads and formats a 10-digit CPF', () => {
    expect(formatCpf('2180514173')).toBe('021.805.141-73');
  });
});

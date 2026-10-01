import { describe, expect, it } from 'vitest';
import {
  cepSchema,
  createClientInputSchema,
  phoneSchema,
  updateMeInputSchema,
} from '../src/index.js';

describe('Brazilian contact validation', () => {
  it('accepts landline/mobile numbers and normalizes masks without losing digits', () => {
    expect(phoneSchema.parse('(11) 3333-4444')).toBe('1133334444');
    expect(phoneSchema.parse('(11) 98888-7777')).toBe('11988887777');
    expect(phoneSchema.parse('11988887777')).toBe('11988887777');
  });

  it('rejects incomplete, oversized and nonnumeric phone numbers with a Portuguese error', () => {
    for (const value of ['', '123', '119888877777', '1198888abcd']) {
      const result = phoneSchema.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0]?.message).toContain('telefone');
    }
  });

  it('normalizes formatted CEPs and preserves optional addresses and profile phones', () => {
    expect(cepSchema.parse('01001-000')).toBe('01001000');
    expect(cepSchema.parse('01001000')).toBe('01001000');
    expect(cepSchema.parse('')).toBe('');
    expect(updateMeInputSchema.parse({})).toEqual({});
    const client = {
      username: 'Cliente',
      email: 'cliente@example.test',
      cpf: '00000000353',
      phone: '(11) 3333-4444',
    };
    expect(createClientInputSchema.parse(client).cep).toBeUndefined();
    expect(createClientInputSchema.parse({ ...client, cep: '' }).cep).toBe('');
    expect(
      createClientInputSchema.parse({ ...client, cep: '01001-000' }).cep,
    ).toBe('01001000');
    expect(updateMeInputSchema.parse({ phone: '(11) 98888-7777' }).phone).toBe(
      '11988887777',
    );
  });

  it('rejects incomplete, oversized and nonnumeric CEPs with a Portuguese error', () => {
    for (const value of ['01001', '010010000', 'abcde-fgh']) {
      const result = cepSchema.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0]?.message).toContain('CEP');
    }
  });
});

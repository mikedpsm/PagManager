import { describe, expect, it } from 'vitest';
import {
  cepSchema,
  clientSchema,
  createClientInputSchema,
  phoneSchema,
  updateClientInputSchema,
  updateMeInputSchema,
  userSchema,
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

  it('reads historical contact strings unchanged from user and client responses', () => {
    const oldPhone = '123';
    const internationalPhone = '+1 (415) 555-2671';
    const oldCep = '01001';

    const user = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      username: 'Usuário legado',
      email: 'legacy@example.test',
      phone: oldPhone,
    };
    expect(userSchema.parse(user).phone).toBe(oldPhone);
    expect(userSchema.parse({ ...user, phone: internationalPhone }).phone).toBe(
      internationalPhone,
    );

    const client = {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      username: 'Cliente legado',
      email: 'legacy-client@example.test',
      cpf: '52998224725',
      phone: oldPhone,
      cep: oldCep,
      status: 'ok',
    };
    expect(clientSchema.parse(client).phone).toBe(oldPhone);
    expect(clientSchema.parse(client).cep).toBe(oldCep);
    expect(
      clientSchema.parse({ ...client, phone: internationalPhone }).phone,
    ).toBe(internationalPhone);
  });

  it('keeps strict phone and CEP validation on create and update inputs', () => {
    const client = {
      username: 'Cliente',
      email: 'cliente@example.test',
      cpf: '00000000353',
      phone: '11988887777',
    };

    for (const result of [
      createClientInputSchema.safeParse({ ...client, phone: '123' }),
      updateClientInputSchema.safeParse({ phone: '123' }),
      updateMeInputSchema.safeParse({ phone: '123' }),
    ]) {
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0]?.message).toContain('telefone');
    }

    for (const result of [
      createClientInputSchema.safeParse({ ...client, cep: '01001' }),
      updateClientInputSchema.safeParse({ cep: '01001' }),
    ]) {
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0]?.message).toContain('CEP');
    }
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

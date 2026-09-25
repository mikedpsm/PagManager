import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ptBrErrorMap } from '../src/i18n.js';

describe('ptBrErrorMap', () => {
  it('maps a missing required field', () => {
    const issue = {
      code: 'invalid_type',
      input: undefined,
      path: ['username'],
    };
    expect(ptBrErrorMap(issue)).toBe('Campo username é obrigatório');
  });

  it('maps a null required field', () => {
    const issue = { code: 'invalid_type', input: null, path: ['email'] };
    expect(ptBrErrorMap(issue)).toBe('Campo email é obrigatório');
  });

  it('maps a wrong type', () => {
    const issue = { code: 'invalid_type', input: 5, path: ['username'] };
    expect(ptBrErrorMap(issue)).toBe('Dados inválidos');
  });

  it('maps an invalid email', () => {
    const issue = {
      code: 'invalid_format',
      format: 'email',
      input: 'x',
      path: ['email'],
    };
    expect(ptBrErrorMap(issue)).toBe('Formato de email inválido!');
  });

  it('maps an empty email as required', () => {
    const issue = {
      code: 'invalid_format',
      format: 'email',
      input: '',
      path: ['email'],
    };
    expect(ptBrErrorMap(issue)).toBe('Campo email é obrigatório');
  });

  it('maps a too-short string', () => {
    const issue = {
      code: 'too_small',
      origin: 'string',
      minimum: 8,
      input: '123',
      path: ['passwd'],
    };
    expect(ptBrErrorMap(issue)).toBe('passwd deve ter pelo menos 8 caracteres');
  });

  it('maps an empty string as required', () => {
    const issue = {
      code: 'too_small',
      origin: 'string',
      minimum: 1,
      input: '',
      path: ['username'],
    };
    expect(ptBrErrorMap(issue)).toBe('Campo username é obrigatório');
  });

  it('maps a too-small number', () => {
    const issue = {
      code: 'too_small',
      origin: 'number',
      minimum: 0,
      input: -1,
      path: ['amountCents'],
    };
    expect(ptBrErrorMap(issue)).toBe('amountCents deve ser maior ou igual a 0');
  });

  it('maps a too-long string', () => {
    const issue = {
      code: 'too_big',
      origin: 'string',
      maximum: 2,
      input: 'SPO',
      path: ['uf'],
    };
    expect(ptBrErrorMap(issue)).toBe('uf deve ter no máximo 2 caracteres');
  });

  it('returns undefined for unmapped codes', () => {
    const issue = {
      code: 'unrecognized_keys',
      keys: ['x'],
      input: {},
      path: [],
    };
    expect(ptBrErrorMap(issue)).toBeUndefined();
  });
});

describe('global pt-BR locale', () => {
  it('applies to schema parses', () => {
    const schema = z.object({ username: z.string().min(1) });
    const result = schema.safeParse({});
    expect(result.error?.issues[0]?.message).toBe(
      'Campo username é obrigatório',
    );
  });

  it('maps empty required fields', () => {
    const schema = z.object({ username: z.string().min(1) });
    const result = schema.safeParse({ username: '' });
    expect(result.error?.issues[0]?.message).toBe(
      'Campo username é obrigatório',
    );
  });

  it('maps invalid email', () => {
    const schema = z.object({ email: z.email() });
    const result = schema.safeParse({ email: 'x' });
    expect(result.error?.issues[0]?.message).toBe('Formato de email inválido!');
  });

  it('maps empty email as required', () => {
    const schema = z.object({ email: z.email() });
    const result = schema.safeParse({ email: '' });
    expect(result.error?.issues[0]?.message).toBe('Campo email é obrigatório');
  });

  it('maps min length', () => {
    const schema = z.object({ passwd: z.string().min(8) });
    const result = schema.safeParse({ passwd: '123' });
    expect(result.error?.issues[0]?.message).toBe(
      'passwd deve ter pelo menos 8 caracteres',
    );
  });

  it('maps wrong type', () => {
    const schema = z.object({ username: z.string().min(1) });
    const result = schema.safeParse({ username: 5 });
    expect(result.error?.issues[0]?.message).toBe('Dados inválidos');
  });
});

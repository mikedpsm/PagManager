import { z } from 'zod';

export function ptBrErrorMap(issue: z.core.$ZodRawIssue): string | undefined {
  const field = (issue.path ?? []).join('.') || 'valor';
  switch (issue.code) {
    case 'invalid_type':
      if (issue.input == null) return `Campo ${field} é obrigatório`;
      return 'Dados inválidos';
    case 'invalid_format':
      if (issue.format === 'email') {
        if (String(issue.input ?? '').trim() === '') return `Campo ${field} é obrigatório`;
        return 'Formato de email inválido!';
      }
      return undefined;
    case 'too_small':
      if (issue.origin === 'string') {
        if (Number(issue.minimum) <= 1) return `Campo ${field} é obrigatório`;
        return `${field} deve ter pelo menos ${issue.minimum} caracteres`;
      }
      if (issue.origin === 'number') return `${field} deve ser maior ou igual a ${issue.minimum}`;
      return undefined;
    case 'too_big':
      if (issue.origin === 'string') return `${field} deve ter no máximo ${issue.maximum} caracteres`;
      return undefined;
    default:
      return undefined;
  }
}

z.config({ localeError: ptBrErrorMap });

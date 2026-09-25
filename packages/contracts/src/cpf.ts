import { z } from 'zod';

export function normalizeCpf(input: string): string {
  const digits = input.replace(/\D/g, '');
  return digits.padStart(11, '0');
}

function checkDigit(digits: string): string {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += (digits.charCodeAt(i) - 48) * (digits.length + 1 - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? '0' : String(11 - remainder);
}

export function isValidCpf(input: string): boolean {
  const digits = normalizeCpf(input);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  if (checkDigit(digits.slice(0, 9)) !== digits.charAt(9)) return false;
  return checkDigit(digits.slice(0, 10)) === digits.charAt(10);
}

export function formatCpf(input: string): string {
  const digits = normalizeCpf(input);
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export const cpfSchema = z.string().refine(isValidCpf, { error: 'CPF inválido' });

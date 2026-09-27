import { randomInt, randomUUID } from 'node:crypto';

import type { AuthResponse } from '@pagmanager/contracts';
import { type APIRequestContext, expect, type Page } from '@playwright/test';

export const testPassword = 'PagManagerE2E#2026';

export interface TestAccount {
  username: string;
  email: string;
  password: string;
  session: AuthResponse;
}

export async function registerApiAccount(
  request: APIRequestContext,
): Promise<TestAccount> {
  const id = randomUUID().replaceAll('-', '').slice(0, 12);
  const account = {
    username: `Pessoa E2E ${id}`,
    email: `fase6-${id}@example.test`,
    password: testPassword,
  };
  const response = await request.post('/api/v1/auth/register', {
    data: {
      username: account.username,
      email: account.email,
      passwd: account.password,
    },
  });

  expect(response.status()).toBe(201);
  return {
    ...account,
    session: (await response.json()) as AuthResponse,
  };
}

export async function openAuthenticatedPage(page: Page, session: AuthResponse) {
  await page.addInitScript(({ token, user }) => {
    window.localStorage.setItem('pagmanager.token', token);
    window.localStorage.setItem('pagmanager.user', JSON.stringify(user));
  }, session);
  await page.goto('/home');
  await expect(page.getByRole('heading', { name: /Olá,/ })).toBeVisible();
}

export async function createClientThroughUi(page: Page) {
  const id = randomUUID().replaceAll('-', '').slice(0, 12);
  const client = {
    username: `Cliente E2E ${id}`,
    email: `cliente-${id}@example.test`,
    cpf: createValidCpf(),
  };

  await page.goto('/clients');
  await page.getByRole('button', { name: 'Adicionar cliente' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome completo').fill(client.username);
  await dialog.getByLabel('E-mail').fill(client.email);
  await dialog.getByLabel('CPF').fill(client.cpf);
  await dialog.getByLabel('Telefone').fill('11999990000');
  await dialog.getByRole('button', { name: 'Criar cliente' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(client.username)).toBeVisible();
  return client;
}

export async function createInvoiceThroughUi(
  page: Page,
  clientName: string,
  input: { description: string; amount: string; dueDate: string },
) {
  await page.goto('/invoices');
  await page.getByRole('button', { name: 'Nova cobrança' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Cliente' }).click();
  await page.getByRole('option', { name: clientName }).click();
  await dialog.getByLabel('Descrição').fill(input.description);
  await dialog.getByLabel('Valor (R$)').fill(input.amount);
  await dialog.getByLabel('Vencimento').fill(input.dueDate);
  await dialog.getByRole('button', { name: 'Criar cobrança' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(input.description)).toBeVisible();
}

export function dateOffset(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function createValidCpf() {
  const digits = String(randomInt(100_000_000, 1_000_000_000));
  const firstCheck = cpfCheckDigit(digits, 10);
  const secondCheck = cpfCheckDigit(`${digits}${firstCheck}`, 11);
  return `${digits}${firstCheck}${secondCheck}`;
}

function cpfCheckDigit(digits: string, startingWeight: number) {
  const sum = [...digits].reduce(
    (total, digit, index) => total + Number(digit) * (startingWeight - index),
    0,
  );
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

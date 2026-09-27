import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import {
  createClientThroughUi,
  createInvoiceThroughUi,
  dateOffset,
  openAuthenticatedPage,
  registerApiAccount,
  testPassword,
} from './helpers.js';

test('registers, logs in, edits the profile, and logs out', async ({
  page,
}) => {
  const id = randomUUID().replaceAll('-', '').slice(0, 12);
  const account = {
    username: `Conta E2E ${id}`,
    email: `cadastro-${id}@example.test`,
    password: testPassword,
  };

  await page.goto('/register?step=1');
  await page.getByLabel('Nome').fill(account.username);
  await page.getByLabel('E-mail').fill(account.email);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page).toHaveURL(/\/register\?step=2$/);

  await page.getByLabel('Senha', { exact: true }).fill(account.password);
  await page.getByLabel('Confirme sua senha').fill(account.password);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(
    page.getByRole('heading', { name: 'Conta criada!' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Acessar minha conta' }).click();
  await expect(page).toHaveURL(/\/home$/);

  await logout(page);
  await page.getByLabel('E-mail').fill(account.email);
  await page.getByLabel('Senha', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(
    page.getByRole('heading', {
      name: `Olá, ${account.username.split(' ')[0]}`,
    }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Abrir menu do perfil' }).click();
  await page.getByRole('menuitem', { name: 'Perfil e configurações' }).click();
  const profile = page.getByRole('dialog');
  const updatedName = `${account.username} Atualizada`;
  await profile.getByLabel('Nome').fill(updatedName);
  await profile.getByLabel('Telefone').fill('11988887777');
  await profile.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(profile).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Abrir menu do perfil' }),
  ).toContainText(updatedName);

  await logout(page);
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('creates a client and invoices, marks one paid, and shows dashboard totals', async ({
  page,
  request,
}) => {
  const account = await registerApiAccount(request);
  await openAuthenticatedPage(page, account.session);

  const client = await createClientThroughUi(page);
  const paidDescription = 'Cobrança paga E2E';
  const pendingDescription = 'Cobrança pendente E2E';
  const overdueDescription = 'Cobrança vencida E2E';

  await createInvoiceThroughUi(page, client.username, {
    description: paidDescription,
    amount: '123,45',
    dueDate: dateOffset(14),
  });
  await createInvoiceThroughUi(page, client.username, {
    description: pendingDescription,
    amount: '67,89',
    dueDate: dateOffset(14),
  });
  await createInvoiceThroughUi(page, client.username, {
    description: overdueDescription,
    amount: '25,00',
    dueDate: dateOffset(-14),
  });

  const paidRow = page.getByRole('row', {
    name: new RegExp(paidDescription),
  });
  await paidRow
    .getByRole('button', { name: `Marcar ${paidDescription} como paga` })
    .click();
  await expect(paidRow.getByText('Paga')).toBeVisible();

  await page.goto('/home');
  const summary = page.getByRole('region', { name: 'Resumo de cobranças' });
  await expect(summary.getByText('Recebido').locator('..')).toContainText(
    '123,45',
  );
  await expect(summary.getByText('A vencer').locator('..')).toContainText(
    '67,89',
  );
  await expect(summary.getByText('Em atraso').locator('..')).toContainText(
    '25,00',
  );
});

test('redirects to login after an authenticated request receives 401', async ({
  page,
  request,
}) => {
  const account = await registerApiAccount(request);
  await openAuthenticatedPage(page, account.session);

  await page.evaluate(() => {
    window.localStorage.setItem('pagmanager.token', 'expired.invalid.token');
  });
  await page.getByRole('link', { name: 'Clientes' }).first().click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('deleting a client removes its invoices from the authenticated API', async ({
  page,
  request,
}) => {
  const account = await registerApiAccount(request);
  await openAuthenticatedPage(page, account.session);
  const client = await createClientThroughUi(page);
  const description = 'Cobrança removida em cascata';
  await createInvoiceThroughUi(page, client.username, {
    description,
    amount: '45,00',
    dueDate: dateOffset(14),
  });

  const headers = { Authorization: `Bearer ${account.session.token}` };
  const clientsResponse = await request.get('/api/v1/clients', { headers });
  const clients = (await clientsResponse.json()) as Array<{
    id: string;
    username: string;
  }>;
  const createdClient = clients.find(
    (item) => item.username === client.username,
  );
  expect(createdClient).toBeDefined();

  const invoicesResponse = await request.get('/api/v1/invoices', { headers });
  const invoices = (await invoicesResponse.json()) as Array<{
    id: string;
    clientId: string;
    description: string;
  }>;
  const createdInvoice = invoices.find(
    (item) => item.description === description,
  );
  expect(createdInvoice).toBeDefined();

  const deleteResponse = await request.delete(
    `/api/v1/clients/${createdClient?.id}`,
    { headers },
  );
  expect(deleteResponse.status()).toBe(204);

  const remainingResponse = await request.get('/api/v1/invoices', {
    headers,
  });
  const remainingInvoices = (await remainingResponse.json()) as Array<{
    id: string;
  }>;
  expect(
    remainingInvoices.some((invoice) => invoice.id === createdInvoice?.id),
  ).toBe(false);
  expect(
    (
      await request.get(`/api/v1/invoices/${createdInvoice?.id}`, { headers })
    ).status(),
  ).toBe(404);
});

async function logout(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Abrir menu do perfil' }).click();
  await page.getByRole('menuitem', { name: 'Sair da conta' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

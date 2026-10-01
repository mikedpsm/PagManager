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
  request,
}) => {
  const styleViolations: string[] = [];
  await page.exposeFunction('reportStyleViolation', (directive: string) => {
    styleViolations.push(directive);
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      if (event.effectiveDirective.startsWith('style-src')) {
        const report = (
          window as typeof window & {
            reportStyleViolation: (directive: string) => Promise<void>;
          }
        ).reportStyleViolation;
        void report(event.effectiveDirective);
      }
    });
  });
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
  const theme = page.getByRole('combobox', { name: 'Tema de aparência' });
  await theme.selectOption('dark');
  await page.reload();
  await expect(theme).toHaveValue('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(theme).toBeVisible();
  await theme.focus();
  await expect(theme).toBeFocused();
  await theme.selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 720 });

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
  await expect(profile).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-scroll-locked', '1');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  const updatedName = `${account.username} Atualizada`;
  const updatedEmail = `atualizada-${id}@example.test`;
  const updatedPassword = `${account.password}-updated`;
  await profile.getByLabel('Nome').fill(updatedName);
  await profile.getByLabel('E-mail').fill(updatedEmail);
  await profile.getByLabel('CPF').fill('00000000353');
  await profile.getByLabel('Telefone').fill('123');
  await profile.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(
    profile.getByText('Informe um telefone com DDD e 10 ou 11 dígitos.'),
  ).toBeVisible();
  await expect(profile).toBeVisible();
  await profile.getByLabel('Telefone').fill('11988887777');
  await expect(profile.getByLabel('CPF')).toHaveValue('000.000.003-53');
  await expect(profile.getByLabel('Telefone')).toHaveValue('(11) 98888-7777');
  await profile.getByLabel('Nova senha', { exact: true }).fill(updatedPassword);
  await profile
    .getByLabel('Senha atual', { exact: true })
    .fill(account.password);
  await profile
    .getByLabel('Confirmar senha', { exact: true })
    .fill(updatedPassword);
  await profile.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(profile).toBeHidden();
  await expect(page.locator('body')).not.toHaveAttribute('data-scroll-locked');
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await expect(
    page.getByText('Perfil atualizado.', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-sonner-toaster]')).toHaveCSS(
    'position',
    'fixed',
  );
  await expect(
    page
      .locator('[data-sonner-toast]')
      .filter({ hasText: 'Perfil atualizado.' }),
  ).toHaveCSS('position', 'absolute');
  expect(styleViolations).toEqual([]);
  await expect(
    page.getByRole('button', { name: 'Abrir menu do perfil' }),
  ).toContainText(updatedName);

  await logout(page);
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  const oldCredentials = await request.post('/api/v1/auth/login', {
    data: { email: updatedEmail, passwd: account.password },
  });
  expect(oldCredentials.status()).toBe(401);
  await page.getByLabel('E-mail').fill(updatedEmail);
  await page.getByLabel('Senha', { exact: true }).fill(updatedPassword);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.getByRole('button', { name: 'Abrir menu do perfil' }).click();
  await page.getByRole('menuitem', { name: 'Perfil e configurações' }).click();
  await expect(profile.getByLabel('Nome')).toHaveValue(updatedName);
  await expect(profile.getByLabel('E-mail')).toHaveValue(updatedEmail);
  await expect(profile.getByLabel('CPF')).toHaveValue('000.000.003-53');
  await expect(profile.getByLabel('Telefone')).toHaveValue('(11) 98888-7777');
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
  await expect(paidRow.getByText('Paga', { exact: true })).toBeVisible();

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

  await page.goto('/clients');
  await page
    .getByRole('link', { name: new RegExp(createdClient?.username ?? '') })
    .click();
  await page.getByRole('button', { name: 'Excluir cliente' }).click();
  const confirmation = page.getByRole('dialog');
  await expect(confirmation).toContainText('todas as cobranças vinculadas');
  await confirmation.getByRole('button', { name: 'Excluir cliente' }).click();
  await expect(page).toHaveURL(/\/clients$/);
  await expect(page.getByText(createdClient?.username ?? '')).toBeHidden();

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

test('searches and filters clients, edits client details, and filters, edits and deletes invoices', async ({
  page,
  request,
}) => {
  const account = await registerApiAccount(request);
  await openAuthenticatedPage(page, account.session);
  const client = await createClientThroughUi(page);
  const otherClient = await createClientThroughUi(page);
  await page.getByLabel('Buscar clientes').fill(client.email);
  await expect(page.getByText(client.username)).toBeVisible();
  await expect(page.getByText(otherClient.username)).toBeHidden();
  await page.getByRole('link', { name: new RegExp(client.username) }).click();
  await page
    .getByRole('button', { name: 'Editar cliente', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  const updatedName = `${client.username} Revisado`;
  await dialog.getByLabel('Nome completo').fill(updatedName);
  await dialog.getByLabel('Telefone').fill('1133334444');
  await dialog.getByLabel('CEP').fill('01001');
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(dialog.getByText('Informe um CEP com 8 dígitos.')).toBeVisible();
  await expect(dialog).toBeVisible();
  await page.route('https://viacep.com.br/ws/01001000/json/', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        logradouro: 'Praça da Sé',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    }),
  );
  await dialog.getByLabel('CEP').fill('01001000');
  await dialog.getByRole('button', { name: 'Buscar endereço' }).click();
  await expect(dialog.getByLabel('Cidade')).toHaveValue('São Paulo');
  await expect(dialog.getByLabel('Telefone')).toHaveValue('(11) 3333-4444');
  await expect(dialog.getByLabel('CEP')).toHaveValue('01001-000');
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
  await page
    .getByRole('button', { name: 'Editar cliente', exact: true })
    .click();
  await expect(dialog.getByLabel('CEP')).toHaveValue('01001-000');
  await dialog.getByRole('button', { name: 'Cancelar' }).click();

  const overdue = 'Cobrança vencida para filtro';
  const pending = 'Cobrança futura para filtro';
  const updatedDescription = 'Cobrança revisada para exclusão';
  await createInvoiceThroughUi(page, updatedName, {
    description: overdue,
    amount: '12,34',
    dueDate: dateOffset(-14),
  });
  await createInvoiceThroughUi(page, otherClient.username, {
    description: pending,
    amount: '56,78',
    dueDate: dateOffset(14),
  });
  await page.getByRole('combobox', { name: 'Filtrar por situação' }).click();
  await page.getByRole('option', { name: 'Em atraso', exact: true }).click();
  await expect(page.getByText(overdue, { exact: true })).toBeVisible();
  await expect(page.getByText(pending, { exact: true })).toBeHidden();
  await page
    .getByRole('button', { name: `Editar ${overdue}`, exact: true })
    .click();
  await dialog.getByLabel('Descrição').fill(updatedDescription);
  await dialog.getByLabel('Valor (R$)').fill('98,76');
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(dialog).toBeHidden();
  const row = page.getByRole('row', { name: new RegExp(updatedDescription) });
  await expect(row).toContainText('98,76');
  await page
    .getByRole('button', { name: `Excluir ${updatedDescription}`, exact: true })
    .click();
  await dialog
    .getByRole('button', { name: 'Excluir cobrança', exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(row).toBeHidden();

  await page.goto('/clients');
  await page.getByRole('combobox', { name: 'Situação', exact: true }).click();
  await page.getByRole('option', { name: 'Em atraso', exact: true }).click();
  await expect(
    page.getByRole('link', { name: new RegExp(updatedName) }),
  ).toBeHidden();
  await page.getByRole('combobox', { name: 'Situação', exact: true }).click();
  await page.getByRole('option', { name: 'Em dia', exact: true }).click();
  await expect(
    page.getByRole('link', { name: new RegExp(updatedName) }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: new RegExp(otherClient.username) }),
  ).toBeVisible();
});

async function logout(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Abrir menu do perfil' }).click();
  await page.getByRole('menuitem', { name: 'Sair da conta' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

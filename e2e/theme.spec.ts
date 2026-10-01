import { expect, test } from '@playwright/test';

test('appearance persists and follows system changes on public pages', async ({
  page,
}) => {
  const violations: string[] = [];
  await page.exposeFunction('themeCspViolation', (directive: string) =>
    violations.push(directive),
  );
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      if (
        event.effectiveDirective.startsWith('script-src') &&
        (event.sourceFile.endsWith('/theme.js') ||
          event.blockedURI.endsWith('/theme.js'))
      ) {
        void (
          window as typeof window & {
            themeCspViolation: (value: string) => Promise<void>;
          }
        ).themeCspViolation(event.effectiveDirective);
      }
    });
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  const response = await page.goto('/login');
  const csp = response?.headers()['content-security-policy'] ?? '';
  const scriptPolicy = csp
    .split(';')
    .find((directive) => directive.trim().startsWith('script-src '));
  expect(scriptPolicy).toContain("'self'");
  expect(scriptPolicy).not.toContain("'unsafe-inline'");
  expect(scriptPolicy).not.toContain("'unsafe-eval'");
  await expect(page.locator('script[src="/theme.js"]')).toHaveCount(1);
  const theme = page.getByRole('combobox', { name: 'Tema de aparência' });
  await expect(theme).toHaveValue('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await theme.selectOption('light');
  await page.reload();
  await expect(theme).toHaveValue('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('/register?step=1');
  await theme.selectOption('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await theme.selectOption('dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#111b18',
  );

  expect(violations).toEqual([]);
});

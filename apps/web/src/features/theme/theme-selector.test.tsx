import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeSelector, useTheme } from './theme-selector';

const bootstrap = readFileSync(
  new NodeURL('../../../public/theme.js', import.meta.url),
  'utf8',
);
let systemChange: () => void;
let dark = false;

function Status() {
  const { resolved } = useTheme();
  return <output aria-label="Tema aplicado">{resolved}</output>;
}

function initialize() {
  // Execute the actual parser-blocking bootstrap, including storage failure paths.
  new Function(bootstrap)();
}

beforeEach(() => {
  localStorage.clear();
  dark = false;
  document.head.innerHTML = '<meta name="theme-color" content="#f5f7f5">';
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return dark;
    },
    addEventListener: (_event: string, callback: () => void) => {
      systemChange = callback;
    },
  }));
});

describe('appearance preference', () => {
  it('applies a persisted choice before React renders and updates browser chrome', () => {
    localStorage.setItem('pagmanager.theme', 'dark');
    initialize();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      '#111b18',
    );
    render(
      <>
        <ThemeSelector />
        <Status />
      </>,
    );
    expect(
      screen.getByRole('combobox', { name: 'Tema de aparência' }),
    ).toHaveValue('dark');
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'light' },
    });
    expect(localStorage.getItem('pagmanager.theme')).toBe('light');
    expect(screen.getByLabelText('Tema aplicado')).toHaveTextContent('light');
  });

  it('follows operating-system changes only in system mode and re-renders subscribers', () => {
    initialize();
    render(
      <>
        <ThemeSelector />
        <Status />
      </>,
    );
    act(() => {
      dark = true;
      systemChange();
    });
    expect(screen.getByLabelText('Tema aplicado')).toHaveTextContent('dark');
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'light' },
    });
    act(() => {
      dark = false;
      systemChange();
      dark = true;
      systemChange();
    });
    expect(screen.getByLabelText('Tema aplicado')).toHaveTextContent('light');
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'system' },
    });
    expect(screen.getByLabelText('Tema aplicado')).toHaveTextContent('dark');
  });

  it('keeps working when storage is unavailable and ignores invalid preferences', () => {
    const get = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    const set = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    initialize();
    window.pagmanagerTheme.setPreference('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    window.pagmanagerTheme.setPreference('invalid' as 'dark');
    expect(window.pagmanagerTheme.getPreference()).toBe('dark');
    get.mockRestore();
    set.mockRestore();
  });

  it('synchronizes preferences from another tab and storage reset', () => {
    initialize();
    render(
      <>
        <ThemeSelector />
        <Status />
      </>,
    );
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'pagmanager.theme',
          newValue: 'dark',
        }),
      ),
    );
    expect(screen.getByRole('combobox')).toHaveValue('dark');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: null })));
    expect(screen.getByRole('combobox')).toHaveValue('system');
  });
});

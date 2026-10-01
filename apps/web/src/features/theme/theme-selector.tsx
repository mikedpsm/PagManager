import { useSyncExternalStore } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

declare global {
  interface Window {
    pagmanagerTheme: {
      getPreference: () => ThemePreference;
      setPreference: (preference: ThemePreference) => void;
    };
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('pagmanager:theme', callback);
  return () => window.removeEventListener('pagmanager:theme', callback);
}

export function useTheme() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () =>
      `${window.pagmanagerTheme?.getPreference() ?? 'system'}:${document.documentElement.dataset.theme ?? 'light'}`,
  );
  const [preference, resolved] = snapshot.split(':') as [
    ThemePreference,
    'light' | 'dark',
  ];
  return {
    preference,
    resolved,
    setPreference: (value: ThemePreference) =>
      window.pagmanagerTheme?.setPreference(value),
  } as const;
}

export function ThemeSelector() {
  const { preference, setPreference } = useTheme();
  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium text-muted">
      <span className="sr-only sm:not-sr-only">Tema</span>
      <select
        aria-label="Tema de aparência"
        value={preference}
        onChange={(event) =>
          setPreference(event.target.value as ThemePreference)
        }
        className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink"
      >
        <option value="light">Claro</option>
        <option value="dark">Escuro</option>
        <option value="system">Sistema</option>
      </select>
    </label>
  );
}

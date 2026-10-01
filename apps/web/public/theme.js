(() => {
  const key = 'pagmanager.theme';
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try {
    const saved = localStorage.getItem(key);
    if (['light', 'dark', 'system'].includes(saved)) preference = saved;
  } catch {}
  function apply() {
    const resolved =
      preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = preference;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = resolved === 'dark' ? '#111b18' : '#f5f7f5';
    window.dispatchEvent(new Event('pagmanager:theme'));
  }
  window.pagmanagerTheme = {
    getPreference: () => preference,
    setPreference(value) {
      if (!['light', 'dark', 'system'].includes(value)) return;
      preference = value;
      try {
        localStorage.setItem(key, value);
      } catch {}
      apply();
    },
  };
  media.addEventListener('change', apply);
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return;
    preference = ['light', 'dark', 'system'].includes(event.newValue)
      ? event.newValue
      : 'system';
    apply();
  });
  apply();
})();

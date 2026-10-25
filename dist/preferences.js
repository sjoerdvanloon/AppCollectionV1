(() => {
  const key = 'appcollection.preferences.v1';
  function normalize(value) {
    const data = value && typeof value === 'object' ? value : {};
    return {
      layout: data.layout === 'posters' ? 'posters' : 'compact',
      showStack: data.showStack !== false,
      favorites: Array.isArray(data.favorites) ? [...new Set(data.favorites.filter(n => typeof n === 'string'))] : []
    };
  }
  function read() {
    try { return normalize(JSON.parse(localStorage.getItem(key))); }
    catch { return normalize(null); }
  }
  function save(value) {
    try { localStorage.setItem(key, JSON.stringify(normalize(value))); } catch {}
  }
  const current = read();
  document.documentElement.dataset.layout = current.layout;
  document.documentElement.dataset.stack = String(current.showStack);
  window.AppPreferences = { normalize, read, save, current };
})();

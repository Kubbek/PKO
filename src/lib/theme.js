const THEME_KEY = 'pko_theme'
export const THEMES = ['dark', 'light']

export function getTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'dark' } catch { return 'dark' }
}

export function setTheme(t) {
  if (!THEMES.includes(t)) return
  document.documentElement.setAttribute('data-theme', t)
  try { localStorage.setItem(THEME_KEY, t) } catch {}
}

export function initTheme() { setTheme(getTheme()) }

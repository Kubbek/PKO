import { useState } from 'react'
import { setTheme, getTheme, THEMES } from '../lib/theme'

const CFG = {
  dark:  { label: '◐ Ciemny' },
  light: { label: '◑ Jasny'  },
}

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState(getTheme())
  function handle(t) { setTheme(t); setCurrent(t) }

  return (
    <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 999, border: '1px solid var(--border2)', padding: 3, gap: 2, flexShrink: 0 }}>
      {THEMES.map(t => {
        const on = current === t
        return (
          <button key={t} onClick={() => handle(t)}
            style={{ height: 26, padding: '0 12px', borderRadius: 999, border: 'none', background: on ? 'var(--bg3)' : 'transparent', color: on ? 'var(--gold)' : 'var(--text3)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope,sans-serif', letterSpacing: '.04em', transition: 'all .15s', boxShadow: on ? '0 1px 4px rgba(0,0,0,.15)' : 'none', whiteSpace: 'nowrap' }}>
            {CFG[t].label}
          </button>
        )
      })}
    </div>
  )
}

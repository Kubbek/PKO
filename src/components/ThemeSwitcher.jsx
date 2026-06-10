import { useState } from 'react'
import { setTheme, getTheme, THEMES } from '../lib/theme'

const CFG = {
  amber: { color: '#f59e0b', bg: '#080a0d', label: 'Neon' },
  light: { color: '#b45309', bg: '#faf9f7', label: 'Biały' },
  mega:  { color: '#d4a853', bg: '#04090f', label: 'Mega' },
}

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState(getTheme())
  function handle(t) { setTheme(t); setCurrent(t) }
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {THEMES.map(t => {
        const c = CFG[t]
        const on = current === t
        return (
          <button key={t} onClick={() => handle(t)} title={c.label}
            style={{ height: 28, padding: '0 10px', borderRadius: 999, border: `1px solid ${on ? c.color : 'rgba(255,255,255,.1)'}`, background: on ? `${c.color}18` : 'transparent', color: on ? c.color : '#6f7984', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Manrope,sans-serif', letterSpacing: '.04em', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, opacity: on ? 1 : .4, flexShrink: 0 }} />
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

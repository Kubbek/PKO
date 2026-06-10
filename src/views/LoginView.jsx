import { useState } from 'react'
import { useToast } from '../lib/useToast'
import ThemeSwitcher from '../components/ThemeSwitcher'

export default function LoginView({ onLogin, tournament }) {
  const [role, setRole] = useState('spectator')
  const [table, setTable] = useState('1')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { show, ToastContainer } = useToast()

  function handleSubmit(e) {
    e.preventDefault()
    const ok = onLogin(role, table ? parseInt(table) : null, password)
    if (!ok) { setError('Nieprawidłowe hasło'); setTimeout(() => setError(''), 2000) }
  }

  const roles = [
    { id: 'td',        icon: '◈', label: 'Tournament Director', desc: 'Pełna kontrola' },
    { id: 'dealer',    icon: '◉', label: 'Dealer',              desc: 'Widok stołu' },
    { id: 'spectator', icon: '◎', label: 'Gracz',               desc: 'Tylko odczyt' },
  ]

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', backgroundImage: 'var(--gradient-top)', padding: '1rem', position: 'relative' }}>
      <ToastContainer />
      <div style={{ position: 'absolute', top: 16, right: 16 }}><ThemeSwitcher /></div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div className="app-logo-icon" style={{ width: 48, height: 48, fontSize: 24 }}>♠</div>
            <div style={{ textAlign: 'left' }}>
              <div className="app-series">PKO Bounty Tracker</div>
              <div style={{ fontFamily: 'Saira Condensed, sans-serif', fontSize: 32, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1, lineHeight: 1 }}>PKO TRACKER</div>
            </div>
          </div>
          {tournament && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--green-bg)', border: '1px solid var(--green-border)', padding: '4px 14px', borderRadius: 20, marginTop: 8 }}>
              <div style={{ width: 7, height: 7, background: 'var(--green)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, letterSpacing: '.1em' }}>
                NA ŻYWO · {tournament.players?.filter(p => p.active).length || 0} graczy
              </span>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1.5rem' }}>
            {roles.map(r => (
              <button key={r.id} type="button" onClick={() => { setRole(r.id); setPassword('') }}
                style={{ padding: '14px 8px', border: `1px solid ${role===r.id ? 'rgba(233,185,73,.4)' : 'var(--border)'}`, background: role===r.id ? 'var(--gold-bg)' : 'var(--bg2)', color: role===r.id ? 'var(--gold)' : 'var(--text3)', borderRadius: 12, cursor: 'pointer', textAlign: 'center', transition: 'all .15s', boxShadow: role===r.id ? 'inset 0 0 0 1px rgba(233,185,73,.2)' : 'none' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2, color: role===r.id ? 'var(--gold)' : 'var(--text2)' }}>{r.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{r.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {role === 'dealer' && (
              <div className="field">
                <label>Numer stołu</label>
                <select value={table} onChange={e => setTable(e.target.value)}>
                  {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={i+1}>Stół {i+1}</option>)}
                </select>
              </div>
            )}
            {(role === 'td' || role === 'dealer') && (
              <div className="field">
                <label>Hasło</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
              </div>
            )}
            {error && <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', marginBottom: '.75rem', fontWeight: 700 }}>{error}</div>}
            <button type="submit" className="btn btn-accent btn-full" style={{ fontSize: 14, letterSpacing: '.06em' }}>WEJDŹ</button>
          </form>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}

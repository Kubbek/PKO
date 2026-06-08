import { useState, useEffect } from 'react'
import { r2 } from '../lib/bounty'
import ThemeSwitcher from '../components/ThemeSwitcher'
import OvalTable from '../components/OvalTable'

function useOrientation() {
  const [landscape, setLandscape] = useState(window.innerWidth > window.innerHeight)
  useEffect(() => {
    const fn = () => setLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return landscape
}

export default function SpectatorView({ tournament, onLogout }) {
  const [tab, setTab] = useState('ranking')
  const [viewTable, setViewTable] = useState(null)
  const landscape = useOrientation()

  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const activePlayers = players.filter(p => p.active)
  const sorted = [...activePlayers].sort((a, b) => b.bounty - a.bounty)
  const tables = [...new Set(activePlayers.map(p => p.table_num))].sort((a, b) => a - b)
  const currentTable = viewTable || tables[0] || 1

  if (!tournament) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12, background: 'var(--bg)' }}>
      <div className="app-logo" style={{ fontSize: 40 }}>PKO</div>
      <div style={{ color: 'var(--text2)', fontSize: 14 }}>Turniej nie został jeszcze uruchomiony...</div>
    </div>
  )

  // ── SHARED BITS ──────────────────────────────────────
  const Header = ({ compact = false }) => (
    <div style={{ padding: compact ? '8px 14px' : '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      <div>
        <div className="app-logo" style={{ fontSize: compact ? 17 : 20, letterSpacing: 2 }}>PKO TRACKER</div>
        {!compact && (
          <div className="live-badge" style={{ display: 'inline-flex', marginTop: 4 }}>
            <div className="live-dot" />LIVE · {activePlayers.length} graczy
          </div>
        )}
        {compact && <span className="live-badge" style={{ display: 'inline-flex', marginLeft: 8, padding: '2px 8px', fontSize: 10 }}><div className="live-dot" />{activePlayers.length}</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <ThemeSwitcher />
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={onLogout}>← Wróć</button>
      </div>
    </div>
  )

  const StatsStrip = ({ compact = false }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: compact ? 6 : 8, padding: compact ? '8px 12px' : '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      {[['Graczy', activePlayers.length, true], ['Eliminacje', eliminations.length, false], ['Top bounty', r2(sorted[0]?.bounty || 0) + ' zł', false]].map(([l, v, acc]) => (
        <div key={l} style={{ textAlign: 'center', background: 'var(--bg3)', borderRadius: 9, padding: compact ? '6px 4px' : '9px 6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 9, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3, fontWeight: 600 }}>{l}</div>
          <div style={{ fontFamily: 'var(--num-font)', fontSize: compact ? 18 : 22, color: acc ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>{v}</div>
        </div>
      ))}
    </div>
  )

  const RankingList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sorted.map((p, i) => (
        <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 10, padding: '10px 12px', background: i === 0 ? 'var(--accent-bg)' : 'var(--bg3)', border: `1px solid ${i === 0 ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 11, alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--num-font)', fontSize: 20, color: i === 0 ? 'var(--accent)' : i < 3 ? 'var(--text2)' : 'var(--text3)', textAlign: 'center', lineHeight: 1 }}>{i === 0 ? '♛' : i + 1}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: i === 0 ? 'var(--accent2)' : 'var(--text)' }}>
              {p.name}
              {p.rebuys > 1 && <span className="badge badge-accent" style={{ marginLeft: 5 }}>R{p.rebuys}</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              St.{p.table_num} · Msc.{p.seat}
              {eliminations.filter(e => e.winner_name === p.name).length > 0 && (
                <span className="badge badge-green">{eliminations.filter(e => e.winner_name === p.name).length} elim.</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--num-font)', fontSize: 18, color: 'var(--accent)', lineHeight: 1 }}>{r2(p.bounty)} zł</div>
            <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>+{r2(p.pocket_bounty)} zł</div>
          </div>
        </div>
      ))}
      {sorted.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '2rem 0' }}>Brak aktywnych graczy</div>}
    </div>
  )

  const TableSelector = () => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
      {tables.map(t => (
        <button key={t} className={`table-btn${currentTable === t ? ' active' : ''}`} style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setViewTable(t)}>
          Stół {t} <span style={{ opacity: 0.6, fontSize: 10 }}>· {activePlayers.filter(p => p.table_num === t).length}/9</span>
        </button>
      ))}
    </div>
  )

  const TablePlayerList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
      {activePlayers.filter(p => p.table_num === currentTable).sort((a, b) => a.seat - b.seat).map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--bg3)', borderRadius: 9, border: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, marginRight: 8 }}>{p.seat}</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
            {p.rebuys > 1 && <span className="badge badge-accent" style={{ marginLeft: 5 }}>R{p.rebuys}</span>}
          </div>
          <span style={{ fontFamily: 'var(--num-font)', fontSize: 17, color: 'var(--accent)' }}>{r2(p.bounty)} zł</span>
        </div>
      ))}
    </div>
  )

  const Feed = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {[...eliminations].reverse().slice(0, 50).map(e => (
        <div key={e.id} className="log-entry" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '9px 12px' }}>
          <div><strong style={{ color: 'var(--green)' }}>{e.winner_name}</strong><span style={{ color: 'var(--text3)', margin: '0 5px' }}>→</span><strong style={{ color: 'var(--red)' }}>{e.loser_name}</strong></div>
          <span style={{ fontFamily: 'var(--num-font)', fontSize: 16, color: 'var(--accent)', flexShrink: 0, marginLeft: 8 }}>+{e.pocket} zł</span>
        </div>
      ))}
      {eliminations.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '2rem 0' }}>Brak eliminacji</div>}
    </div>
  )

  const BottomNav = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, padding: '6px 10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg3)', flexShrink: 0 }}>
      {[['ranking', '🏆', 'Ranking'], ['tables', '🃏', 'Stoły'], ['feed', '⚡', 'Eliminacje']].map(([id, icon, label]) => (
        <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px', border: 'none', cursor: 'pointer', background: tab === id ? 'var(--accent-bg)' : 'transparent', borderRadius: 10, color: tab === id ? 'var(--accent)' : 'var(--text2)', transition: 'all 0.15s' }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
        </button>
      ))}
    </div>
  )

  // ── PORTRAIT ─────────────────────────────────────────
  if (!landscape) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', maxWidth: 520, margin: '0 auto' }}>
      <Header />
      <StatsStrip />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 8px' }}>
        {tab === 'ranking' && <RankingList />}
        {tab === 'tables' && <><TableSelector /><OvalTable players={activePlayers} tableNum={currentTable} readOnly /><TablePlayerList /></>}
        {tab === 'feed' && <Feed />}
      </div>
      <BottomNav />
    </div>
  )

  // ── LANDSCAPE ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      <Header compact />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', overflow: 'hidden' }}>

        {/* Left – main content */}
        <div style={{ overflowY: 'auto', padding: '10px 12px' }}>
          {/* Tab buttons horizontal */}
          <div className="tab-bar" style={{ marginBottom: 10 }}>
            {[['ranking', '🏆 Ranking'], ['tables', '🃏 Stoły'], ['feed', '⚡ Eliminacje']].map(([id, label]) => (
              <button key={id} className={`tab-btn${tab === id ? ' active' : ''}`} onClick={() => setTab(id)} style={{ fontSize: 12 }}>{label}</button>
            ))}
          </div>
          {tab === 'ranking' && <RankingList />}
          {tab === 'tables' && (
            <div>
              <TableSelector />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                {tables.map(t => (
                  <div key={t} style={{ flex: '1 1 220px', maxWidth: 320 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text3)', marginBottom: 6 }}>
                      Stół {t} · {activePlayers.filter(p=>p.table_num===t).length}/9
                    </div>
                    <OvalTable players={activePlayers} tableNum={t} readOnly />
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'feed' && <Feed />}
        </div>

        {/* Right – stats sidebar */}
        <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg2)' }}>
          <StatsStrip compact />
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text3)', marginBottom: 8 }}>Ostatnie eliminacje</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...eliminations].reverse().slice(0, 15).map(e => (
                <div key={e.id} style={{ padding: '6px 10px', background: 'var(--bg3)', borderRadius: 7, borderLeft: '2px solid var(--accent-dim)', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong style={{ color: 'var(--green)' }}>{e.winner_name}</strong><span style={{ color: 'var(--text3)', margin: '0 4px' }}>→</span><strong style={{ color: 'var(--red)' }}>{e.loser_name}</strong></span>
                    <span style={{ fontFamily: 'var(--num-font)', color: 'var(--accent)', fontSize: 14 }}>+{e.pocket}</span>
                  </div>
                </div>
              ))}
              {eliminations.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 12 }}>Brak eliminacji</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

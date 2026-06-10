import { useState, useEffect } from 'react'
import { r2 } from '../lib/bounty'
import ThemeSwitcher from '../components/ThemeSwitcher'
import OvalTable from '../components/OvalTable'

function useLayout() {
  const get = () => ({ mobile: window.innerWidth < 768, landscape: window.innerWidth > window.innerHeight })
  const [layout, setLayout] = useState(get)
  useEffect(() => {
    const fn = () => setTimeout(() => setLayout(get()), 50)
    window.addEventListener('resize', fn)
    window.addEventListener('orientationchange', fn)
    if (screen.orientation) screen.orientation.addEventListener('change', fn)
    return () => {
      window.removeEventListener('resize', fn)
      window.removeEventListener('orientationchange', fn)
      if (screen.orientation) screen.orientation.removeEventListener('change', fn)
    }
  }, [])
  return layout
}

export default function SpectatorView({ tournament, onLogout }) {
  const [tab, setTab] = useState('tables')
  const [viewTable, setViewTable] = useState(null)
  const { mobile, landscape } = useLayout()

  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const activePlayers = players.filter(p => p.active)
  const sorted = [...activePlayers].sort((a, b) => b.bounty - a.bounty)
  const tables = [...new Set(activePlayers.map(p => p.table_num))].sort((a, b) => a - b)
  const currentTable = viewTable || tables[0] || 1

  if (!tournament) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', flexDirection: 'column', gap: 12, background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontSize: 40, color: 'var(--gold)', letterSpacing: 3, fontWeight: 700 }}>PKO</div>
      <div style={{ color: 'var(--text3)', fontSize: 14 }}>Turniej nie został jeszcze uruchomiony...</div>
    </div>
  )

  const Header = ({ compact = false }) => (
    <div className="app-header" style={{ padding: compact ? '0 14px' : '0 20px', height: compact ? 48 : 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="app-logo-icon" style={{ width: 32, height: 32, fontSize: 16 }}>♠</div>
        <div>
          <div className="app-series">PKO Bounty Tracker</div>
          <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--gold)', letterSpacing: .5, lineHeight: 1 }}>PKO TRACKER</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <ThemeSwitcher />
        <button className="btn-pill" onClick={onLogout}>←</button>
      </div>
    </div>
  )

  const StatsStrip = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      {[['Graczy', activePlayers.length, true], ['Eliminacje', eliminations.length, false], ['Top bounty', r2(sorted[0]?.bounty || 0) + ' zł', false]].map(([l, v, gold]) => (
        <div key={l} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 3, fontWeight: 700 }}>{l}</div>
          <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontSize: 22, color: gold ? 'var(--gold)' : 'var(--text)', lineHeight: 1, fontWeight: 600 }}>{v}</div>
        </div>
      ))}
    </div>
  )

  const BottomNav = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, padding: '6px 10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 }}>
      {[['tables','STOŁY'],['ranking','RANKING'],['feed','ELIMINACJE']].map(([id, label]) => (
        <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px', border: 'none', cursor: 'pointer', background: tab===id ? 'var(--gold-bg)' : 'transparent', borderRadius: 10, color: tab===id ? 'var(--gold)' : 'var(--text3)', transition: 'all .15s', fontFamily: 'Manrope,sans-serif', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', boxShadow: tab===id ? 'inset 0 0 0 1px rgba(233,185,73,.22)' : 'none' }}>
          {label}
        </button>
      ))}
    </div>
  )

  const TabBar = () => (
    <div className="tab-bar" style={{ margin: '0 0 12px' }}>
      {[['tables','STOŁY'],['ranking','RANKING'],['feed','ELIMINACJE']].map(([id, label]) => (
        <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={() => setTab(id)}>{label}</button>
      ))}
    </div>
  )

  const RankingList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sorted.map((p, i) => (
        <div key={p.id} className={`player-row${i===0?' top':''}`}>
          <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontSize: 20, color: i===0?'var(--gold)':i<3?'var(--text3)':'var(--text3)', textAlign: 'center', fontWeight: 600, lineHeight: 1 }}>{i===0?'♛':i+1}</div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 14, color: i===0?'var(--gold)':'var(--text)' }}>{p.name}</span>
            {p.rebuys > 1 && <span className="badge badge-gold" style={{ marginLeft: 5 }}>R{p.rebuys-1}</span>}
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              Stół {p.table_num} · Msc.{p.seat}
              {eliminations.filter(e => e.winner_name === p.name).length > 0 && (
                <span className="badge badge-green">{eliminations.filter(e => e.winner_name === p.name).length} elim.</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontSize: 20, color: 'var(--gold)', fontWeight: 600 }}>{r2(p.bounty)} <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'Manrope,sans-serif', fontWeight: 600 }}>zł</span></div>
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginTop: 1 }}>+{r2(p.pocket_bounty)} zł</div>
          </div>
        </div>
      ))}
      {sorted.length === 0 && <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '2rem 0' }}>Brak aktywnych graczy</div>}
    </div>
  )

  const TableSelector = () => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
      {tables.map(t => (
        <button key={t} className={`table-btn${currentTable===t?' active':''}`} onClick={() => setViewTable(t)}>
          Stół {t} <span style={{ opacity: .6, fontSize: 10 }}>· {activePlayers.filter(p=>p.table_num===t).length}/9</span>
        </button>
      ))}
    </div>
  )

  const TablesGrid = () => (
    <div>
      <TableSelector />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        {tables.map(t => (
          <div key={t} style={{ flex: '1 1 260px', maxWidth: 360 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text2)', marginBottom: 6 }}>
              Stół {t} · {activePlayers.filter(p=>p.table_num===t).length}/9
            </div>
            <OvalTable players={activePlayers} tableNum={t} readOnly />
          </div>
        ))}
      </div>
    </div>
  )

  const Feed = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {[...eliminations].reverse().slice(0, 50).map(e => (
        <div key={e.id} className="log-entry">
          <div><strong style={{ color: 'var(--green)' }}>{e.winner_name}</strong><span style={{ color: 'var(--text3)', margin: '0 5px' }}>eliminuje</span><strong style={{ color: 'var(--red)' }}>{e.loser_name}</strong></div>
          <span className="log-amount">+{e.pocket} zł</span>
        </div>
      ))}
      {eliminations.length === 0 && <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '2rem 0' }}>Brak eliminacji</div>}
    </div>
  )

  if (mobile && !landscape) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', background: 'var(--bg)', width: '100%' }}>
      <Header />
      <StatsStrip />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 8px' }}>
        {tab === 'tables'  && <TablesGrid />}
        {tab === 'ranking' && <RankingList />}
        {tab === 'feed'    && <Feed />}
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', background: 'var(--bg)', backgroundImage: 'var(--gradient-top)' }}>
      <Header compact />
      <StatsStrip />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <TabBar />
        {tab === 'tables'  && <TablesGrid />}
        {tab === 'ranking' && <RankingList />}
        {tab === 'feed'    && <Feed />}
      </div>
    </div>
  )
}

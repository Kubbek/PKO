import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { chipSplit, r2 } from '../lib/bounty'
import { useToast } from '../lib/useToast'
import OvalTable from '../components/OvalTable'
import SeatGrid from '../components/SeatGrid'
import ThemeSwitcher from '../components/ThemeSwitcher'

function useLayout() {
  const get = () => ({
    mobile: window.innerWidth < 768,
    landscape: window.innerWidth > window.innerHeight,
  })
  const [layout, setLayout] = useState(get)
  useEffect(() => {
    const fn = () => setLayout(get())
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return layout
}

export default function DealerView({ tournament, onRefresh, onLogout, tableNum }) {
  const { show, ToastContainer } = useToast()
  const [selectedWinner, setSelectedWinner] = useState(null)
  const winnerRef = useRef(null)
  const elimLock = useRef(false)
  const { mobile, landscape } = useLayout()

  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)
  const tableElims = eliminations.filter(e => {
    const w = players.find(p => p.id === e.winner_id)
    const l = players.find(p => p.id === e.loser_id)
    return w?.table_num === tableNum || l?.table_num === tableNum
  })

  // Klik 1 = zaznacz eliminującego, Klik 2 = od razu eliminuj
  function handleSeatClick(player) {
    if (!winnerRef.current) {
      winnerRef.current = player.id
      setSelectedWinner(player.id)
    } else if (player.id === winnerRef.current) {
      // klik na tego samego = odznacz
      winnerRef.current = null
      setSelectedWinner(null)
    } else {
      // drugi klik na innego = od razu eliminuj
      const wid = winnerRef.current
      const lid = player.id
      winnerRef.current = null
      setSelectedWinner(null)
      doElim(wid, lid)
    }
  }

  async function doElim(wid, lid) {
    if (!wid || !lid || wid === lid) return
    if (elimLock.current) return
    elimLock.current = true
    const winner = players.find(p => p.id === wid)
    const loser = players.find(p => p.id === lid)
    if (!winner || !loser) { elimLock.current = false; return }
    const split = chipSplit(loser.bounty, tournament.min_chip)
    await Promise.all([
      supabase.from('players').update({ bounty: r2(winner.bounty + split.onHead), pocket_bounty: r2(winner.pocket_bounty + split.pocket) }).eq('id', winner.id),
      supabase.from('players').update({ active: false, bounty: 0, elim_by: winner.name, place: players.filter(p => p.active).length }).eq('id', loser.id),
      supabase.from('eliminations').insert({ tournament_id: tournament.id, winner_id: winner.id, loser_id: loser.id, winner_name: winner.name, loser_name: loser.name, pocket: split.pocket, on_head: split.onHead, loser_bounty_before: loser.bounty })
    ])
    show(`${winner.name} → +${split.pocket} zł`)
    elimLock.current = false
    onRefresh()
  }

  async function undoLastElim() {
    if (!tableElims.length) { show('Brak eliminacji do cofnięcia'); return }
    const last = [...tableElims].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    const winner = players.find(p => p.id === last.winner_id)
    const loser = players.find(p => p.id === last.loser_id)
    if (!winner || !loser) { show('Nie można cofnąć'); return }
    await Promise.all([
      supabase.from('players').update({ bounty: r2(winner.bounty - last.on_head), pocket_bounty: r2(winner.pocket_bounty - last.pocket) }).eq('id', winner.id),
      supabase.from('players').update({ active: true, bounty: last.loser_bounty_before, elim_by: null, place: null }).eq('id', loser.id),
      supabase.from('eliminations').delete().eq('id', last.id)
    ])
    show(`Cofnięto: ${loser.name} wraca`)
    onRefresh()
  }

  if (!tournament) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 8, background: 'var(--bg)' }}>
      <div className="app-logo" style={{ fontSize: 32 }}>STÓŁ {tableNum}</div>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>Oczekiwanie na start...</div>
    </div>
  )

  const winnerPlayer = players.find(p => p.id === selectedWinner)

  // Hint – tylko gdy gracz zaznaczony
  const Hint = selectedWinner && (
    <div style={{ padding: '8px 14px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span><span style={{ color: 'var(--accent2)' }}>{winnerPlayer?.name}</span><span style={{ color: 'var(--text2)', fontWeight: 400 }}> – kliknij kogo eliminuje</span></span>
      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, padding: '0 2px', lineHeight: 1 }}
        onClick={() => { winnerRef.current = null; setSelectedWinner(null) }}>✕</button>
    </div>
  )

  // Undo button
  const UndoBtn = (
    <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={undoLastElim}>
      Cofnij
    </button>
  )

  // Header
  const Header = (compact = false) => (
    <div style={{ padding: compact ? '8px 14px' : '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      <div>
        <div className="app-logo" style={{ fontSize: compact ? 16 : 20, letterSpacing: 2 }}>
          STÓŁ {tableNum}
          <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'DM Sans,sans-serif', fontWeight: 400, letterSpacing: 0, marginLeft: 8 }}>
            {tablePlayers.length}/9
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {UndoBtn}
        <ThemeSwitcher />
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={onLogout}>Wyloguj</button>
      </div>
    </div>
  )

  // ── PORTRAIT MOBILE – siatka 3x3 ──────────────────────
  if (mobile && !landscape) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', background: 'var(--bg)', maxWidth: 480, margin: '0 auto' }}>
      <ToastContainer />
      {Header(false)}
      {Hint && <div style={{ padding: '8px 14px 0', flexShrink: 0 }}>{Hint}</div>}
      <div style={{ flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%' }}>
          <SeatGrid players={players} tableNum={tableNum} onSeatClick={handleSeatClick} selectedWinner={selectedWinner} selectedLoser={null} />
        </div>
      </div>
    </div>
  )

  // ── LANDSCAPE MOBILE – stół owalny ────────────────────
  if (mobile && landscape) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', background: 'var(--bg)' }}>
      <ToastContainer />
      {Header(true)}
      {Hint && <div style={{ padding: '4px 10px 0', flexShrink: 0 }}>{Hint}</div>}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 10px', minHeight: 0, overflow: 'hidden' }}>
        {/* Width drives the oval: limit so height never exceeds available space.
            Available height ≈ 100dvh - header(~40px) - hint(~0-46px) - padding(8px)
            OvalTable has paddingBottom:65% so height = width * 0.65 * (1 + chip overflow ~15%)
            To keep stół within screen: maxWidth = availableHeight / 0.75 */}
        <div style={{ width: '100%', maxWidth: 'min(560px, calc((100dvh - 100px) / 0.75))' }}>
          <OvalTable players={players} tableNum={tableNum} onSeatClick={handleSeatClick} selectedWinner={selectedWinner} selectedLoser={null} />
        </div>
      </div>
    </div>
  )

  // ── DESKTOP ───────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <ToastContainer />
      {Header(false)}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {Hint && <div style={{ width: '100%', maxWidth: 600, marginBottom: 14 }}>{Hint}</div>}
        <div style={{ width: '100%', maxWidth: 600 }}>
          <OvalTable players={players} tableNum={tableNum} onSeatClick={handleSeatClick} selectedWinner={selectedWinner} selectedLoser={null} />
        </div>
      </div>
    </div>
  )
}

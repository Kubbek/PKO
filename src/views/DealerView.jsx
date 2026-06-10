import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { chipSplit, r2 } from '../lib/bounty'
import { useToast } from '../lib/useToast'
import OvalTable from '../components/OvalTable'
import SeatGrid from '../components/SeatGrid'
import ThemeSwitcher from '../components/ThemeSwitcher'

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

export default function DealerView({ tournament, onRefresh, onLogout, tableNum }) {
  const { show, ToastContainer } = useToast()
  const [selectedWinner, setSelectedWinner] = useState(null)
  const winnerRef = useRef(null)
  const elimLock = useRef(false)
  const { mobile, landscape } = useLayout()

  const players = tournament?.players || []
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)

  function handleSeatClick(player) {
    if (!winnerRef.current) {
      winnerRef.current = player.id; setSelectedWinner(player.id)
    } else if (player.id === winnerRef.current) {
      winnerRef.current = null; setSelectedWinner(null)
    } else {
      const wid = winnerRef.current, lid = player.id
      winnerRef.current = null; setSelectedWinner(null)
      doElim(wid, lid)
    }
  }

  async function doElim(wid, lid) {
    if (!wid || !lid || wid === lid) return
    if (elimLock.current) return; elimLock.current = true
    const winner = players.find(p => p.id === wid), loser = players.find(p => p.id === lid)
    if (!winner || !loser) { elimLock.current = false; return }
    const split = chipSplit(loser.bounty, tournament.min_chip)
    await Promise.all([
      supabase.from('players').update({ bounty: r2(winner.bounty + split.onHead), pocket_bounty: r2(winner.pocket_bounty + split.pocket) }).eq('id', winner.id),
      supabase.from('players').update({ active: false, bounty: 0, elim_by: winner.name, place: players.filter(p => p.active).length }).eq('id', loser.id),
      supabase.from('eliminations').insert({ tournament_id: tournament.id, winner_id: winner.id, loser_id: loser.id, winner_name: winner.name, loser_name: loser.name, pocket: split.pocket, on_head: split.onHead, loser_bounty_before: loser.bounty })
    ])
    show(`${winner.name} → +${split.pocket} zł`)
    elimLock.current = false; onRefresh()
  }

  async function undoLastElim() {
    const elims = tournament?.eliminations || []
    if (!elims.length) { show('Brak eliminacji'); return }
    const last = [...elims].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    const winner = players.find(p => p.id === last.winner_id), loser = players.find(p => p.id === last.loser_id)
    if (!winner || !loser) { show('Nie można cofnąć'); return }
    await Promise.all([
      supabase.from('players').update({ bounty: r2(winner.bounty - last.on_head), pocket_bounty: r2(winner.pocket_bounty - last.pocket) }).eq('id', winner.id),
      supabase.from('players').update({ active: true, bounty: last.loser_bounty_before, elim_by: null, place: null }).eq('id', loser.id),
      supabase.from('eliminations').delete().eq('id', last.id)
    ])
    show(`Cofnięto: ${loser.name} wraca`); onRefresh()
  }

  if (!tournament) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', flexDirection: 'column', gap: 8, background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontSize: 32, color: 'var(--gold)', letterSpacing: 2 }}>STÓŁ {tableNum}</div>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>Oczekiwanie na start...</div>
    </div>
  )

  const winnerPlayer = players.find(p => p.id === selectedWinner)

  const Hint = selectedWinner && (
    <div style={{ padding: '8px 14px', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
      <span><span style={{ color: 'var(--gold)' }}>{winnerPlayer?.name}</span><span style={{ color: 'var(--text3)', fontWeight: 400 }}> – kliknij kogo eliminuje</span></span>
      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: 0 }} onClick={() => { winnerRef.current = null; setSelectedWinner(null) }}>✕</button>
    </div>
  )

  const Header = (compact = false) => (
    <div className="app-header" style={{ padding: compact ? '0 14px' : '0 20px', height: compact ? 48 : 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="app-logo-icon" style={{ width: compact ? 28 : 34, height: compact ? 28 : 34, fontSize: compact ? 14 : 17 }}>♠</div>
        <div>
          <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontSize: compact ? 16 : 18, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1, lineHeight: 1 }}>
            STÓŁ {tableNum}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{tablePlayers.length}/9 graczy</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button className="btn-pill" onClick={undoLastElim}>Cofnij</button>
        <ThemeSwitcher />
        <button className="btn-pill" onClick={onLogout}>Wyloguj</button>
      </div>
    </div>
  )

  const OvalProps = { players, tableNum, onSeatClick: handleSeatClick, selectedWinner, selectedLoser: null }
  const GridProps = { players, tableNum, onSeatClick: handleSeatClick, selectedWinner, selectedLoser: null }

  if (mobile && !landscape) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', background: 'var(--bg)', width: '100%' }}>
      <ToastContainer />
      {Header(false)}
      {Hint && <div style={{ padding: '8px 14px 0' }}>{Hint}</div>}
      <div style={{ flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%' }}><SeatGrid {...GridProps} /></div>
      </div>
    </div>
  )

  if (mobile && landscape) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', background: 'var(--bg)' }}>
      <ToastContainer />
      {Header(true)}
      {Hint && <div style={{ padding: '4px 10px 0', flexShrink: 0 }}>{Hint}</div>}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', minHeight: 0, overflow: 'hidden' }}>
        <div style={{ width: '100%', maxHeight: '100%', aspectRatio: '1 / 0.72', maxWidth: '100%', overflow: 'visible' }}>
          <OvalTable {...OvalProps} />
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh', background: 'var(--bg)', backgroundImage: 'var(--gradient-top)' }}>
      <ToastContainer />
      {Header(false)}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
        {Hint && <div style={{ width: '100%', marginBottom: 14 }}>{Hint}</div>}
        <div style={{ width: '100%' }}>
          <SeatGrid {...GridProps} />
        </div>
      </div>
    </div>
  )
}

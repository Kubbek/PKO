import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { chipSplit, r2 } from '../lib/bounty'
import { useToast } from '../lib/useToast'
import OvalTable from '../components/OvalTable'
import ThemeSwitcher from '../components/ThemeSwitcher'

function useOrientation() {
  const [landscape, setLandscape] = useState(window.innerWidth > window.innerHeight)
  useEffect(() => {
    const fn = () => setLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return landscape
}

export default function DealerView({ tournament, onRefresh, onLogout, tableNum }) {
  const { show, ToastContainer } = useToast()
  const [selectedWinner, setSelectedWinner] = useState(null)
  const [selectedLoser, setSelectedLoser] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const [quickAdd, setQuickAdd] = useState(null)
  const winnerRef = useRef(null)
  const elimLock = useRef(false)
  const dragRef = useRef(null)
  const landscape = useOrientation()

  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)
  const tableElims = eliminations.filter(e => {
    const w = players.find(p => p.id === e.winner_id)
    const l = players.find(p => p.id === e.loser_id)
    return w?.table_num === tableNum || l?.table_num === tableNum
  })

  function handleSeatClick(player) {
    if (!winnerRef.current) {
      winnerRef.current = player.id; setSelectedWinner(player.id); setSelectedLoser(null)
    } else if (player.id === winnerRef.current) {
      winnerRef.current = null; setSelectedWinner(null); setSelectedLoser(null)
    } else if (!selectedLoser) {
      const wid = winnerRef.current, lid = player.id
      setSelectedLoser(lid)
      setTimeout(() => { confirmElim(wid, lid); winnerRef.current = null }, 280)
    } else {
      winnerRef.current = null; setSelectedWinner(null); setSelectedLoser(null)
    }
  }

  async function confirmElim(wid, lid) {
    const w = wid ?? selectedWinner, l = lid ?? selectedLoser
    if (!w || !l || w === l) return
    if (elimLock.current) return
    elimLock.current = true
    const winner = players.find(p => p.id === w)
    const loser = players.find(p => p.id === l)
    if (!winner || !loser) { elimLock.current = false; return }
    const split = chipSplit(loser.bounty, tournament.min_chip)
    await Promise.all([
      supabase.from('players').update({ bounty: r2(winner.bounty + split.onHead), pocket_bounty: r2(winner.pocket_bounty + split.pocket) }).eq('id', winner.id),
      supabase.from('players').update({ active: false, bounty: 0, elim_by: winner.name, place: players.filter(p => p.active).length }).eq('id', loser.id),
      supabase.from('eliminations').insert({ tournament_id: tournament.id, winner_id: winner.id, loser_id: loser.id, winner_name: winner.name, loser_name: loser.name, pocket: split.pocket, on_head: split.onHead, loser_bounty_before: loser.bounty })
    ])
    show(`${winner.name} → +${split.pocket} zł`)
    setSelectedWinner(null); setSelectedLoser(null); winnerRef.current = null; elimLock.current = false
    onRefresh()
  }

  function reset() { winnerRef.current = null; setSelectedWinner(null); setSelectedLoser(null) }

  const winnerPlayer = players.find(p => p.id === selectedWinner)
  const loserPlayer = players.find(p => p.id === selectedLoser)

  if (!tournament) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 8, background: 'var(--bg)' }}>
      <div className="app-logo" style={{ fontSize: 32 }}>STÓŁ {tableNum}</div>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>Oczekiwanie na start...</div>
    </div>
  )

  // ── Shared modals ────────────────────────────────────
  const QuickAddModal = quickAdd && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: 'var(--bg3)', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: 520 }}>
        <div style={{ fontFamily: 'var(--header-font)', fontSize: 18, color: 'var(--accent)', marginBottom: '1rem', letterSpacing: 1 }}>
          Miejsce {quickAdd.seat || '?'} – Stół {quickAdd.tableNum}
        </div>
        <form onSubmit={async e => {
          e.preventDefault()
          const fd = new FormData(e.target)
          const name = fd.get('name').trim()
          if (!name) return
          const bounty = parseFloat(fd.get('bounty')) || tournament.init_bounty
          if (quickAdd.seat && activePlayers && players.find(p => p.active && p.table_num === quickAdd.tableNum && p.seat === quickAdd.seat)) {
            show('Miejsce zajęte'); return
          }
          const same = players.filter(p => p.name === name)
          const rebuys = same.length > 0 ? Math.max(...same.map(p => p.rebuys || 1)) + 1 : 1
          const seat = quickAdd.seat || parseInt(fd.get('seat'))
          if (!seat || seat < 1 || seat > 9) { show('Podaj miejsce 1–9'); return }
          await supabase.from('players').insert({ tournament_id: tournament.id, name, table_num: quickAdd.tableNum, seat, bounty, pocket_bounty: 0, active: true, rebuys })
          setQuickAdd(null); onRefresh()
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: quickAdd.seat ? '1fr' : '1fr 80px', gap: 10 }}>
            <div className="field" style={{ marginBottom: 0 }}><label>Imię / nick</label><input name="name" autoFocus placeholder="Imię gracza" style={{ fontSize: 16 }} /></div>
            {!quickAdd.seat && <div className="field" style={{ marginBottom: 0 }}><label>Miejsce</label><input name="seat" type="number" min="1" max="9" placeholder="1–9" style={{ fontSize: 16 }} /></div>}
          </div>
          <div className="field" style={{ marginTop: 10 }}><label>Bounty (zł)</label><input name="bounty" type="number" placeholder={tournament.init_bounty} style={{ fontSize: 16 }} /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost btn-full" style={{ fontSize: 15, padding: 14 }} onClick={() => setQuickAdd(null)}>Anuluj</button>
            <button type="submit" className="btn btn-accent btn-full" style={{ fontSize: 15, padding: 14 }}>Dodaj</button>
          </div>
        </form>
      </div>
    </div>
  )

  const LogDrawer = showLog && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowLog(false)}>
      <div style={{ background: 'var(--bg3)', borderRadius: '20px 20px 0 0', padding: '1.25rem 1.25rem 2rem', width: '100%', maxWidth: 520, maxHeight: '65vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Historia – Stół {tableNum}</div>
          <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 18 }} onClick={() => setShowLog(false)}>✕</button>
        </div>
        {tableElims.length === 0
          ? <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '1rem 0' }}>Brak eliminacji przy tym stole</div>
          : [...tableElims].reverse().map(e => (
            <div key={e.id} className="log-entry" style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '10px 14px' }}>
              <div><strong style={{ color: 'var(--accent2)' }}>{e.winner_name}</strong><span style={{ color: 'var(--text3)', margin: '0 5px' }}>→</span><strong style={{ color: 'var(--red)' }}>{e.loser_name}</strong></div>
              <span style={{ fontFamily: 'var(--num-font)', fontSize: 17, color: 'var(--accent)' }}>+{e.pocket} zł</span>
            </div>
          ))
        }
      </div>
    </div>
  )

  // ── STATUS BAR ───────────────────────────────────────
  const StatusBar = (
    <div style={{ padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 15, fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 48 }}>
      {!selectedWinner && <span style={{ color: 'var(--text2)', fontWeight: 400 }}>Kliknij gracza który eliminuje</span>}
      {selectedWinner && !selectedLoser && <><span style={{ color: 'var(--green)' }}>{winnerPlayer?.name}</span><span style={{ color: 'var(--text3)', fontWeight: 400 }}> eliminuje...</span></>}
      {selectedWinner && selectedLoser && <><span style={{ color: 'var(--green)' }}>{winnerPlayer?.name}</span><span style={{ color: 'var(--text3)', fontWeight: 400, margin: '0 6px' }}>→</span><span style={{ color: 'var(--red)' }}>{loserPlayer?.name}</span></>}
    </div>
  )

  const TableComponent = (
    <OvalTable
      players={players}
      tableNum={tableNum}
      onSeatClick={handleSeatClick}
      onEmptySeatClick={(t, s) => setQuickAdd({ tableNum: t, seat: s })}
      onDragStart={p => { dragRef.current = p }}
      onDrop={async (t, s) => {
        if (!dragRef.current) return
        const taken = players.find(x => x.active && x.table_num === t && x.seat === s && x.id !== dragRef.current.id)
        if (taken) { show('Miejsce zajęte'); dragRef.current = null; return }
        await supabase.from('players').update({ table_num: t, seat: s }).eq('id', dragRef.current.id)
        dragRef.current = null; onRefresh()
      }}
      selectedWinner={selectedWinner}
      selectedLoser={selectedLoser}
    />
  )

  const ActionBtn = selectedWinner && !selectedLoser && (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn btn-danger btn-full" style={{ padding: '14px', fontSize: 14, fontWeight: 700 }} onClick={() => confirmElim()}>
        Zatwierdź eliminację
      </button>
      <button className="btn btn-ghost" style={{ padding: '14px 18px', fontSize: 20 }} onClick={reset}>✕</button>
    </div>
  )

  // ── PORTRAIT ─────────────────────────────────────────
  if (!landscape) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', maxWidth: 480, margin: '0 auto' }}>
      <ToastContainer />
      {QuickAddModal}
      {LogDrawer}

      {/* Header */}
      <div style={{ padding: '12px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div>
          <div className="app-logo" style={{ fontSize: 20, letterSpacing: 2 }}>STÓŁ {tableNum}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{tablePlayers.length}/9 graczy</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ThemeSwitcher />
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={onLogout}>Wyloguj</button>
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: '8px 14px 0', flexShrink: 0 }}>{StatusBar}</div>

      {/* Table – fills remaining space */}
      <div style={{ flex: 1, padding: '0 6px', display: 'flex', alignItems: 'center' }}>
        {TableComponent}
      </div>

      {/* Action btn */}
      {ActionBtn && <div style={{ padding: '0 14px 8px', flexShrink: 0 }}>{ActionBtn}</div>}

      {/* Bottom nav */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '8px 14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={() => setShowLog(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', border: '1px solid var(--border)', background: 'var(--bg3)', borderRadius: 12, cursor: 'pointer', color: 'var(--text2)', fontSize: 14, fontWeight: 600 }}>
          📋 Historia ({tableElims.length})
        </button>
        <button onClick={() => setQuickAdd({ tableNum, seat: null })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', borderRadius: 12, cursor: 'pointer', color: 'var(--accent)', fontSize: 14, fontWeight: 600 }}>
          ➕ Dodaj gracza
        </button>
      </div>
    </div>
  )

  // ── LANDSCAPE ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      <ToastContainer />
      {QuickAddModal}
      {LogDrawer}

      {/* Thin header */}
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div className="app-logo" style={{ fontSize: 17, letterSpacing: 2 }}>STÓŁ {tableNum} <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'DM Sans,sans-serif', fontWeight: 400, letterSpacing: 0 }}>{tablePlayers.length}/9</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeSwitcher />
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={onLogout}>Wyloguj</button>
        </div>
      </div>

      {/* Main: table left, panel right */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden' }}>

        {/* Left – oval table */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 8px 8px 12px', overflow: 'hidden' }}>
          <div style={{ marginBottom: 6 }}>{StatusBar}</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {TableComponent}
          </div>
          {ActionBtn && <div style={{ marginTop: 6 }}>{ActionBtn}</div>}
        </div>

        {/* Right – sidebar */}
        <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg2)' }}>
          {/* Sidebar header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <button onClick={() => setQuickAdd({ tableNum, seat: null })} className="btn btn-accent btn-full" style={{ fontSize: 12, padding: '8px' }}>➕ Dodaj</button>
          </div>
          {/* Player list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text3)', marginBottom: 6 }}>Gracze przy stole</div>
            {tablePlayers.sort((a, b) => b.bounty - a.bounty).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: i === 0 ? 'var(--accent-bg)' : 'var(--bg3)', border: `1px solid ${i === 0 ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 8, marginBottom: 5 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: i === 0 ? 'var(--accent2)' : 'var(--text)' }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>Msc. {p.seat}</div>
                </div>
                <div style={{ fontFamily: 'var(--num-font)', fontSize: 17, color: 'var(--accent)' }}>{r2(p.bounty)} zł</div>
              </div>
            ))}
          </div>
          {/* Log */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text3)', marginBottom: 6 }}>Historia ({tableElims.length})</div>
            <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...tableElims].reverse().slice(0, 8).map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 8px', background: 'var(--bg3)', borderRadius: 6, borderLeft: '2px solid var(--accent-dim)' }}>
                  <span style={{ color: 'var(--text2)' }}><strong style={{ color: 'var(--text)' }}>{e.winner_name}</strong> → <strong style={{ color: 'var(--red)' }}>{e.loser_name}</strong></span>
                  <span style={{ fontFamily: 'var(--num-font)', color: 'var(--accent)', fontSize: 13 }}>+{e.pocket}</span>
                </div>
              ))}
              {tableElims.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 11 }}>Brak eliminacji</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

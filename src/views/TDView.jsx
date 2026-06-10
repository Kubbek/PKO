import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { chipSplit, r2 } from '../lib/bounty'
import { useToast } from '../lib/useToast'
import SeatGrid from '../components/SeatGrid'
import OvalTable from '../components/OvalTable'
import ThemeSwitcher from '../components/ThemeSwitcher'

// ── CHOP MODAL ────────────────────────────────────────────────────────────────
function ChopModal({ players, tournament, onClose, onDone }) {
  const [step, setStep] = useState(1)
  const [losers, setLosers] = useState([])
  const [winners, setWinners] = useState([])
  const activePlayers = players.filter(p => p.active)
  const totalLoserBounty = losers.reduce((s, id) => { const p = players.find(x => x.id === id); return s + (p?.bounty || 0) }, 0)
  const sharePerWinner = winners.length > 0 ? r2(totalLoserBounty / winners.length) : 0

  function toggle(id, list, setList) { setList(l => l.includes(id) ? l.filter(x => x !== id) : [...l, id]) }

  async function confirm() {
    const place = activePlayers.length
    const ops = []
    losers.forEach((id, i) => ops.push(supabase.from('players').update({ active: false, bounty: 0, elim_by: 'chop', place: place - i }).eq('id', id)))
    winners.forEach(id => { const p = players.find(x => x.id === id); ops.push(supabase.from('players').update({ bounty: r2(p.bounty + sharePerWinner), pocket_bounty: r2(p.pocket_bounty + sharePerWinner) }).eq('id', id)) })
    await Promise.all(ops); onDone(); onClose()
  }

  const pill = (active, color) => ({ padding: '7px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: `1px solid ${active ? color : 'var(--border2)'}`, background: active ? `${color}18` : 'var(--bg2)', color: active ? color : 'var(--text3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, transition: 'all .15s' })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Chop</h2>
          <span style={{ fontSize: 12, background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>Krok {step}/2</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1rem' }}>
          {step === 1 ? 'Zaznacz graczy którzy zostają wyeliminowani.' : 'Zaznacz graczy eliminujących – bounty podzieli się równo.'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--red)', marginBottom: 6 }}>Wyeliminowani</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
              {step === 1 ? activePlayers.map(p => (
                <button key={p.id} style={pill(losers.includes(p.id), 'var(--red)')} onClick={() => toggle(p.id, losers, setLosers)}>
                  <span>{p.name}</span><span style={{ fontSize: 11, opacity: .7 }}>{r2(p.bounty)} zł</span>
                </button>
              )) : losers.map(id => { const p = players.find(x => x.id === id); return <div key={id} style={{ ...pill(true, 'var(--red)'), cursor: 'default' }}><span>{p?.name}</span><span style={{ fontSize: 11 }}>{r2(p?.bounty)} zł</span></div> })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--green)', marginBottom: 6 }}>Eliminujący</div>
            {step === 1
              ? <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>Najpierw wybierz wyeliminowanych →</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                  {activePlayers.filter(p => !losers.includes(p.id)).map(p => (
                    <button key={p.id} style={pill(winners.includes(p.id), 'var(--green)')} onClick={() => toggle(p.id, winners, setWinners)}>
                      <span>{p.name}</span>
                      <span style={{ fontSize: 11, opacity: .7 }}>{winners.includes(p.id) && sharePerWinner > 0 ? `+${sharePerWinner} zł` : `${r2(p.bounty)} zł`}</span>
                    </button>
                  ))}
                </div>
            }
          </div>
        </div>
        {step === 2 && winners.length > 0 && (
          <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>Łączna pula: </span>
            <strong style={{ color: 'var(--gold)' }}>{r2(totalLoserBounty)} zł</strong>
            <span style={{ color: 'var(--text2)' }}> ÷ {winners.length} graczy = </span>
            <strong style={{ color: 'var(--green)' }}>{sharePerWinner} zł</strong>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
          {step === 1
            ? <button className="btn btn-accent" style={{ flex: 1 }} disabled={losers.length === 0} onClick={() => setStep(2)}>Dalej →</button>
            : <button className="btn btn-accent" style={{ flex: 1 }} disabled={winners.length === 0} onClick={confirm}>Zatwierdź chop</button>
          }
        </div>
      </div>
    </div>
  )
}

// ── PLAYER POPUP ──────────────────────────────────────────────────────────────
function PlayerPopup({ player, players, eliminations, tournament, onClose, onBountyChange }) {
  const [bountyInput, setBountyInput] = useState(String(r2(player.bounty)))
  const killed = eliminations.filter(e => e.winner_name === player.name)

  async function saveBounty() {
    const val = parseFloat(bountyInput)
    if (isNaN(val) || val < 0) return
    await supabase.from('players').update({ bounty: r2(val) }).eq('id', player.id)
    onBountyChange(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 320 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>{player.name}</h2>
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: '1rem' }}>
          {[['Stół / miejsce', `${player.table_num} / ${player.seat}`], ['Bounty na głowie', `${r2(player.bounty)} zł`], ['Zebrano łącznie', `${r2(player.pocket_bounty)} zł`], ['Eliminacje', killed.length]].map(([l, v]) => (
            <div key={l} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 3, fontWeight: 700 }}>{l}</div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'Saira Condensed,sans-serif', fontSize: 18 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', marginBottom: 6 }}>Zmień bounty</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="number" value={bountyInput} min="0" onChange={e => setBountyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveBounty()}
              style={{ flex: 1, padding: '8px 12px', background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'Manrope,sans-serif' }} />
            <button className="btn btn-accent" onClick={saveBounty}>Zapisz</button>
          </div>
        </div>
        {killed.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', marginBottom: 6 }}>Wyeliminowani</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 140, overflowY: 'auto' }}>
              {killed.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--bg2)', borderRadius: 6, fontSize: 12 }}>
                  <span style={{ color: 'var(--text)' }}>{e.loser_name}</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>+{r2(e.pocket)} zł</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── MOVE PLAYER MODAL ─────────────────────────────────────────────────────────
function MovePlayerModal({ player, activePlayers, onClose, onDone }) {
  const [newTable, setNewTable] = useState(String(player.table_num))
  const [newSeat, setNewSeat] = useState(String(player.seat))

  async function save() {
    const t = parseInt(newTable), s = parseInt(newSeat)
    if (isNaN(t) || isNaN(s) || s < 1 || s > 9) return
    const taken = activePlayers.find(p => p.table_num === t && p.seat === s && p.id !== player.id)
    if (taken) { alert('Miejsce zajęte przez ' + taken.name); return }
    await supabase.from('players').update({ table_num: t, seat: s }).eq('id', player.id)
    onDone(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 210, padding: '1rem' }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 300 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1rem', fontSize: 16 }}>Przenieś {player.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1rem' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Stół</label>
            <select value={newTable} onChange={e => setNewTable(e.target.value)}>
              {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={i+1}>Stół {i+1}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Miejsce (1–9)</label>
            <input type="number" min="1" max="9" value={newSeat} onChange={e => setNewSeat(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="btn btn-accent" style={{ flex: 1 }} onClick={save}>Przenieś</button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN TD VIEW ──────────────────────────────────────────────────────────────
export default function TDView({ tournament, onRefresh, onLogout }) {
  const { show, ToastContainer } = useToast()
  const [tab, setTab] = useState('tables')
  const [showSetup, setShowSetup] = useState(!tournament)
  const [setupForm, setSetupForm] = useState({ initBounty: 100, minChip: 25 })
  const [addForm, setAddForm] = useState({ name: '', tableNum: '1', seat: '', bounty: '' })
  const [selectedWinner, setSelectedWinner] = useState(null)
  const [tableView, setTableView] = useState('oval')
  const [tableSize, setTableSize] = useState('m')
  const [showChop, setShowChop] = useState(false)
  const [popupPlayer, setPopupPlayer] = useState(null)
  const [movePlayer, setMovePlayer] = useState(null)
  const [quickAdd, setQuickAdd] = useState(null)
  const [extraTables, setExtraTables] = useState([])
  const winnerRef = useRef(null)
  const elimLock = useRef(false)
  const dragRef = useRef(null)

  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const activePlayers = players.filter(p => p.active)
  const tables = [...new Set(activePlayers.map(p => p.table_num))].sort((a, b) => a - b)
  const allTables = [...new Set([...tables, ...extraTables])].sort((a, b) => a - b)
  const validTables = allTables.length > 0 ? allTables : [1]

  async function createTournament() {
    const { error } = await supabase.from('tournaments').insert({ init_bounty: setupForm.initBounty, min_chip: setupForm.minChip, status: 'active' })
    if (error) { show('Błąd: ' + error.message); return }
    show('Turniej utworzony!'); setShowSetup(false); onRefresh()
  }

  async function addPlayer(e) {
    e.preventDefault()
    if (!addForm.name || !addForm.seat) { show('Wypełnij pola'); return }
    const seat = parseInt(addForm.seat), tableNum = parseInt(addForm.tableNum)
    if (isNaN(seat) || seat < 1 || seat > 9) { show('Miejsce 1–9'); return }
    const taken = activePlayers.find(p => p.table_num === tableNum && p.seat === seat)
    if (taken) { show('Miejsce zajęte przez ' + taken.name); return }
    const bounty = parseFloat(addForm.bounty) || tournament.init_bounty
    const existing = players.find(p => p.name === addForm.name && p.table_num === tableNum && p.seat === seat && !p.active)
    if (existing) {
      const nr = (existing.rebuys || 1) + 1
      await supabase.from('players').update({ active: true, bounty, place: null, elim_by: null, rebuys: nr }).eq('id', existing.id)
      show(`${addForm.name} rebuy R${nr - 1}!`)
    } else {
      const same = players.filter(p => p.name === addForm.name)
      const rebuys = same.length > 0 ? Math.max(...same.map(p => p.rebuys || 1)) + 1 : 1
      await supabase.from('players').insert({ tournament_id: tournament.id, name: addForm.name, table_num: tableNum, seat, bounty, pocket_bounty: 0, active: true, rebuys })
      show(`${addForm.name} dodany!`)
    }
    setAddForm(f => ({ ...f, name: '', seat: '' })); onRefresh()
  }

  function handleSeatClick(player) {
    if (!winnerRef.current) {
      winnerRef.current = player.id; setSelectedWinner(player.id)
    } else if (player.id === winnerRef.current) {
      winnerRef.current = null; setSelectedWinner(null)
    } else {
      const wid = winnerRef.current, lid = player.id
      winnerRef.current = null; setSelectedWinner(null)
      confirmElim(wid, lid)
    }
  }

  async function confirmElim(wid, lid) {
    if (!wid || !lid || wid === lid) return
    if (elimLock.current) return; elimLock.current = true
    try {
      const winner = players.find(p => p.id === wid), loser = players.find(p => p.id === lid)
      if (!winner || !loser) { elimLock.current = false; return }
      const split = chipSplit(loser.bounty, tournament.min_chip)
      await Promise.all([
        supabase.from('players').update({ bounty: r2(winner.bounty + split.onHead), pocket_bounty: r2(winner.pocket_bounty + split.pocket) }).eq('id', winner.id),
        supabase.from('players').update({ active: false, bounty: 0, elim_by: winner.name, place: activePlayers.length }).eq('id', loser.id),
        supabase.from('eliminations').insert({ tournament_id: tournament.id, winner_id: winner.id, loser_id: loser.id, winner_name: winner.name, loser_name: loser.name, pocket: split.pocket, on_head: split.onHead, loser_bounty_before: loser.bounty })
      ])
      show(`+${split.pocket} zł do kieszeni`); onRefresh()
    } catch(err) {
      show('Błąd – spróbuj ponownie')
    } finally {
      elimLock.current = false
    }
  }

  async function undoLastElim() {
    if (!eliminations.length) { show('Brak eliminacji'); return }
    const last = [...eliminations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    const winner = players.find(p => p.id === last.winner_id), loser = players.find(p => p.id === last.loser_id)
    if (!winner || !loser) { show('Nie można cofnąć'); return }
    await Promise.all([
      supabase.from('players').update({ bounty: r2(winner.bounty - last.on_head), pocket_bounty: r2(winner.pocket_bounty - last.pocket) }).eq('id', winner.id),
      supabase.from('players').update({ active: true, bounty: last.loser_bounty_before, elim_by: null, place: null }).eq('id', loser.id),
      supabase.from('eliminations').delete().eq('id', last.id)
    ])
    show(`Cofnięto: ${loser.name} wraca`); onRefresh()
  }

  function openAddPlayerAtSeat(tableNum, seat) { setQuickAdd({ tableNum, seat }) }

  function addTable() {
    const next = validTables.length > 0 ? Math.max(...validTables) + 1 : 1
    if (next > 20) { show('Maks. 20 stołów'); return }
    setExtraTables(t => [...t, next])
  }

  function removeLastTable() {
    const last = Math.max(...validTables)
    if (activePlayers.some(p => p.table_num === last)) { show(`Stół ${last} ma aktywnych graczy`); return }
    setExtraTables(t => t.filter(x => x !== last))
  }

  async function handleDrop(tableNum, seat) {
    if (!dragRef.current) return
    const taken = activePlayers.find(x => x.table_num === tableNum && x.seat === seat && x.id !== dragRef.current.id)
    if (taken) { show('Miejsce zajęte'); dragRef.current = null; return }
    await supabase.from('players').update({ table_num: tableNum, seat }).eq('id', dragRef.current.id)
    dragRef.current = null; onRefresh()
  }

  // Setup screen
  if (!tournament || showSetup) return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--bg)', backgroundImage: 'var(--gradient-top)' }}>
      <ToastContainer />
      <div style={{ position: 'absolute', top: 16, right: 16 }}><ThemeSwitcher /></div>
      <div className="modal">
        <h2>Nowy turniej</h2>
        <div className="field"><label>Startowe bounty (zł)</label><input type="number" value={setupForm.initBounty} min="1" onChange={e => setSetupForm(f => ({ ...f, initBounty: +e.target.value }))} /></div>
        <div className="field"><label>Najmniejszy nominał (zł)</label><input type="number" value={setupForm.minChip} min="1" onChange={e => setSetupForm(f => ({ ...f, minChip: +e.target.value }))} /></div>
        <button className="btn btn-accent btn-full" onClick={createTournament}>Utwórz turniej</button>
        {tournament && <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setShowSetup(false)}>Anuluj</button>}
      </div>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100svh', backgroundImage: 'var(--gradient-top)' }}>
      <ToastContainer />

      {/* Modals */}
      {showChop && <ChopModal players={players} tournament={tournament} onClose={() => setShowChop(false)} onDone={() => { show('Chop zakończony!'); onRefresh() }} />}
      {popupPlayer && <PlayerPopup player={popupPlayer} players={players} eliminations={eliminations} tournament={tournament} onClose={() => setPopupPlayer(null)} onBountyChange={() => { show('Bounty zaktualizowane'); onRefresh() }} />}
      {movePlayer && <MovePlayerModal player={movePlayer} activePlayers={activePlayers} onClose={() => setMovePlayer(null)} onDone={() => { show('Gracz przeniesiony'); onRefresh() }} />}
      {quickAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }} onClick={() => setQuickAdd(null)}>
          <div className="modal" style={{ maxWidth: 320 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Stół {quickAdd.tableNum} · Miejsce {quickAdd.seat}</h2>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setQuickAdd(null)}>✕</button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault()
              const fd = new FormData(e.target)
              const name = fd.get('name').trim()
              if (!name) return
              const { data: existing } = await supabase.from('players').select('id,name').eq('tournament_id', tournament.id).eq('table_num', quickAdd.tableNum).eq('seat', quickAdd.seat).eq('active', true).maybeSingle()
              if (existing) { show('Miejsce zajęte przez ' + existing.name); return }
              const same = players.filter(p => p.name === name)
              const rebuys = same.length > 0 ? Math.max(...same.map(p => p.rebuys || 1)) + 1 : 1
              await supabase.from('players').insert({ tournament_id: tournament.id, name, table_num: quickAdd.tableNum, seat: quickAdd.seat, bounty: tournament.init_bounty, pocket_bounty: 0, active: true, rebuys })
              show(`${name} dodany!`); setQuickAdd(null); onRefresh()
            }}>
              <div className="field"><label>Imię / nick</label><input name="name" autoFocus placeholder="Imię gracza" /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setQuickAdd(null)}>Anuluj</button>
                <button type="submit" className="btn btn-accent" style={{ flex: 1 }}>Dodaj gracza</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="app-logo-icon">♠</div>
          <div>
            <div className="app-series">PKO Bounty Tracker</div>
            <div className="app-title">Tournament Director <b>· TD</b></div>
          </div>
        </div>
        <div className="app-header-right">
          <ThemeSwitcher />
          {[{ label: 'Cofnij', action: undoLastElim }, { label: 'Chop', action: () => setShowChop(true), gold: true }, { label: 'Nowy turniej', action: () => setShowSetup(true) }, { label: 'Wyloguj', action: onLogout }].map(({ label, action, gold }) => (
            <button key={label} onClick={action} className={`btn-pill${gold ? ' gold' : ''}`}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 28px 2rem' }}>

        {/* STATS */}
        <div className="stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.25rem' }}>
          <div className="stat-card"><div className="sl">Gracze w grze</div><div className="sv green">{activePlayers.length}</div></div>
          <div className="stat-card"><div className="sl">Pula bounty</div><div className="sv" style={{ fontSize: 32 }}>{r2(activePlayers.reduce((s, p) => s + p.bounty, 0))} <span style={{ fontSize: 14, color: 'var(--text3)', fontFamily: 'Manrope,sans-serif', fontWeight: 600 }}>zł</span></div></div>
          <div className="stat-card"><div className="sl">Wypłacono</div><div className="sv" style={{ fontSize: 32 }}>{r2(players.reduce((s, p) => s + p.pocket_bounty, 0))} <span style={{ fontSize: 14, color: 'var(--text3)', fontFamily: 'Manrope,sans-serif', fontWeight: 600 }}>zł</span></div></div>
          <div className="stat-card"><div className="sl">Eliminacje</div><div className="sv">{eliminations.length}</div></div>
        </div>

        {/* TABS */}
        <div className="tab-bar" style={{ marginBottom: '1.25rem' }}>
          {[['tables','STOŁY'],['players','GRACZE'],['log','HISTORIA'],['add','DODAJ GRACZA']].map(([id, label]) => (
            <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* ── TABLES TAB ── */}
        {tab === 'tables' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Rozmiar:</div>
                {['s','m','l'].map(sz => (
                  <button key={sz} onClick={() => setTableSize(sz)} style={{ padding: '5px 10px', fontSize: 11, fontWeight: 800, border: `1px solid ${tableSize===sz?'rgba(233,185,73,.4)':'var(--border2)'}`, background: tableSize===sz?'var(--gold-bg)':'transparent', color: tableSize===sz?'var(--gold)':'var(--text3)', borderRadius: 6, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.06em' }}>{sz}</button>
                ))}
                <div style={{ width: 1, height: 16, background: 'var(--border2)', margin: '0 4px' }} />
                <button onClick={removeLastTable} style={{ width: 28, height: 28, border: '1px solid var(--gold-border)', background: 'var(--gold-bg)', color: 'var(--gold)', borderRadius: '50%', cursor: 'pointer', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
                <button onClick={addTable} style={{ width: 28, height: 28, border: '1px solid var(--gold-border)', background: 'var(--gold-bg)', color: 'var(--gold)', borderRadius: '50%', cursor: 'pointer', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                <div style={{ width: 1, height: 16, background: 'var(--border2)', margin: '0 4px' }} />
                {[['oval','⬭'],['grid','⊞']].map(([v,icon]) => (
                  <button key={v} onClick={() => setTableView(v)} style={{ padding: '5px 9px', fontSize: 13, border: `1px solid ${tableView===v?'rgba(233,185,73,.4)':'var(--border2)'}`, background: tableView===v?'var(--gold-bg)':'transparent', color: tableView===v?'var(--gold)':'var(--text3)', borderRadius: 6, cursor: 'pointer' }}>{icon}</button>
                ))}
              </div>
              {selectedWinner && (
                <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>
                  {players.find(p => p.id === selectedWinner)?.name} – kliknij kogo eliminuje
                  <button style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }} onClick={() => { winnerRef.current = null; setSelectedWinner(null) }}>✕</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
              {validTables.map(t => {
                const pct = { s: 'calc(25% - 12px)', m: 'calc(50% - 8px)', l: '100%' }[tableSize]
                const chipScale = { s: .55, m: .75, l: 1 }[tableSize]
                return (
                  <div key={t} style={{ flex: `0 0 ${pct}`, minWidth: 0, width: pct }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text2)', marginBottom: 4 }}>
                      Stół {t} <span style={{ fontWeight: 600, color: 'var(--text3)' }}>· {activePlayers.filter(p=>p.table_num===t).length}/9</span>
                    </div>
                    {tableView === 'oval'
                      ? <OvalTable players={activePlayers} tableNum={t} onSeatClick={handleSeatClick} onSeatRightClick={(p, e) => { e.preventDefault(); setPopupPlayer(p) }} onDragStart={p => { dragRef.current = p }} onDrop={handleDrop} onEmptySeatClick={openAddPlayerAtSeat} chipScale={chipScale} selectedWinner={selectedWinner} selectedLoser={null} />
                      : <SeatGrid players={activePlayers} tableNum={t} onSeatClick={handleSeatClick} onSeatRightClick={(p, e) => { e.preventDefault(); setPopupPlayer(p) }} onDragStart={p => { dragRef.current = p }} onDrop={handleDrop} onEmptySeatClick={openAddPlayerAtSeat} selectedWinner={selectedWinner} selectedLoser={null} />
                    }
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PLAYERS TAB ── */}
        {tab === 'players' && (
          <div>
            <div className="section-title">Ranking bounty <span style={{ color: 'var(--text3)', fontWeight: 500, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>· prawy klik = edycja</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...activePlayers].sort((a, b) => b.bounty - a.bounty).map((p, i) => (
                <div key={p.id} className={`player-row${i===0?' top':''} fade-up`} style={{ animationDelay: `${i*.03}s`, cursor: 'context-menu' }} onContextMenu={e => { e.preventDefault(); setPopupPlayer(p) }}>
                  <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontSize: 22, color: i===0?'var(--gold)':'var(--text3)', textAlign: 'center', fontWeight: 600, lineHeight: 1 }}>{i===0?'♛':i+1}</div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: i===0?'var(--gold)':'var(--text)' }}>{p.name}</span>
                    {p.rebuys > 1 && <span className="badge badge-gold" style={{ marginLeft: 7 }}>R{p.rebuys-1}</span>}
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                      Stół {p.table_num} · Miejsce {p.seat}
                      <button style={{ fontSize: 10, color: 'var(--text3)', background: 'none', border: '1px solid var(--border2)', borderRadius: 5, padding: '1px 7px', cursor: 'pointer', fontFamily: 'Manrope,sans-serif' }} onClick={() => setMovePlayer(p)}>Przenieś</button>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Saira Condensed,sans-serif', fontSize: 22, color: 'var(--gold)', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r2(p.bounty)} <span style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'Manrope,sans-serif', fontWeight: 600 }}>zł</span></div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>+{r2(p.pocket_bounty)} zł</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOG TAB ── */}
        {tab === 'log' && (
          <div>
            <div className="section-title">Historia eliminacji</div>
            {eliminations.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Brak eliminacji</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...eliminations].reverse().map((e, i) => (
                <div key={e.id} className="log-entry fade-up" style={{ animationDelay: `${i*.02}s` }}>
                  <div>
                    <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{e.winner_name}</strong>
                    <span style={{ color: 'var(--text3)', margin: '0 6px' }}>eliminuje</span>
                    <strong style={{ color: 'var(--red)', fontWeight: 700 }}>{e.loser_name}</strong>
                    <span style={{ color: 'var(--text3)', fontSize: 12 }}> · +{e.on_head} zł na głowę</span>
                  </div>
                  <span className="log-amount">+{e.pocket} zł</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADD TAB ── */}
        {tab === 'add' && (
          <div style={{ maxWidth: 480 }}>
            <div className="section-title">Dodaj gracza</div>
            <form onSubmit={addPlayer}>
              <div className="field"><label>Imię / nick</label><input value={addForm.name} placeholder="Imię gracza" onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field"><label>Stół</label>
                  <select value={addForm.tableNum} onChange={e => setAddForm(f => ({ ...f, tableNum: e.target.value }))}>
                    {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={i+1}>Stół {i+1}</option>)}
                  </select>
                </div>
                <div className="field"><label>Miejsce (1–9)</label><input type="number" min="1" max="9" value={addForm.seat} placeholder="1–9" onChange={e => setAddForm(f => ({ ...f, seat: e.target.value }))} /></div>
              </div>
              <div className="field"><label>Bounty (zł) – domyślnie {tournament.init_bounty} zł</label><input type="number" value={addForm.bounty} placeholder={tournament.init_bounty} onChange={e => setAddForm(f => ({ ...f, bounty: e.target.value }))} /></div>
              <button type="submit" className="btn btn-accent btn-full">Dodaj gracza</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

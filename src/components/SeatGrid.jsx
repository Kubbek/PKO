import { useState } from 'react'
import { r2 } from '../lib/bounty'

export default function SeatGrid({ players, tableNum, onSeatClick, onSeatRightClick, onDragStart, onDrop, onEmptySeatClick, selectedWinner, selectedLoser, readOnly = false }) {
  const [hoveredSeat, setHoveredSeat] = useState(null)
  const seats = Array.from({ length: 9 }, (_, i) => i + 1)
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)

  return (
    <div className="seat-felt">
      {seats.map(s => {
        const p = tablePlayers.find(pp => pp.seat === s)
        const isWinner = p && selectedWinner === p.id
        const isLoser  = p && selectedLoser  === p.id
        const isHovered = hoveredSeat === s

        if (p) return (
          <div key={s}
            className={`seat-cell occupied${isWinner?' pick-winner':''}${isLoser?' pick-loser':''}`}
            draggable={!readOnly}
            onClick={() => !readOnly && onSeatClick?.(p)}
            onContextMenu={e => { e.preventDefault(); !readOnly && onSeatRightClick?.(p, e) }}
            onDragStart={() => !readOnly && onDragStart?.(p)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => !readOnly && onDrop?.(tableNum, s)}
          >
            <div className="seat-player">
              <div className="sp-name">
                {p.name}
                {p.rebuys > 1 && <span className="badge badge-accent" style={{ marginLeft: 5, fontSize: 8 }}>R{p.rebuys}</span>}
              </div>
              <div className="sp-bounty">{r2(p.bounty)} zł</div>
              {p.pocket_bounty > 0 && <div className="sp-pocket">+{r2(p.pocket_bounty)} zł</div>}
            </div>
            <div className="seat-num">{s}</div>
          </div>
        )

        return (
          <div key={s}
            className="seat-cell"
            style={{ cursor: readOnly ? 'default' : 'pointer', background: isHovered && !readOnly ? 'var(--accent-bg)' : undefined, borderColor: isHovered && !readOnly ? 'var(--accent)' : undefined, borderStyle: isHovered && !readOnly ? 'solid' : 'dashed' }}
            onClick={() => !readOnly && onEmptySeatClick?.(tableNum, s)}
            onMouseEnter={() => !readOnly && setHoveredSeat(s)}
            onMouseLeave={() => setHoveredSeat(null)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => !readOnly && onDrop?.(tableNum, s)}
          >
            <div className="seat-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: isHovered && !readOnly ? 28 : 22, color: isHovered && !readOnly ? 'var(--accent)' : 'var(--text3)', fontWeight: 700, lineHeight: 1, transition: 'all 0.15s' }}>+</div>
              {isHovered && !readOnly && <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>Dodaj gracza</div>}
            </div>
            <div className="seat-num">{s}</div>
          </div>
        )
      })}
    </div>
  )
}

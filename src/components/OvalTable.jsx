import { useState } from 'react'
import { r2 } from '../lib/bounty'

export default function OvalTable({ players, tableNum, onSeatClick, onSeatRightClick, onDragStart, onDrop, onEmptySeatClick, selectedWinner, selectedLoser, readOnly = false, chipScale = 1 }) {
  const [hoveredSeat, setHoveredSeat] = useState(null)
  const seats = Array.from({ length: 9 }, (_, i) => i + 1)
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)

  return (
    <div style={{ width: '100%', padding: '0 7%', margin: '8px 0 12px', boxSizing: 'border-box' }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '65%' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--felt, #061008)', border: '4px solid var(--accent-dim, #92400e)', boxSizing: 'border-box', overflow: 'visible' }}>
        <div style={{ position: 'absolute', inset: '10%', borderRadius: '50%', border: '2px solid var(--accent-border, rgba(180,83,9,0.2))', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Bebas Neue','DM Sans',sans-serif", fontSize: 'clamp(14px,3vw,24px)', letterSpacing: 3, color: 'var(--accent-border,rgba(180,83,9,0.3))', pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}>
          STÓŁ {tableNum}
        </div>

        {seats.map(s => {
          const angle = ((s - 1) / 9) * 2 * Math.PI - Math.PI / 2
          const x = 50 + 50 * Math.cos(angle)
          const y = 50 + 50 * Math.sin(angle)
          const p = tablePlayers.find(pp => pp.seat === s)
          const isWinner = p && selectedWinner === p.id
          const isLoser  = p && selectedLoser  === p.id
          const isHovered = hoveredSeat === s

          if (p) {
            return (
              <div key={s} style={{
                position: 'absolute', left: x+'%', top: y+'%',
                transform: 'translate(-50%,-50%)',
                width: `clamp(${Math.round(108*chipScale)}px,15%,${Math.round(138*chipScale)}px)`,
                background: isWinner ? 'var(--green-bg,rgba(5,150,105,0.08))' : isLoser ? 'var(--red-bg,rgba(220,38,38,0.07))' : 'var(--bg3,#fff)',
                border: `2px solid ${isWinner ? 'var(--green,#059669)' : isLoser ? 'var(--red,#dc2626)' : 'var(--border2,rgba(0,0,0,0.16))'}`,
                borderRadius: 8, padding: '5px 4px 4px', textAlign: 'center',
                cursor: readOnly ? 'default' : 'pointer',
                transition: 'all 0.15s', zIndex: 2,
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              }}
                onClick={() => !readOnly && onSeatClick?.(p)}
                onContextMenu={e => { e.preventDefault(); !readOnly && onSeatRightClick?.(p, e) }}
                draggable={!readOnly}
                onDragStart={() => !readOnly && onDragStart?.(p)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => !readOnly && onDrop?.(tableNum, s)}
              >
                <div style={{ position: 'absolute', top: 2, right: 4, fontSize: 9, fontWeight: 700, color: 'var(--text3,#a8a29e)', lineHeight: 1 }}>{s}</div>
                <div style={{ fontSize: Math.round(16*chipScale), fontWeight: 700, color: isWinner ? 'var(--green,#059669)' : isLoser ? 'var(--red,#dc2626)' : 'var(--text,#1c1917)', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingTop: 2 }}>
                  {p.name}{p.rebuys > 1 && <span style={{ fontSize: Math.round(8*chipScale), fontWeight: 700, padding: '1px 4px', borderRadius: 20, background: 'var(--accent-bg,rgba(180,83,9,0.06))', color: 'var(--accent,#b45309)', border: '1px solid var(--accent-border,rgba(180,83,9,0.2))', marginLeft: 2, display: 'inline-block', verticalAlign: 'middle', lineHeight: 1.2 }}>R{p.rebuys - 1}</span>}
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: Math.round(16*chipScale), color: isWinner ? 'var(--green,#059669)' : isLoser ? 'var(--red,#dc2626)' : 'var(--accent,#b45309)', letterSpacing: 0.5, marginTop: 2, lineHeight: 1 }}>
                  {r2(p.bounty)} zł
                </div>
              </div>
            )
          }

          // Empty seat
          return (
            <div key={s} style={{
              position: 'absolute', left: x+'%', top: y+'%',
              transform: 'translate(-50%,-50%)',
              width: `clamp(${Math.round(108*chipScale)}px,15%,${Math.round(138*chipScale)}px)`,
              background: isHovered && !readOnly ? 'var(--accent-bg,rgba(180,83,9,0.06))' : 'rgba(255,255,255,0.08)',
              border: `2px ${isHovered && !readOnly ? 'solid' : 'dashed'} ${isHovered && !readOnly ? 'var(--accent,#b45309)' : 'rgba(255,255,255,0.25)'}`,
              borderRadius: 8, textAlign: 'center',
              cursor: readOnly ? 'default' : 'pointer',
              transition: 'all 0.15s', zIndex: 2,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: 60,
            }}
              onClick={() => !readOnly && onEmptySeatClick?.(tableNum, s)}
              onMouseEnter={() => !readOnly && setHoveredSeat(s)}
              onMouseLeave={() => setHoveredSeat(null)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => !readOnly && onDrop?.(tableNum, s)}
            >
              <div style={{ position: 'absolute', top: 2, right: 4, fontSize: 9, fontWeight: 700, color: isHovered && !readOnly ? 'var(--accent,#b45309)' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>{s}</div>
              <div style={{ fontSize: isHovered && !readOnly ? 22 : 16, color: isHovered && !readOnly ? 'var(--accent,#b45309)' : 'rgba(255,255,255,0.3)', fontWeight: 700, lineHeight: 1, transition: 'all 0.15s' }}>+</div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}

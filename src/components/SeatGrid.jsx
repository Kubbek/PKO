import { useState } from 'react'
import { r2 } from '../lib/bounty'

export default function SeatGrid({ players, tableNum, onSeatClick, onSeatRightClick, onDragStart, onDrop, onEmptySeatClick, selectedWinner, selectedLoser, readOnly = false }) {
  const [hoveredSeat, setHoveredSeat] = useState(null)
  const seats = Array.from({ length: 9 }, (_, i) => i + 1)
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)

  return (
    <div style={{
      background: '#061008', borderRadius: 16, padding: 8,
      display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6,
      border: '1px solid rgba(233,185,73,.1)',
      width: '100%', boxSizing: 'border-box',
    }}>
      {seats.map(s => {
        const p = tablePlayers.find(pp => pp.seat === s)
        const isWinner = p && selectedWinner === p.id
        const isLoser  = p && selectedLoser  === p.id
        const isHovered = hoveredSeat === s

        const bg = isWinner ? 'rgba(74,222,128,.1)'
          : isLoser  ? 'rgba(248,113,113,.1)'
          : p        ? '#16191e'
          : isHovered && !readOnly ? 'rgba(233,185,73,.07)'
          : 'rgba(255,255,255,.02)'

        const borderColor = isWinner ? 'var(--green)'
          : isLoser  ? 'var(--red)'
          : p        ? 'rgba(255,255,255,.1)'
          : isHovered && !readOnly ? 'rgba(233,185,73,.4)'
          : 'rgba(255,255,255,.06)'

        return (
          <div key={s} style={{
            borderRadius: 10,
            /* aspect-ratio keeps cells square-ish on any screen width */
            aspectRatio: '1 / 1',
            position: 'relative',
            background: bg,
            border: `${isWinner || isLoser ? 2 : 1}px ${p || (isHovered && !readOnly) ? 'solid' : 'dashed'} ${borderColor}`,
            overflow: 'hidden',
            cursor: p && !readOnly ? 'pointer' : readOnly ? 'default' : 'pointer',
            transition: 'all .15s',
            boxShadow: p ? '0 2px 6px rgba(0,0,0,.3)' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
            draggable={!!p && !readOnly}
            onClick={() => { if (!readOnly) { if (p) onSeatClick?.(p); else onEmptySeatClick?.(tableNum, s) } }}
            onContextMenu={e => { e.preventDefault(); p && !readOnly && onSeatRightClick?.(p, e) }}
            onDragStart={() => p && !readOnly && onDragStart?.(p)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => !readOnly && onDrop?.(tableNum, s)}
            onMouseEnter={() => !readOnly && setHoveredSeat(s)}
            onMouseLeave={() => setHoveredSeat(null)}
          >
            {p ? (
              <div style={{ padding: '8px 6px', textAlign: 'center', width: '100%' }}>
                <div style={{
                  fontSize: 'clamp(11px, 2.5vw, 15px)', fontWeight: 700,
                  color: isWinner ? 'var(--green)' : isLoser ? 'var(--red)' : 'var(--text)',
                  lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.name}
                  {p.rebuys > 1 && (
                    <span style={{ fontSize: 'clamp(7px,1.5vw,9px)', fontWeight: 800, padding: '1px 5px', borderRadius: 20, background: 'rgba(233,185,73,.12)', color: 'var(--gold)', border: '1px solid rgba(233,185,73,.28)', marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' }}>
                      R{p.rebuys - 1}
                    </span>
                  )}
                </div>
                <div style={{
                  fontFamily: 'Saira Condensed,sans-serif',
                  fontSize: 'clamp(13px, 3vw, 17px)',
                  color: isWinner ? 'var(--green)' : isLoser ? 'var(--red)' : 'var(--gold)',
                  marginTop: 3, letterSpacing: .5, fontVariantNumeric: 'tabular-nums',
                }}>
                  {r2(p.bounty)} zł
                </div>
                {p.pocket_bounty > 0 && (
                  <div style={{ fontSize: 'clamp(9px,1.8vw,11px)', color: 'var(--green)', marginTop: 2, fontWeight: 700 }}>
                    +{r2(p.pocket_bounty)} zł
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: isHovered && !readOnly ? 'clamp(20px,4vw,28px)' : 'clamp(16px,3vw,22px)', color: isHovered && !readOnly ? 'var(--gold)' : 'rgba(255,255,255,.08)', transition: 'all .15s', lineHeight: 1 }}>+</div>
                {isHovered && !readOnly && <div style={{ fontSize: 'clamp(9px,1.8vw,11px)', color: 'var(--gold)', fontWeight: 700 }}>Dodaj</div>}
              </div>
            )}
            {/* Seat number watermark */}
            <div style={{ position: 'absolute', bottom: 3, right: 5, fontFamily: 'Saira Condensed,sans-serif', fontSize: 'clamp(18px,3.5vw,28px)', color: 'rgba(255,255,255,.04)', lineHeight: 1, pointerEvents: 'none' }}>{s}</div>
          </div>
        )
      })}
    </div>
  )
}

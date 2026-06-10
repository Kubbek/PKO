import { useState } from 'react'
import { r2 } from '../lib/bounty'

export default function OvalTable({ players, tableNum, onSeatClick, onSeatRightClick, onDragStart, onDrop, onEmptySeatClick, selectedWinner, selectedLoser, readOnly = false, chipScale = 1 }) {
  const [hoveredSeat, setHoveredSeat] = useState(null)
  const seats = Array.from({ length: 9 }, (_, i) => i + 1)
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)

  return (
    <div style={{ width: '100%', padding: '0 7%', margin: '8px 0 12px', boxSizing: 'border-box' }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '65%' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: '#061008',
          border: '4px solid rgba(233,185,73,.35)',
          boxSizing: 'border-box', overflow: 'visible',
        }}>
          {/* Inner ring */}
          <div style={{ position: 'absolute', inset: '10%', borderRadius: '50%', border: '1.5px solid rgba(233,185,73,.15)', pointerEvents: 'none' }} />
          {/* Table label */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Saira Condensed',sans-serif", fontSize: `clamp(14px,3vw,22px)`, letterSpacing: 3, color: 'rgba(233,185,73,.18)', pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap', fontWeight: 700 }}>
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
            const chipW = Math.round(108 * chipScale)
            const chipWMax = Math.round(138 * chipScale)
            const fName = Math.round(16 * chipScale)
            const fBounty = Math.round(16 * chipScale)
            const fNum = Math.round(9 * chipScale)

            const borderColor = isWinner ? 'var(--green)'
              : isLoser  ? 'var(--red)'
              : p        ? 'rgba(255,255,255,.14)'
              : isHovered && !readOnly ? 'rgba(233,185,73,.5)'
              :             'rgba(255,255,255,.07)'

            const bg = isWinner ? 'rgba(74,222,128,.12)'
              : isLoser  ? 'rgba(248,113,113,.12)'
              : p        ? '#16191e'
              : isHovered && !readOnly ? 'rgba(233,185,73,.08)'
              :             'rgba(255,255,255,.03)'

            return (
              <div key={s} style={{
                position: 'absolute', left: x + '%', top: y + '%',
                transform: 'translate(-50%,-50%)',
                width: `clamp(${chipW}px,${Math.round(13*chipScale)}%,${chipWMax}px)`,
                background: bg,
                border: `2px ${p || (isHovered && !readOnly) ? 'solid' : 'dashed'} ${borderColor}`,
                borderRadius: 10, padding: '6px 5px 5px', textAlign: 'center',
                cursor: p && !readOnly ? 'pointer' : readOnly ? 'default' : 'pointer',
                transition: 'all 0.15s', zIndex: 2,
                boxShadow: p ? '0 2px 8px rgba(0,0,0,.4)' : 'none',
              }}
                onClick={() => { if (!readOnly) { if (p) onSeatClick?.(p); else onEmptySeatClick?.(tableNum, s) } }}
                onContextMenu={e => { e.preventDefault(); p && !readOnly && onSeatRightClick?.(p, e) }}
                draggable={!!p && !readOnly}
                onDragStart={() => p && !readOnly && onDragStart?.(p)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => !readOnly && onDrop?.(tableNum, s)}
                onMouseEnter={() => !readOnly && setHoveredSeat(s)}
                onMouseLeave={() => setHoveredSeat(null)}
              >
                <div style={{ position: 'absolute', top: 2, right: 4, fontSize: fNum, fontWeight: 700, color: 'rgba(255,255,255,.2)', lineHeight: 1, fontFamily: 'Saira Condensed,sans-serif' }}>{s}</div>
                {p ? (
                  <>
                    <div style={{ fontSize: `clamp(${Math.round(10*chipScale)}px, ${Math.round(fName/16*2.5)}vw, ${fName}px)`, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingTop: 2, color: isWinner ? 'var(--green)' : isLoser ? 'var(--red)' : 'var(--text)' }}>
                      {p.name}
                      {p.rebuys > 1 && <span style={{ fontSize: Math.round(8 * chipScale), fontWeight: 800, padding: '1px 4px', borderRadius: 20, background: 'rgba(233,185,73,.12)', color: 'var(--gold)', border: '1px solid rgba(233,185,73,.28)', marginLeft: 2, display: 'inline-block', verticalAlign: 'middle', lineHeight: 1.2 }}>R{p.rebuys - 1}</span>}
                    </div>
                    <div style={{ fontFamily: "'Saira Condensed',sans-serif", fontSize: `clamp(${Math.round(10*chipScale)}px, ${Math.round(fBounty/16*2.5)}vw, ${fBounty}px)`, color: isWinner ? 'var(--green)' : isLoser ? 'var(--red)' : 'var(--gold)', letterSpacing: .5, marginTop: 3, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {r2(p.bounty)} zł
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: Math.round(18 * chipScale), color: isHovered && !readOnly ? 'var(--gold)' : 'rgba(255,255,255,.12)', lineHeight: 1, marginTop: 6, transition: 'all .15s' }}>+</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

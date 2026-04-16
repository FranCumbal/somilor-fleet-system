// ── Shared UI components ──────────────────────

export function KpiCard({ label, value, delta, deltaType = 'up', accent }) {
  const colors = { up: 'var(--green)', down: 'var(--red)', warn: 'var(--amber)' }
  return (
    <div style={{
      background:'var(--panel)', border:'1px solid var(--border-soft)',
      borderRadius:12, padding:'18px 20px', display:'flex', flexDirection:'column', gap:10,
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background: accent || 'var(--gold)', opacity:0.7 }} />
      <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono', color:'var(--text-1)', lineHeight:1 }}>{value}</div>
      {delta && (
        <div style={{ fontSize:11, color: colors[deltaType] }}>{delta}</div>
      )}
    </div>
  )
}

export function Panel({ children, style }) {
  return (
    <div style={{
      background:'var(--panel)', border:'1px solid var(--border-soft)',
      borderRadius:12, overflow:'hidden', ...style,
    }}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, children }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'16px 20px', borderBottom:'1px solid var(--border-soft)',
    }}>
      <div style={{ fontSize:14, fontWeight:600 }}>{title}</div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>{children}</div>
    </div>
  )
}

export function Chip({ children, active, onClick }) {
  return (
    <span onClick={onClick} style={{
      fontSize:11, padding:'3px 10px', borderRadius:20, cursor:'pointer',
      background: active ? 'rgba(200,168,75,0.12)' : 'var(--panel2)',
      color: active ? 'var(--gold-light)' : 'var(--text-2)',
      border: active ? '1px solid var(--border)' : '1px solid var(--border-soft)',
      transition:'all 0.15s',
    }}>
      {children}
    </span>
  )
}

export function Btn({ children, variant = 'ghost', onClick, style }) {
  const base = {
    padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:500,
    cursor:'pointer', border:'none', fontFamily:'DM Sans, sans-serif',
    transition:'all 0.18s', ...style,
  }
  const variants = {
    primary: { background:'var(--gold)', color:'#0E1117' },
    ghost: { background:'var(--panel2)', color:'var(--text-2)', border:'1px solid var(--border-soft)' },
    danger: { background:'rgba(224,82,82,0.15)', color:'var(--red)', border:'1px solid rgba(224,82,82,0.3)' },
  }
  return <button onClick={onClick} style={{ ...base, ...variants[variant] }}>{children}</button>
}

export function Badge({ children, type = 'default' }) {
  const colors = {
    default: { bg:'var(--red)', color:'#fff' },
    amber: { bg:'var(--amber)', color:'#0E1117' },
    green: { bg:'var(--green)', color:'#0E1117' },
  }
  const c = colors[type]
  return (
    <span style={{
      fontSize:10, background:c.bg, color:c.color,
      borderRadius:8, padding:'1px 6px', fontWeight:600,
    }}>{children}</span>
  )
}

export function StatusPill({ status }) {
  const map = {
    operativo: { label:'Operativo', cls:'status-operativo' },
    taller:    { label:'En taller', cls:'status-taller' },
    libre:     { label:'Libre',     cls:'status-libre' },
    aprobado:  { label:'Aprobado',  color:'var(--green)', bg:'rgba(61,200,122,0.1)' },
    reprobado: { label:'Reprobado', color:'var(--red)',   bg:'rgba(224,82,82,0.1)' },
    preventivo:{ label:'Preventivo',color:'var(--blue)',  bg:'rgba(77,156,240,0.1)' },
    correctivo:{ label:'Correctivo',color:'var(--red)',   bg:'rgba(224,82,82,0.1)' },
    programado:{ label:'Programado',color:'var(--amber)', bg:'rgba(240,167,66,0.1)' },
    completado:{ label:'Completado',color:'var(--green)', bg:'rgba(61,200,122,0.1)' },
    en_proceso:{ label:'En proceso',color:'var(--blue)',  bg:'rgba(77,156,240,0.1)' },
    vencido:   { label:'Vencido',   color:'var(--red)',   bg:'rgba(224,82,82,0.1)' },
  }
  const m = map[status] || { label: status, color:'var(--text-2)', bg:'var(--panel2)' }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:500,
      color: m.color, background: m.bg,
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
      {m.label}
    </span>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:0 }}>
      <div>
        <div style={{ fontSize:20, fontWeight:600 }}>{title}</div>
        {subtitle && <div style={{ fontSize:12, color:'var(--text-3)', marginTop:3, fontFamily:'Space Mono' }}>{subtitle}</div>}
      </div>
      <div style={{ display:'flex', gap:8 }}>{children}</div>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div style={{ padding:48, textAlign:'center', color:'var(--text-3)', fontSize:13 }}>
      Cargando...
    </div>
  )
}

export function EmptyState({ message = 'Sin registros' }) {
  return (
    <div style={{ padding:48, textAlign:'center', color:'var(--text-3)', fontSize:13 }}>
      {message}
    </div>
  )
}

export function Table({ columns, data, rowKey = 'id' }) {
  return (
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={{
              padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:500,
              textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)',
              borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)',
            }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row[rowKey]} style={{ cursor:'pointer', transition:'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--panel2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {columns.map((col) => (
              <td key={col.key} style={{
                padding:'14px 20px', fontSize:13,
                borderBottom:'1px solid var(--border-soft)', verticalAlign:'middle',
              }}>
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

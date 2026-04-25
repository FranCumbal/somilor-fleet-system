import { useState, useRef, useEffect } from 'react'

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
      display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap: '14px',
      padding:'16px 20px', borderBottom:'1px solid var(--border-soft)',
    }}>
      <div style={{ fontSize:14, fontWeight:600 }}>{title}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>{children}</div>
    </div>
  )
}

export function Chip({ children, active, onClick }) {
  return (
    <span onClick={onClick} style={{
      fontSize:11, padding:'4px 12px', borderRadius:20, cursor:'pointer', display: 'inline-block',
      background: active ? 'rgba(200,168,75,0.12)' : 'var(--panel2)',
      color: active ? 'var(--gold-light)' : 'var(--text-2)',
      border: active ? '1px solid var(--border)' : '1px solid var(--border-soft)',
      transition:'all 0.15s', whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  )
}

export function Btn({ children, variant = 'ghost', onClick, style }) {
  const base = {
    padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:500,
    cursor:'pointer', border:'none', fontFamily:'DM Sans, sans-serif',
    transition:'all 0.18s', whiteSpace: 'nowrap', ...style,
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
      borderRadius:8, padding:'2px 8px', fontWeight:600, whiteSpace: 'nowrap'
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
      display:'inline-flex', alignItems:'center', gap:6,
      fontSize:11, padding:'4px 12px', borderRadius:20, fontWeight:600,
      color: m.color, background: m.bg, whiteSpace: 'nowrap'
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
      {m.label}
    </span>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ display:'flex', flexWrap: 'wrap', justifyContent:'space-between', alignItems:'flex-start', gap: '16px', marginBottom:0 }}>
      <div style={{ flex: '1 1 min-content' }}>
        <div style={{ fontSize:22, fontWeight:700 }}>{title}</div>
        {subtitle && <div style={{ fontSize:13, color:'var(--text-3)', marginTop:4, fontFamily:'Space Mono' }}>{subtitle}</div>}
      </div>
      <div style={{ display:'flex', flexWrap: 'wrap', gap:10 }}>{children}</div>
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
    <div className="table-responsive-container">
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth: '900px' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding:'12px 20px', textAlign:'left', fontSize:11, fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)',
                borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)',
                whiteSpace: 'nowrap'
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
    </div>
  )
}

export function ProfileDropdown({ userInitials = 'A', userName = 'Administrador', onLogout }) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null) // <-- Añadimos estado para el mensaje flotante local
  const menuRef = useRef()

  const showToast = (mensaje) => {
    setToast(mensaje)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      
      {/* EL MENSAJE FLOTANTE (ESTILO MODO OSCURO PREMIUM) */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(14, 17, 23, 0.95)', backdropFilter: 'blur(10px)',
          border: '1px solid var(--gold)', color: 'var(--gold-light)',
          padding: '14px 28px', borderRadius: '30px', fontSize: '14px', fontWeight: 600,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 999999,
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'toastPopUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}>
          <span style={{ fontSize: '18px' }}>✨</span> {toast}
        </div>
      )}

      {/* EL BOTÓN DE LA INICIAL */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 38, height: 38, borderRadius: '50%', border: open ? '2px solid var(--gold)' : '2px solid var(--border-soft)',
          background: 'var(--panel2)', color: 'var(--gold-light)', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', padding: 0, fontFamily: 'Space Mono'
        }}
      >
        {userInitials}
      </button>

      {/* EL MENÚ FLOTANTE */}
      {open && (
        <div style={{
          position: 'absolute', top: '125%', right: 0, width: 220,
          background: 'var(--panel)', border: '1px solid var(--border-soft)',
          borderRadius: 12, padding: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 9999, animation: 'fadeInDropdown 0.2s ease-out'
        }}>
          {/* Cabecera del menú */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-soft)', marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{userName}</div>
            <div style={{ fontSize: 11, color: 'var(--green)' }}>● Sistema Activo</div>
          </div>

          {/* Opciones con funcionalidad de "Próximamente" */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button 
              className="menu-item-dropdown" 
              onClick={() => { setOpen(false); showToast('El Perfil de Usuario estará disponible próximamente'); }}
            >
              Mi Perfil
            </button>
            <button 
              className="menu-item-dropdown" 
              onClick={() => { setOpen(false); showToast('La Configuración del Sistema estará disponible próximamente'); }}
            >
              Configuración del Sistema
            </button>
            
            <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 0' }} />
            
            <button 
              className="menu-item-dropdown logout-btn" 
              onClick={() => { setOpen(false); if(onLogout) onLogout(); }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Estilos inyectados para las animaciones */}
      <style>{`
        @keyframes fadeInDropdown {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastPopUp { 
          from { opacity: 0; transform: translate(-50%, 20px); } 
          to { opacity: 1; transform: translate(-50%, 0); } 
        }
        .menu-item-dropdown {
          padding: 10px 12px; background: transparent; border: none; border-radius: 6px;
          color: var(--text-2); font-size: 13px; text-align: left; cursor: pointer;
          transition: all 0.2s; width: 100%; font-family: 'DM Sans', sans-serif;
        }
        .menu-item-dropdown:hover {
          background: var(--panel2); color: var(--gold-light);
        }
        .logout-btn { color: var(--red); }
        .logout-btn:hover { background: rgba(224,82,82,0.1); color: var(--red); }
      `}</style>
    </div>
  )
}
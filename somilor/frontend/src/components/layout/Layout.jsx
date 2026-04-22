import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard',     icon: '▦',  label: 'Panel principal' },
  { to: '/vehiculos',     icon: '🚛', label: 'Flota' },
  { to: '/choferes',      icon: '👷', label: 'Choferes' },
  { to: '/combustible',   icon: '⛽', label: 'Combustible' },
  { to: '/mantenimiento', icon: '🔧', label: 'Mantenimiento' },
  { to: '/checklist',     icon: '✅', label: 'Checklist' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // 1. Estado para el tema (busca en localStorage o usa 'dark' por defecto)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  // 2. Efecto para aplicar la clase al <body> cuando cambia el tema
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // 3. Función para alternar el estado
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>

      {/* TOP BAR */}
      <header style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 24px', height:'56px',
        background:'var(--panel)', borderBottom:'1px solid var(--border)',
        position:'sticky', top:0, zIndex:100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:30, height:30, background:'var(--gold)',
            clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
          }} />
          <div>
            <div style={{ fontFamily:'Space Mono', fontSize:15, fontWeight:700, color:'var(--gold-light)', letterSpacing:'0.08em' }}>SOMILOR</div>
            <div style={{ fontSize:10, color:'var(--text-3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Fleet Management</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {/* 4. Botón para alternar el tema */}
          <button onClick={toggleTheme} style={{
            background:'transparent', border:'none', fontSize:18, cursor:'pointer',
            padding:4, display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--text-2)'
          }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--green)', fontFamily:'Space Mono' }}>
            <div style={{
              width:7, height:7, borderRadius:'50%', background:'var(--green)',
              boxShadow:'0 0 6px var(--green)',
              animation:'pulse 2s ease-in-out infinite',
            }} />
            Sistema activo
          </div>
          <div style={{
            width:32, height:32, borderRadius:'50%',
            background:'linear-gradient(135deg, var(--gold-dim), var(--gold))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:700, color:'#0E1117', cursor:'pointer',
          }} title={user?.nombre} onClick={handleLogout}>
            {user?.nombre?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>

        {/* SIDEBAR */}
        <aside style={{
          width:220, minWidth:220,
          background:'var(--panel)', borderRight:'1px solid var(--border-soft)',
          padding:'16px 10px', display:'flex', flexDirection:'column', gap:4,
        }}>
          <div style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-3)', padding:'8px 8px 4px' }}>Módulos</div>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 10px', borderRadius:8, fontSize:13, fontWeight:500,
              color: isActive ? 'var(--gold-light)' : 'var(--text-2)',
              background: isActive ? 'rgba(200,168,75,0.1)' : 'transparent',
              border: isActive ? '1px solid var(--border)' : '1px solid transparent',
              textDecoration:'none', transition:'all 0.18s',
            })}>
              <span style={{ fontSize:16, width:20, textAlign:'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}

          <div style={{ marginTop:'auto', padding:'8px 8px 4px', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-3)' }}>Cuenta</div>
          <button onClick={handleLogout} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'9px 10px', borderRadius:8, fontSize:13, fontWeight:500,
            color:'var(--text-2)', background:'transparent', border:'1px solid transparent',
            cursor:'pointer', transition:'all 0.18s', textAlign:'left',
          }}>
            <span style={{ fontSize:16, width:20, textAlign:'center' }}>🚪</span>
            Cerrar sesión
          </button>
        </aside>

        {/* PAGE CONTENT */}
        <main style={{ flex:1, padding:24, overflowY:'auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
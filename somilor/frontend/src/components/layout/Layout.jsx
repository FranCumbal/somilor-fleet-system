import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

// Importamos el logo
import logo from '../../assets/SomilorLogo.png'

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

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>

      {/* TOP BAR - DISEÑO CORPORATIVO REFORZADO */}
      <header style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 24px', height:'65px', // Un poco más alto para el logo grande
        background:'var(--panel)', borderBottom:'1px solid var(--border)',
        position:'sticky', top:0, zIndex:100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          {/* Logo Principal en Header - Más grande y claro */}
          <img 
            src={logo} 
            alt="SOMILOR" 
            style={{ 
              height: '45px', 
              width: 'auto', 
              filter: theme === 'dark' ? 'drop-shadow(0 0 8px rgba(200,168,75,0.2))' : 'none'
            }} 
          />
          <div style={{ 
            width: '2px', 
            height: '25px', 
            background: 'var(--border-soft)' 
          }} />
          <div style={{ 
            fontFamily:'Space Mono', 
            fontSize:18, 
            fontWeight:800, 
            color:'var(--gold-light)', 
            letterSpacing:'0.1em' 
          }}>
            SOMILOR
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <button onClick={toggleTheme} style={{
            background:'var(--panel2)', border:'1px solid var(--border-soft)', 
            fontSize:16, cursor:'pointer', width:36, height:36, borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--text-2)', transition: 'all 0.2s'
          }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--green)', fontFamily:'Space Mono', background: 'rgba(61,200,122,0.05)', padding: '6px 12px', borderRadius: 20 }}>
            <div style={{
              width:8, height:8, borderRadius:'50%', background:'var(--green)',
              boxShadow:'0 0 8px var(--green)',
              animation:'pulse 2s ease-in-out infinite',
            }} />
            SISTEMA ACTIVO
          </div>
          
          <div style={{
            width:38, height:38, borderRadius:12,
            background:'linear-gradient(135deg, var(--gold-dim), var(--gold))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, fontWeight:800, color:'#0E1117', cursor:'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }} title={user?.nombre} onClick={handleLogout}>
            {user?.nombre?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>
        <aside style={{
          width:230, minWidth:230,
          background:'var(--panel)', borderRight:'1px solid var(--border-soft)',
          padding:'20px 12px', display:'flex', flexDirection:'column', gap:6,
        }}>
          <div style={{ fontSize:10, fontWeight: 700, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--text-3)', padding:'0 10px 10px' }}>Navegación</div>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:12,
              padding:'11px 14px', borderRadius:10, fontSize:14, fontWeight:550,
              color: isActive ? 'var(--gold-light)' : 'var(--text-2)',
              background: isActive ? 'rgba(200,168,75,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(200,168,75,0.2)' : '1px solid transparent',
              textDecoration:'none', transition:'all 0.2s',
            })}>
              <span style={{ fontSize:18 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
          
          <div style={{ marginTop:'auto', paddingTop: 20, borderTop: '1px solid var(--border-soft)' }}>
            <button onClick={handleLogout} style={{
              display:'flex', alignItems:'center', gap:12, width:'100%',
              padding:'11px 14px', borderRadius:10, fontSize:14, fontWeight:550,
              color:'var(--red)', background:'transparent', border:'none',
              cursor:'pointer', transition:'all 0.2s', textAlign:'left',
            }}>
              <span style={{ fontSize:18 }}>🚪</span>
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main style={{ flex:1, padding:24, overflowY:'auto', position: 'relative', background: 'var(--bg)' }}>
          
          {/* MARCA DE AGUA DINÁMICA - MÁS VISIBLE Y ADAPTATIVA */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${logo})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '35%', 
            opacity: theme === 'dark' ? 0.07 : 0.12, 
            filter: theme === 'dark' ? 'none' : 'grayscale(1) brightness(0.9)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .light-theme {
          --bg: #f8f9fa;
          --panel: #ffffff;
          --panel2: #f1f3f5;
          --border: #dee2e6;
          --border-soft: #e9ecef;
          --text-1: #212529;
          --text-2: #495057;
          --text-3: #adb5bd;
        }
      `}</style>
    </div>
  )
}
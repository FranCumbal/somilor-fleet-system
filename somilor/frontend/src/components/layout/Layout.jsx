import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ProfileDropdown } from './UI' 

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

// Iconos SVG limpios para la interfaz
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ChevronLeftIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Estados de interfaz y tema
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [isCollapsed, setIsCollapsed] = useState(false) // Para desktop
  const [isMobileOpen, setIsMobileOpen] = useState(false) // Para celular

  useEffect(() => {
    if (theme === 'light') document.body.classList.add('light-theme')
    else document.body.classList.remove('light-theme')
    localStorage.setItem('theme', theme)
  }, [theme])

  // Cierra el menú móvil automáticamente al cambiar de ruta
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="app-container">
      {/* TOP BAR */}
      <header className="top-header">
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          
          <button className="hamburger-btn" onClick={() => setIsMobileOpen(!isMobileOpen)}>
            {isMobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          <img 
            src={logo} 
            alt="SOMILOR" 
            style={{ 
              height: '45px', 
              width: 'auto', 
              filter: theme === 'dark' ? 'drop-shadow(0 0 8px rgba(200,168,75,0.2))' : 'none'
            }} 
          />
          <div className="brand-divider" />
          <div className="brand-text">SOMILOR</div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div className="system-status">
            <div className="status-dot" />
            <span className="status-text">SISTEMA ACTIVO</span>
          </div>
          
          {/* AQUÍ ESTÁ LA MAGIA: Reemplazamos tu div user-avatar por el ProfileDropdown */}
          <ProfileDropdown 
            userInitials={user?.nombre?.charAt(0).toUpperCase() || 'U'} 
            userName={user?.nombre || 'Administrador'} 
            onLogout={logout} 
          />
        </div>
      </header>

      <div className="main-body">
        {/* FONDO BORROSO MÓVIL (Se activa al abrir el menú) */}
        <div className={`mobile-overlay ${isMobileOpen ? 'open' : ''}`} onClick={() => setIsMobileOpen(false)} />

        {/* SIDEBAR (Navegación Lateral) */}
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
          <div className="nav-header">Navegación</div>
          
          <div className="nav-menu">
            {navItems.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{label}</span>
              </NavLink>
            ))}
          </div>
          
          <div className="sidebar-footer">
            <button onClick={handleLogout} className="logout-btn">
              <span className="nav-icon">🚪</span>
              <span className="nav-label">Cerrar sesión</span>
            </button>
            
            {/* Botón para colapsar/expandir (Solo visible en Desktop) */}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="desktop-toggle-btn">
              <span className="nav-icon toggle-icon">
                {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </span>
              <span className="nav-label">Ocultar menú</span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO DE LA PÁGINA */}
        <main className="content-area">
          {/* MARCA DE AGUA */}
          <div className="watermark" style={{
            backgroundImage: `url(${logo})`,
            opacity: theme === 'dark' ? 0.07 : 0.12, 
            filter: theme === 'dark' ? 'none' : 'grayscale(1) brightness(0.9)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* ESTILOS CSS AVANZADOS Y RESPONSIVOS (INTACTOS) */}
      <style>{`
        /* BLOQUEAR EL SCROLL GLOBAL PARA FIJAR LA BARRA LATERAL */
        html, body { height: 100%; overflow: hidden; margin: 0; padding: 0; }
        
        .app-container { display: flex; flex-direction: column; height: 100vh; background: var(--bg); }
        .main-body { display: flex; flex: 1; position: relative; overflow: hidden; }
        
        /* HEADER STYLES */
        .top-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: 65px; min-height: 65px;
          background: var(--panel); border-bottom: 1px solid var(--border);
          z-index: 100;
        }
        .brand-divider { width: 2px; height: 25px; background: var(--border-soft); }
        .brand-text { font-family: 'Space Mono'; font-size: 18px; font-weight: 800; color: var(--gold-light); letter-spacing: 0.1em; }
        
        .hamburger-btn {
          display: none;
          background: transparent; border: none; color: var(--text-1);
          cursor: pointer; padding: 4px; align-items: center; justify-content: center;
          transition: transform 0.2s ease;
        }
        .hamburger-btn:active { transform: scale(0.9); }
        
        .theme-toggle {
          background: var(--panel2); border: 1px solid var(--border-soft); 
          font-size: 16px; cursor: pointer; width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-2); transition: all 0.2s;
        }
        
        .system-status {
          display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--green); 
          font-family: 'Space Mono'; background: rgba(61,200,122,0.05); padding: 6px 12px; border-radius: 20px;
        }
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%; background: var(--green);
          box-shadow: 0 0 8px var(--green); animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        
        /* SIDEBAR STYLES (DESKTOP) */
        .sidebar {
          width: 230px; min-width: 230px; height: 100%;
          background: var(--panel); border-right: 1px solid var(--border-soft);
          display: flex; flex-direction: column;
          transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          z-index: 99; white-space: nowrap; overflow-y: auto; overflow-x: hidden;
        }
        .sidebar.collapsed { width: 80px; min-width: 80px; }
        
        .nav-header {
          font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; 
          color: var(--text-3); padding: 20px 22px 10px; transition: opacity 0.2s;
        }
        .nav-menu { display: flex; flex-direction: column; gap: 6px; padding: 0 12px; }
        
        .nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 10px; font-size: 14px; font-weight: 550;
          color: var(--text-2); background: transparent; border: 1px solid transparent;
          text-decoration: none; transition: all 0.2s;
        }
        .nav-link:hover { color: var(--text-1); background: rgba(255,255,255,0.02); }
        .nav-link.active {
          color: var(--gold-light); background: rgba(200,168,75,0.12);
          border: 1px solid rgba(200,168,75,0.2);
        }
        
        .nav-icon { font-size: 18px; width: 24px; text-align: center; flex-shrink: 0; display: flex; justify-content: center; }
        .nav-label { transition: opacity 0.2s ease; opacity: 1; }
        
        .sidebar-footer { margin-top: auto; padding: 20px 12px; border-top: 1px solid var(--border-soft); display: flex; flex-direction: column; gap: 6px; }
        
        .logout-btn, .desktop-toggle-btn {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 11px 14px; border-radius: 10px; font-size: 14px; font-weight: 550;
          background: transparent; border: none; cursor: pointer; transition: all 0.2s; text-align: left;
        }
        .logout-btn { color: var(--red); }
        .logout-btn:hover { background: rgba(224,82,82,0.1); }
        .desktop-toggle-btn { color: var(--text-3); }
        .desktop-toggle-btn:hover { color: var(--text-1); background: rgba(255,255,255,0.03); }
        .toggle-icon { color: var(--text-3); display: flex; align-items: center; }

        .sidebar.collapsed .nav-label, .sidebar.collapsed .nav-header { opacity: 0; display: none; }
        .sidebar.collapsed .nav-link, .sidebar.collapsed .logout-btn, .sidebar.collapsed .desktop-toggle-btn { justify-content: center; padding: 11px 0; }
        .sidebar.collapsed .nav-icon { margin: 0; }

        /* ÁREA DE CONTENIDO CON SCROLL PROPIO */
        .content-area { flex: 1; height: 100%; padding: 24px; overflow-y: auto; position: relative; }
        
        .watermark {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background-repeat: no-repeat; background-position: center; background-size: 35%; 
          pointer-events: none; z-index: 0;
        }

        .mobile-overlay { display: none; }

        /* ================= MOBILE RESPONSIVE ================= */
        @media (max-width: 768px) {
          .hamburger-btn { display: flex; }
          .brand-divider, .brand-text, .status-text { display: none; }
          .top-header { padding: 0 16px; }
          .desktop-toggle-btn { display: none !important; }
          
          .content-area { padding: 16px; }

          .sidebar {
            position: absolute; top: 0; left: 0; bottom: 0;
            width: 260px; min-width: 260px;
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0,0,0,0.3);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          
          .sidebar.collapsed { width: 260px; } 
          .sidebar.collapsed .nav-label, .sidebar.collapsed .nav-header { opacity: 1; display: block; }
          .sidebar.collapsed .nav-link, .sidebar.collapsed .logout-btn { justify-content: flex-start; padding: 11px 14px; }

          .mobile-overlay.open {
            display: block; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(3px); z-index: 98;
          }
        }

        /* TEMA CLARO COLORES */
        .light-theme {
          --bg: #f8f9fa; --panel: #ffffff; --panel2: #f1f3f5;
          --border: #dee2e6; --border-soft: #e9ecef;
          --text-1: #212529; --text-2: #495057; --text-3: #adb5bd;
        }
      `}</style>
    </div>
  )
}
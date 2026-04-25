import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Importamos el logo
import logo from '../assets/SomilorLogo.png'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  const theme = localStorage.getItem('theme') || 'dark'

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)',
    }}>
      <div style={{
        width:400, // Lo hice un poquito más ancho para que el logo respire mejor
        background:'var(--panel)',
        border:'1px solid var(--border-soft)', borderRadius:16, padding:'40px 30px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.1)' 
      }}>
        
        {/* LOGO CORPORATIVO - AHORA MÁS GRANDE Y FORZADO AL CENTRO */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', // Centrado absoluto con flexbox
          justifyContent: 'center',
          marginBottom: 36 
        }}>
          <img 
            src={logo} 
            alt="Logo SOMILOR" 
            style={{ 
              height: '110px', // Tamaño imponente
              width: 'auto', 
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 20px auto', // Asegura el centrado y da espacio abajo
              filter: theme === 'dark' ? 'drop-shadow(0 0 15px rgba(200,168,75,0.2))' : 'none' 
            }} 
          />
          <div style={{ fontFamily:'Space Mono', fontSize:24, fontWeight:800, color:'var(--gold-light)', letterSpacing:'0.12em', textAlign: 'center' }}>SOMILOR</div>
          <div style={{ fontSize:13, color:'var(--text-3)', marginTop:6, letterSpacing:'0.05em', textAlign: 'center' }}>Sistema de Gestión de Flotas</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:8, fontWeight:500 }}>Correo Electrónico</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{
                width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)',
                borderRadius:8, padding:'12px 14px', color:'var(--text-1)', fontSize:14,
                outline:'none', fontFamily:'DM Sans, sans-serif', transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.border = '1px solid var(--gold)'}
              onBlur={e => e.target.style.border = '1px solid var(--border-soft)'}
            />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:8, fontWeight:500 }}>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{
                width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)',
                borderRadius:8, padding:'12px 14px', color:'var(--text-1)', fontSize:14,
                outline:'none', fontFamily:'DM Sans, sans-serif', transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.border = '1px solid var(--gold)'}
              onBlur={e => e.target.style.border = '1px solid var(--border-soft)'}
            />
          </div>

          {error && (
            <div style={{ background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, padding:'12px 14px', fontSize:13, color:'var(--red)', fontWeight:500, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background:'linear-gradient(to right, var(--gold), var(--gold-light))', 
            color:'#0E1117', border:'none',
            borderRadius:8, padding:'14px', fontSize:15, fontWeight:700,
            cursor:'pointer', fontFamily:'DM Sans, sans-serif',
            opacity: loading ? 0.7 : 1, marginTop:10,
            boxShadow: '0 4px 12px rgba(200,168,75,0.2)'
          }}>
            {loading ? 'Verificando...' : 'Acceder al Sistema'}
          </button>
        </form>

        <div style={{ marginTop:24, padding:'14px', background:'var(--panel2)', borderRadius:8, fontSize:12, color:'var(--text-3)', fontFamily:'Space Mono', textAlign: 'center' }}>
          Demo: admin@somilor.com / admin123
        </div>
      </div>
    </div>
  )
}
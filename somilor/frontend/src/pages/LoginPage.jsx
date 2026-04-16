import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@somilor.com')
  const [password, setPassword] = useState('Admin123!')
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

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--dark-bg)',
    }}>
      <div style={{
        width:380, background:'var(--panel)',
        border:'1px solid var(--border)', borderRadius:16, padding:40,
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:48, height:48, background:'var(--gold)',
            clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
            margin:'0 auto 12px',
          }} />
          <div style={{ fontFamily:'Space Mono', fontSize:20, fontWeight:700, color:'var(--gold-light)', letterSpacing:'0.1em' }}>SOMILOR</div>
          <div style={{ fontSize:12, color:'var(--text-3)', marginTop:4 }}>Sistema de Gestión de Flotas</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{
                width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)',
                borderRadius:8, padding:'10px 14px', color:'var(--text-1)', fontSize:14,
                outline:'none', fontFamily:'DM Sans, sans-serif',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{
                width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)',
                borderRadius:8, padding:'10px 14px', color:'var(--text-1)', fontSize:14,
                outline:'none', fontFamily:'DM Sans, sans-serif',
              }}
            />
          </div>

          {error && (
            <div style={{ background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--red)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background:'var(--gold)', color:'#0E1117', border:'none',
            borderRadius:8, padding:'12px', fontSize:14, fontWeight:600,
            cursor:'pointer', fontFamily:'DM Sans, sans-serif',
            opacity: loading ? 0.7 : 1, marginTop:8,
          }}>
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>
        </form>

        <div style={{ marginTop:20, padding:'12px 14px', background:'var(--panel2)', borderRadius:8, fontSize:11, color:'var(--text-3)', fontFamily:'Space Mono' }}>
          Demo: admin@somilor.com / Admin123!
        </div>
      </div>
    </div>
  )
}

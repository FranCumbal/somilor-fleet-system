import { useEffect, useState } from 'react'
import { vehiculosAPI, choferesAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, StatusPill, Btn, Chip, LoadingSpinner, EmptyState } from '../components/layout/UI'

const TIPOS = ['todos','camioneta','volqueta','excavadora','buldocer','otro']

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ codigo:'', marca:'', modelo:'', anio:'', placa:'', tipo:'camioneta' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const cargar = () => {
    setLoading(true)
    const params = {}
    if (filtroEstado !== 'todos') params.estado = filtroEstado
    if (filtroTipo !== 'todos') params.tipo = filtroTipo
    vehiculosAPI.list(params)
      .then(r => setVehiculos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filtroTipo, filtroEstado])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await vehiculosAPI.create({ ...form, anio: parseInt(form.anio) || null })
      setShowForm(false)
      setForm({ codigo:'', marca:'', modelo:'', anio:'', placa:'', tipo:'camioneta' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const stats = {
    total: vehiculos.length,
    operativos: vehiculos.filter(v => v.estado === 'operativo').length,
    taller: vehiculos.filter(v => v.estado === 'taller').length,
    libres: vehiculos.filter(v => v.estado === 'libre').length,
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <PageHeader title="Gestión de Flota" subtitle={`${stats.total} vehículos registrados`}>
        <Btn variant="primary" onClick={() => setShowForm(!showForm)}>+ Nuevo vehículo</Btn>
      </PageHeader>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Total', value: stats.total, accent:'var(--gold)' },
          { label:'Operativos', value: stats.operativos, accent:'var(--green)' },
          { label:'En taller', value: stats.taller, accent:'var(--red)' },
          { label:'Libres', value: stats.libres, accent:'var(--amber)' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accent, opacity:0.7 }} />
            <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Form nuevo vehículo */}
      {showForm && (
        <Panel>
          <PanelHeader title="Registrar nuevo vehículo">
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
          </PanelHeader>
          <form onSubmit={handleSubmit} style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            {[
              { key:'codigo', label:'Código *', ph:'VH-001' },
              { key:'marca', label:'Marca', ph:'Toyota' },
              { key:'modelo', label:'Modelo', ph:'Hilux 4x4' },
              { key:'anio', label:'Año', ph:'2022', type:'number' },
              { key:'placa', label:'Placa', ph:'PCV-1234' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{f.label}</label>
                <input
                  type={f.type || 'text'} placeholder={f.ph} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Tipo *</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}>
                {['camioneta','volqueta','excavadora','buldocer','otro'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {error && <div style={{ gridColumn:'1/-1', color:'var(--red)', fontSize:12, background:'rgba(224,82,82,0.1)', padding:'8px 12px', borderRadius:8 }}>{error}</div>}
            <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
              <button type="submit" disabled={saving} style={{ padding:'8px 20px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                {saving ? 'Guardando...' : 'Guardar vehículo'}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* Tabla */}
      <Panel>
        <PanelHeader title="Catálogo de flota">
          <div style={{ display:'flex', gap:6 }}>
            {['todos','operativo','taller','libre'].map(e => (
              <Chip key={e} active={filtroEstado === e} onClick={() => setFiltroEstado(e)}>
                {e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1)}
              </Chip>
            ))}
          </div>
        </PanelHeader>
        {loading ? <LoadingSpinner /> : vehiculos.length === 0 ? <EmptyState message="No hay vehículos registrados" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Código','Vehículo','Tipo','Placa','Año','KM / Horas','Combustible','Estado'].map(h => (
                  <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehiculos.map(v => (
                <tr key={v.id}
                  onMouseEnter={e => e.currentTarget.style.background='var(--panel2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  style={{ cursor:'pointer', transition:'background 0.15s' }}>
                  <td style={{ padding:'14px 20px', fontSize:13, borderBottom:'1px solid var(--border-soft)' }}>
                    <span style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>{v.codigo}</span>
                  </td>
                  <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{v.marca} {v.modelo}</div>
                  </td>
                  <td style={{ padding:'14px 20px', fontSize:12, color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', textTransform:'capitalize' }}>{v.tipo}</td>
                  <td style={{ padding:'14px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>{v.placa || '—'}</td>
                  <td style={{ padding:'14px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>{v.anio || '—'}</td>
                  <td style={{ padding:'14px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>
                    {v.tipo === 'excavadora' || v.tipo === 'buldocer' ? `${v.horas_operacion} h` : `${v.kilometraje_actual.toLocaleString()} km`}
                  </td>
                  <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:60, height:4, background:'var(--panel3)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:2, background: v.nivel_combustible < 25 ? 'var(--red)' : v.nivel_combustible < 50 ? 'var(--amber)' : 'var(--green)', width:`${v.nivel_combustible}%` }} />
                      </div>
                      <span style={{ fontSize:11, fontFamily:'Space Mono', color:'var(--text-2)' }}>{v.nivel_combustible}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                    <StatusPill status={v.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}

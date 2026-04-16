import { useEffect, useState } from 'react'
import { mantenimientoAPI, vehiculosAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, StatusPill, Chip, LoadingSpinner, EmptyState } from '../components/layout/UI'

export default function MantenimientoPage() {
  const [mantenimientos, setMantenimientos] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [alertas, setAlertas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ vehiculo_id:'', tipo:'preventivo', descripcion:'', fecha_programada:'', km_programado:'', taller:'', observaciones:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const cargar = () => {
    const params = {}
    if (filtro !== 'todos') params.estado = filtro
    Promise.all([
      mantenimientoAPI.list(params),
      vehiculosAPI.list(),
      mantenimientoAPI.alertas(),
    ]).then(([m, v, a]) => {
      setMantenimientos(m.data); setVehiculos(v.data); setAlertas(a.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filtro])

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await mantenimientoAPI.create({
        vehiculo_id: parseInt(form.vehiculo_id),
        tipo: form.tipo, descripcion: form.descripcion,
        fecha_programada: form.fecha_programada || null,
        km_programado: form.km_programado ? parseFloat(form.km_programado) : null,
        taller: form.taller || null,
        observaciones: form.observaciones || null,
      })
      setShowForm(false); cargar()
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const completar = async (id) => {
    await mantenimientoAPI.update(id, { estado:'completado', fecha_realizado: new Date().toISOString() })
    cargar()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <PageHeader title="Gestión de Mantenimiento" subtitle="Control preventivo y correctivo">
        <Btn variant="primary" onClick={() => setShowForm(!showForm)}>+ Registrar mantenimiento</Btn>
      </PageHeader>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Vencidos', value: alertas?.vencidos ?? '—', accent:'var(--red)' },
          { label:'Próximos 7 días', value: alertas?.proximos_7_dias ?? '—', accent:'var(--amber)' },
          { label:'Total registros', value: mantenimientos.length, accent:'var(--blue)' },
          { label:'Completados', value: mantenimientos.filter(m=>m.estado==='completado').length, accent:'var(--green)' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accent, opacity:0.7 }} />
            <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <Panel>
          <PanelHeader title="Registrar mantenimiento">
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
          </PanelHeader>
          <form onSubmit={handleSubmit} style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            <div>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
              <select value={form.vehiculo_id} onChange={e => setForm(p=>({...p,vehiculo_id:e.target.value}))} required
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                <option value="">Seleccionar...</option>
                {vehiculos.map(v => <option key={v.id} value={v.id}>{v.codigo} — {v.marca} {v.modelo}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Tipo *</label>
              <select value={form.tipo} onChange={e => setForm(p=>({...p,tipo:e.target.value}))}
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Fecha programada</label>
              <input type="datetime-local" value={form.fecha_programada} onChange={e => setForm(p=>({...p,fecha_programada:e.target.value}))}
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Descripción *</label>
              <input required placeholder="Ej: Cambio de aceite 5W30" value={form.descripcion} onChange={e => setForm(p=>({...p,descripcion:e.target.value}))}
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
            </div>
            {[
              { key:'km_programado', label:'KM programado', ph:'87500', type:'number' },
              { key:'taller', label:'Taller', ph:'Taller Central SOMILOR' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{f.label}</label>
                <input type={f.type||'text'} placeholder={f.ph} value={form[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
              </div>
            ))}
            {error && <div style={{ gridColumn:'1/-1', color:'var(--red)', fontSize:12, background:'rgba(224,82,82,0.1)', padding:'8px 12px', borderRadius:8 }}>{error}</div>}
            <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
              <button type="submit" disabled={saving} style={{ padding:'8px 20px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* Tabla */}
      <Panel>
        <PanelHeader title="Historial de mantenimientos">
          <div style={{ display:'flex', gap:6 }}>
            {['todos','programado','en_proceso','completado','vencido'].map(e => (
              <Chip key={e} active={filtro===e} onClick={() => setFiltro(e)}>
                {e === 'todos' ? 'Todos' : e.replace('_',' ')}
              </Chip>
            ))}
          </div>
        </PanelHeader>
        {loading ? <LoadingSpinner /> : mantenimientos.length === 0 ? <EmptyState message="Sin registros de mantenimiento" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Vehículo','Tipo','Descripción','F. Programada','KM Prog.','Estado','Acciones'].map(h => (
                  <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mantenimientos.map(m => (
                <tr key={m.id}
                  onMouseEnter={e => e.currentTarget.style.background='var(--panel2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  style={{ transition:'background 0.15s' }}>
                  <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                    <span style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>{m.vehiculo?.codigo ?? `V-${m.vehiculo_id}`}</span>
                  </td>
                  <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}><StatusPill status={m.tipo} /></td>
                  <td style={{ padding:'13px 20px', fontSize:13, borderBottom:'1px solid var(--border-soft)' }}>{m.descripcion}</td>
                  <td style={{ padding:'13px 20px', fontSize:11, fontFamily:'Space Mono', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)' }}>
                    {m.fecha_programada ? new Date(m.fecha_programada).toLocaleDateString('es-EC') : '—'}
                  </td>
                  <td style={{ padding:'13px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>
                    {m.km_programado ? `${m.km_programado.toLocaleString()} km` : '—'}
                  </td>
                  <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}><StatusPill status={m.estado} /></td>
                  <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                    {m.estado !== 'completado' && (
                      <button onClick={() => completar(m.id)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(61,200,122,0.1)', color:'var(--green)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }}>
                        Completar
                      </button>
                    )}
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

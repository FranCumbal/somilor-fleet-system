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
  const [editandoId, setEditandoId] = useState(null) // Nuevo estado para saber si estamos editando
  
  const estadoInicialForm = { tipo_vehiculo:'', vehiculo_id:'', tipo:'preventivo', descripcion:'', fecha_programada:'', km_programado:'', taller:'', observaciones:'' }
  const [form, setForm] = useState(estadoInicialForm)
  
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

  // Lógica principal de guardado (Crear o Actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        vehiculo_id: parseInt(form.vehiculo_id),
        tipo: form.tipo, descripcion: form.descripcion,
        fecha_programada: form.fecha_programada || null,
        km_programado: form.km_programado ? parseFloat(form.km_programado) : null,
        taller: form.taller || null,
        observaciones: form.observaciones || null,
      }
      
      if (editandoId) {
        await mantenimientoAPI.update(editandoId, payload)
      } else {
        await mantenimientoAPI.create(payload)
      }
      
      cerrarFormulario()
      cargar()
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar') }
    finally { setSaving(false) }
  }

  // Nueva función para preparar el formulario para edición
  const cargarDatosEdicion = (m) => {
    setEditandoId(m.id)
    setForm({
      tipo_vehiculo: m.vehiculo?.tipo || '',
      vehiculo_id: m.vehiculo_id,
      tipo: m.tipo,
      descripcion: m.descripcion,
      // Formatear la fecha para el input datetime-local si existe
      fecha_programada: m.fecha_programada ? new Date(m.fecha_programada).toISOString().slice(0, 16) : '',
      km_programado: m.km_programado || '',
      taller: m.taller || '',
      observaciones: m.observaciones || ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Nueva función para eliminar
  const eliminarMantenimiento = async (id, descripcion) => {
    if (window.confirm(`¿Seguro que deseas eliminar el mantenimiento: "${descripcion}"?`)) {
      try {
        await mantenimientoAPI.delete(id)
        cargar()
      } catch (err) {
        alert('Error al eliminar el registro')
      }
    }
  }

  const cerrarFormulario = () => {
    setShowForm(false)
    setEditandoId(null)
    setForm(estadoInicialForm)
    setError('')
  }

  const completar = async (id) => {
    await mantenimientoAPI.update(id, { estado:'completado', fecha_realizado: new Date().toISOString() })
    cargar()
  }

  const vehiculosFiltrados = form.tipo_vehiculo ? vehiculos.filter(v => v.tipo === form.tipo_vehiculo) : vehiculos;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <PageHeader title="Gestión de Mantenimiento" subtitle="Control preventivo y correctivo">
        <Btn variant="primary" onClick={() => { setEditandoId(null); setForm(estadoInicialForm); setShowForm(!showForm) }}>
          + Registrar mantenimiento
        </Btn>
      </PageHeader>

      {/* KPIs (Sin cambios) */}
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

      {/* Formulario (Actualizado con título dinámico) */}
      {showForm && (
        <Panel>
          <PanelHeader title={editandoId ? "Editar mantenimiento" : "Registrar mantenimiento"}>
            <Btn variant="ghost" onClick={cerrarFormulario}>Cancelar</Btn>
          </PanelHeader>
          <form onSubmit={handleSubmit} style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            <div>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Categoría de Vehículo</label>
              <select value={form.tipo_vehiculo} onChange={e => setForm(p=>({...p, tipo_vehiculo:e.target.value, vehiculo_id:''}))}
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                <option value="">Todas las categorías</option>
                <option value="liviano">Liviano</option>
                <option value="pesado">Pesado</option>
                <option value="maquinaria">Maquinaria</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
              <select value={form.vehiculo_id} onChange={e => setForm(p=>({...p,vehiculo_id:e.target.value}))} required disabled={form.tipo_vehiculo && vehiculosFiltrados.length === 0}
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', opacity: (form.tipo_vehiculo && vehiculosFiltrados.length === 0) ? 0.5 : 1 }}>
                <option value="">Seleccionar...</option>
                {vehiculosFiltrados.map(v => <option key={v.id} value={v.id}>{v.placa || v.codigo} — {v.marca} {v.modelo} ({v.color || 'Sin color'})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Tipo de Mantenimiento *</label>
              <select value={form.tipo} onChange={e => setForm(p=>({...p,tipo:e.target.value}))}
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Fecha de Mantenimiento</label>
              <input type="datetime-local" value={form.fecha_programada} onChange={e => setForm(p=>({...p,fecha_programada:e.target.value}))}
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
            </div>
            {[
              { key:'km_programado', label:'Kilometraje / Horas', ph:'87500', type:'number' },
              { key:'taller', label:'Taller', ph:'Taller Central SOMILOR' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{f.label}</label>
                <input type={f.type||'text'} placeholder={f.ph} value={form[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
              </div>
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Descripción *</label>
              <input required placeholder="Ej: Cambio de aceite 5W30" value={form.descripcion} onChange={e => setForm(p=>({...p,descripcion:e.target.value}))}
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
            </div>
            {error && <div style={{ gridColumn:'1/-1', color:'var(--red)', fontSize:12, background:'rgba(224,82,82,0.1)', padding:'8px 12px', borderRadius:8 }}>{error}</div>}
            <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <Btn variant="ghost" onClick={cerrarFormulario}>Cancelar</Btn>
              <button type="submit" disabled={saving} style={{ padding:'8px 20px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                {saving ? 'Guardando...' : (editandoId ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* Tabla (Actualizada con botones de acción) */}
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
                {['Placa/Vehículo','Tipo','Descripción','F. Programada','KM Prog.','Estado','Acciones'].map(h => (
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
                    <div style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>
                      {m.vehiculo?.placa || m.vehiculo?.codigo || `V-${m.vehiculo_id}`}
                    </div>
                    {m.vehiculo?.marca && <div style={{ fontSize:10, color:'var(--text-3)' }}>{m.vehiculo.marca} {m.vehiculo.modelo}</div>}
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
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      {m.estado !== 'completado' && (
                        <button onClick={() => completar(m.id)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(61,200,122,0.1)', color:'var(--green)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Marcar completado">
                          ✓
                        </button>
                      )}
                      {/* Botón Editar */}
                      <button onClick={() => cargarDatosEdicion(m)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">
                        ✏️
                      </button>
                      {/* Botón Eliminar */}
                      <button onClick={() => eliminarMantenimiento(m.id, m.descripcion)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">
                        🗑️
                      </button>
                    </div>
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
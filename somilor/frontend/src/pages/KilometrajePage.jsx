import { useEffect, useState } from 'react'
import { kilometrajeAPI, vehiculosAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState } from '../components/layout/UI'
import { useAuth } from '../hooks/useAuth'

// La fecha ya no es necesaria en el estado inicial
const estadoInicial = { vehiculo_id: '', kilometraje: '', observaciones: '' }

export default function KilometrajePage() {
  const [registros, setRegistros] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState({ ...estadoInicial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Extraemos al usuario para verificar su rol
  const { user } = useAuth()
  const isAdmin = user?.rol === 'admin'

  const cargar = () => {
    setLoading(true)
    Promise.all([
      kilometrajeAPI.list({ limit: 200 }),
      vehiculosAPI.list()
    ]).then(([r, v]) => {
      setRegistros(r.data)
      setVehiculos(v.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const vehiculoSeleccionado = vehiculos.find(v => v.id === parseInt(form.vehiculo_id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editandoId) {
        await kilometrajeAPI.update(editandoId, {
          kilometraje: parseFloat(form.kilometraje),
          observaciones: form.observaciones || null
        })
      } else {
        await kilometrajeAPI.create({
          vehiculo_id: parseInt(form.vehiculo_id),
          kilometraje: parseFloat(form.kilometraje),
          observaciones: form.observaciones || null
        })
      }
      setShowForm(false)
      setEditandoId(null)
      setForm({ ...estadoInicial })
      cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el kilometraje')
    } finally {
      setSaving(false)
    }
  }

  const cargarDatosEdicion = (r) => {
    setEditandoId(r.id)
    setForm({
      vehiculo_id: r.vehiculo_id,
      kilometraje: r.kilometraje,
      observaciones: r.observaciones || ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const eliminarRegistro = async (id) => {
    if (window.confirm('¿Eliminar definitivamente este registro de kilometraje?')) {
      try { 
        await kilometrajeAPI.delete(id); 
        cargar() 
      } catch { alert('Error al eliminar') }
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth:0, width:'100%' }}>
      <PageHeader title="Control de Kilometraje" subtitle="Registro diario y actualización de odómetro">
        <Btn variant={showForm ? 'ghost' : 'primary'} onClick={() => { setShowForm(!showForm); setEditandoId(null); setForm({...estadoInicial}); setError(''); }}>
          {showForm ? 'Volver a la lista' : '+ Registrar Kilometraje'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Panel>
            <PanelHeader title={editandoId ? "Editar Registro" : "Nuevo Registro de Odómetro"} />
            <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:16 }}>
              
              <div>
                <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
                <select value={form.vehiculo_id} onChange={e => setForm({ ...form, vehiculo_id: e.target.value })} required disabled={editandoId !== null}
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', opacity: editandoId ? 0.6 : 1 }}>
                  <option value="">Seleccione una unidad...</option>
                  {vehiculos.filter(v => v.tipo !== 'maquinaria').map(v => (
                    <option key={v.id} value={v.id}>{v.placa} — {v.marca}</option>
                  ))}
                </select>
                {vehiculoSeleccionado && !editandoId && (
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:6, fontFamily:'Space Mono' }}>
                    Kilometraje actual: <span style={{color:'var(--gold-light)'}}>{vehiculoSeleccionado.kilometraje_actual} km</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize:12, color:'var(--gold)', display:'block', marginBottom:6, fontWeight:700 }}>Lectura del Kilometraje *</label>
                <input type="number" min={!editandoId && vehiculoSeleccionado ? vehiculoSeleccionado.kilometraje_actual : "0"} step="0.1" 
                  value={form.kilometraje} onChange={e => setForm({ ...form, kilometraje: e.target.value })} required
                  placeholder="Ej: 45200.5"
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--gold-dim)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'Space Mono' }} />
              </div>

              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Observaciones (Opcional)</label>
                <input type="text" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} placeholder="Ej: Lectura tomada al finalizar el turno"
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
              </div>

            </div>
            {error && <div style={{ color:'var(--red)', fontSize:13, margin:'0 20px 20px', background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8 }}>{error}</div>}
            
            <div style={{ padding:'0 20px 20px', display:'flex', justifyContent:'flex-end', gap:12 }}>
              <button type="submit" disabled={saving} style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
                {saving ? 'Guardando...' : editandoId ? 'Actualizar Registro' : 'Guardar Kilometraje'}
              </button>
            </div>
          </Panel>
        </form>
      ) : (
        <Panel>
          <PanelHeader title="Historial de Actualizaciones" />
          {loading ? <LoadingSpinner /> : registros.length === 0 ? <EmptyState message="No hay registros de kilometraje" /> : (
            <div className="table-responsive-container" style={{ width:'100%', overflowX:'auto', paddingBottom:8 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'700px' }}>
                <thead>
                  <tr style={{ background:'var(--panel2)', borderBottom:'1px solid var(--border-soft)' }}>
                    <th style={{ padding:'12px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', color:'var(--text-3)' }}>Fecha y Hora</th>
                    <th style={{ padding:'12px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', color:'var(--text-3)' }}>Vehículo / Placa</th>
                    <th style={{ padding:'12px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', color:'var(--text-3)' }}>Kilometraje</th>
                    <th style={{ padding:'12px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', color:'var(--text-3)' }}>Observaciones</th>
                    {isAdmin && <th style={{ padding:'12px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', color:'var(--text-3)' }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--border-soft)', transition:'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--panel2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      
                      <td style={{ padding:'14px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-3)' }}>
                        {new Date(r.creado_en.includes('Z') ? r.creado_en : r.creado_en + 'Z').toLocaleString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      
                      <td style={{ padding:'14px 20px' }}>
                        <div style={{ color:'#fff', fontWeight:700, fontFamily:'Space Mono' }}>{r.vehiculo?.placa}</div>
                        <div style={{ fontSize:11, color:'var(--text-3)' }}>{r.vehiculo?.marca}</div>
                      </td>
                      
                      <td style={{ padding:'14px 20px', fontSize:14, fontFamily:'Space Mono', color:'var(--gold-light)', fontWeight:600 }}>
                        {r.kilometraje} km
                      </td>
                      
                      <td style={{ padding:'14px 20px', fontSize:12, color:'var(--text-2)' }}>
                        {r.observaciones || '—'}
                      </td>

                      {/* SEGURIDAD FRONTEND: Los botones solo se renderizan si el usuario es Admin */}
                      {isAdmin && (
                        <td style={{ padding:'14px 20px', whiteSpace:'nowrap' }}>
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => cargarDatosEdicion(r)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer' }}>✏️</button>
                            <button onClick={() => eliminarRegistro(r.id)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer' }}>🗑️</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}
import { useEffect, useState } from 'react'
import { kilometrajeAPI, vehiculosAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState, StatusPill } from '../components/layout/UI'
import { useAuth } from '../hooks/useAuth'

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
  const [detalleActivo, setDetalleActivo] = useState(null)
  const [busqueda, setBusqueda] = useState('') // NUEVO: Estado para el filtro
  
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

  // LÓGICA DE FILTRADO
  const vehiculosFiltrados = vehiculos.filter(v => {
    const q = busqueda.toLowerCase()
    return (
      (v.placa || '').toLowerCase().includes(q) ||
      (v.marca || '').toLowerCase().includes(q) ||
      (v.modelo || '').toLowerCase().includes(q) ||
      (v.estado || '').toLowerCase().includes(q)
    )
  })

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

  const abrirRegistroRapido = (v) => {
    setForm({ ...estadoInicial, vehiculo_id: v.id })
    setShowForm(true)
    setEditandoId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth:0, width:'100%' }}>
      <PageHeader title="Control de Kilometraje" subtitle="Inventario de flota y bitácora de uso">
        {!showForm && (
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="text" placeholder="Buscar unidad (placa, marca...)" value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'8px 14px', color:'var(--text-1)', fontSize:13, outline:'none', width:220, fontFamily:'DM Sans' }}
            />
            <Btn variant="primary" onClick={() => { setShowForm(true); setForm({...estadoInicial}); }}>
              + Registrar Km
            </Btn>
          </div>
        )}
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Panel>
            <PanelHeader title={editandoId ? "Editar Registro" : "Nuevo Registro de Odómetro"}>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Volver a la flota</Btn>
            </PanelHeader>
            <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:16 }}>
              <div>
                <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
                <select value={form.vehiculo_id} onChange={e => setForm({ ...form, vehiculo_id: e.target.value })} required disabled={editandoId !== null}
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', opacity: editandoId ? 0.6 : 1 }}>
                  <option value="">Seleccione una unidad...</option>
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>
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
                <input type="number" step="0.1" 
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
            <div style={{ padding:'0 20px 20px', display:'flex', justifyContent:'flex-end' }}>
              <button type="submit" disabled={saving} style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
                {saving ? 'Guardando...' : 'Guardar Kilometraje'}
              </button>
            </div>
          </Panel>
        </form>
      ) : (
        <Panel>
          <PanelHeader title="Inventario de Flota (Clic para historial)" />
          {loading ? <LoadingSpinner /> : (
            <div className="table-responsive-container">
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--panel2)' }}>
                    {['Placa', 'Vehículo', 'Uso Actual', 'Estado', 'Acción'].map(h => <th key={h} style={{ padding:14, textAlign:'left', fontSize:10, textTransform:'uppercase', color:'var(--text-3)' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {vehiculosFiltrados.map(v => (
                    <tr key={v.id} style={{ borderBottom:'1px solid var(--border-soft)', cursor:'pointer' }} 
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--panel2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => setDetalleActivo({ tipo: `Historial: ${v.placa}`, data: registros.filter(r => r.vehiculo_id === v.id) })}>
                      <td style={{ padding:14, fontWeight:700, color:'var(--gold-light)' }}>{v.placa}</td>
                      <td style={{ padding:14, fontSize:13 }}>{v.marca} {v.modelo}</td>
                      <td style={{ padding:14, fontFamily:'Space Mono', fontSize:13 }}>{v.kilometraje_actual.toLocaleString()} km</td>
                      <td style={{ padding:14 }}><StatusPill status={v.estado} /></td>
                      <td style={{ padding:14 }}>
                        <Btn variant="primary" style={{ padding:'4px 10px', fontSize:11 }} onClick={(e) => { e.stopPropagation(); abrirRegistroRapido(v) }}>+ Actualizar</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {detalleActivo && (
        <div onClick={() => setDetalleActivo(null)} style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(10,12,17,0.85)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, padding:'20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:500, background:'var(--panel)', borderRadius:16, padding:25, border:'1px solid var(--border-soft)' }}>
            <h3 style={{ marginBottom:15, color:'var(--gold-light)' }}>{detalleActivo.tipo}</h3>
            {detalleActivo.data.length === 0 ? <EmptyState message="Sin registros históricos" /> : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {detalleActivo.data.map(h => (
                  <div key={h.id} style={{ padding:12, background:'var(--panel2)', borderRadius:8, fontSize:13, display:'flex', justifyContent:'space-between' }}>
                     <span style={{ fontFamily:'Space Mono', color:'var(--text-3)' }}>{new Date(h.creado_en).toLocaleDateString('es-EC')}</span>
                     <strong style={{ color:'var(--gold)' }}>{h.kilometraje.toLocaleString()} km</strong>
                  </div>
                ))}
              </div>
            )}
            <Btn variant="ghost" style={{ marginTop:20, width:'100%' }} onClick={() => setDetalleActivo(null)}>Cerrar</Btn>
          </div>
        </div>
      )}
    </div>
  )
}
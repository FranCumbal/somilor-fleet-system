import { useEffect, useState } from 'react'
import { vehiculosAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, StatusPill, Btn, Chip, LoadingSpinner, EmptyState } from '../components/layout/UI'

const idUnico = () => Math.random().toString(36).substr(2, 9)
const estadoInicial = { codigo:'', marca:'', modelo:'', anio:'', placa:'', color:'', tipo:'liviano' }

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  
  // Ahora manejamos un arreglo de formularios en lugar de uno solo
  const [formularios, setFormularios] = useState([{ idRef: idUnico(), ...estadoInicial }])
  
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

  // Actualiza un campo específico de un formulario específico
  const updateField = (idRef, field, value) => {
    setFormularios(prev => prev.map(f => f.idRef === idRef ? { ...f, [field]: value } : f))
  }

  const agregarFormulario = () => {
    setFormularios(prev => [...prev, { idRef: idUnico(), ...estadoInicial }])
  }

  const removerFormulario = (idRef) => {
    setFormularios(prev => prev.filter(f => f.idRef !== idRef))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (editandoId) {
        const payload = { ...formularios[0], anio: parseInt(formularios[0].anio) || null }
        delete payload.idRef
        await vehiculosAPI.update(editandoId, payload)
      } else {
        // Modo Lote: Creamos un arreglo de promesas y las enviamos todas juntas
        const promesas = formularios.map(f => {
          const payload = { ...f, anio: parseInt(f.anio) || null }
          delete payload.idRef
          return vehiculosAPI.create(payload)
        })
        await Promise.all(promesas)
      }
      
      cerrarFormulario()
      cargar()
    } catch (err) {
      setError('Error al guardar. Revisa que no haya códigos o placas repetidas.')
    } finally { setSaving(false) }
  }

  const cargarDatosEdicion = (v) => {
    setEditandoId(v.id)
    setFormularios([{
      idRef: idUnico(),
      codigo: v.codigo || '',
      marca: v.marca || '',
      modelo: v.modelo || '',
      anio: v.anio || '',
      placa: v.placa || '',
      color: v.color || '',
      tipo: v.tipo || 'liviano'
    }])
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cerrarFormulario = () => {
    setShowForm(false)
    setEditandoId(null)
    setFormularios([{ idRef: idUnico(), ...estadoInicial }])
    setError('')
  }

  const eliminarVehiculo = async (id, codigo) => {
    if (window.confirm(`¿Estás seguro de eliminar el vehículo ${codigo}?`)) {
      try {
        await vehiculosAPI.delete(id)
        cargar()
      } catch (err) {
        alert('Error al eliminar el vehículo')
      }
    }
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
        <Btn variant={showForm ? "ghost" : "primary"} onClick={() => { cerrarFormulario(); setShowForm(!showForm); }}>
          {showForm ? 'Volver al catálogo' : '+ Nuevo vehículo'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Renderizamos todos los formularios activos */}
          {formularios.map((f, index) => (
            <Panel key={f.idRef}>
              <PanelHeader title={editandoId ? "Editar vehículo" : `Vehículo #${index + 1}`}>
                {!editandoId && formularios.length > 1 && (
                  <button type="button" onClick={() => removerFormulario(f.idRef)} style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                    🗑️ Quitar
                  </button>
                )}
              </PanelHeader>
              <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                {[
                  { key:'codigo', label:'Código *', ph:'VH-001' },
                  { key:'marca', label:'Marca', ph:'Toyota' },
                  { key:'modelo', label:'Modelo', ph:'Hilux 4x4' },
                  { key:'anio', label:'Año', ph:'2022', type:'number' },
                  { key:'placa', label:'Placa', ph:'PCV-1234' },
                  { key:'color', label:'Color', ph:'Blanco' },
                ].map(campo => (
                  <div key={campo.key}>
                    <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{campo.label}</label>
                    <input
                      type={campo.type || 'text'} placeholder={campo.ph} value={f[campo.key]}
                      onChange={e => updateField(f.idRef, campo.key, e.target.value)}
                      required={campo.label.includes('*')}
                      style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Tipo *</label>
                  <select value={f.tipo} onChange={e => updateField(f.idRef, 'tipo', e.target.value)}
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}>
                    {['liviano','pesado','maquinaria'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </Panel>
          ))}

          {/* Botón Fantasma para agregar otro (Solo visible al crear) */}
          {!editandoId && (
            <div 
              onClick={agregarFormulario}
              style={{ 
                border:'2px dashed var(--border)', borderRadius:12, padding:'20px', 
                textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', 
                fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)',
                transition:'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}
            >
              ➕ Agregar otro vehículo a la lista
            </div>
          )}

          {/* Acciones globales */}
          {error && <div style={{ color:'var(--red)', fontSize:13, background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8, fontWeight:500 }}>{error}</div>}
          
          <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving} style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
              {saving ? 'Guardando...' : (editandoId ? 'Actualizar vehículo' : `Guardar ${formularios.length} vehículo(s)`)}
            </button>
          </div>
        </form>
      ) : (
        <>
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

          <Panel>
            <PanelHeader title="Catálogo de flota">
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:600, letterSpacing:'0.05em' }}>TIPO:</span>
                  {['todos','liviano','pesado','maquinaria'].map(t => (
                    <Chip key={t} active={filtroTipo === t} onClick={() => setFiltroTipo(t)}>
                      {t === 'todos' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </Chip>
                  ))}
                </div>
                <div style={{ width:1, height:18, background:'var(--border-soft)' }} />
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:600, letterSpacing:'0.05em' }}>ESTADO:</span>
                  {['todos','operativo','taller','libre'].map(e => (
                    <Chip key={e} active={filtroEstado === e} onClick={() => setFiltroEstado(e)}>
                      {e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1)}
                    </Chip>
                  ))}
                </div>
              </div>
            </PanelHeader>
            {loading ? <LoadingSpinner /> : vehiculos.length === 0 ? <EmptyState message="No hay vehículos registrados" /> : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Placa','Vehículo','Color','Tipo','Año','KM / Horas','Combustible','Estado','Acciones'].map(h => (
                      <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map(v => (
                    <tr key={v.id} onMouseEnter={e => e.currentTarget.style.background='var(--panel2)'} onMouseLeave={e => e.currentTarget.style.background='transparent'} style={{ cursor:'pointer', transition:'background 0.15s' }}>
                      <td style={{ padding:'14px 20px', fontSize:13, borderBottom:'1px solid var(--border-soft)' }}>
                        <span style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>{v.placa || 'S/P'}</span>
                      </td>
                      <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                        <div style={{ fontSize:13, fontWeight:500 }}>{v.marca} {v.modelo}</div>
                        <div style={{ fontSize:10, color:'var(--text-3)' }}>{v.codigo}</div>
                      </td>
                      <td style={{ padding:'14px 20px', fontSize:12, color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>{v.color || '—'}</td>
                      <td style={{ padding:'14px 20px', fontSize:12, color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', textTransform:'capitalize' }}>{v.tipo}</td>
                      <td style={{ padding:'14px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>{v.anio || '—'}</td>
                      <td style={{ padding:'14px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>
                        {v.tipo === 'maquinaria' ? `${v.horas_operacion} h` : `${v.kilometraje_actual.toLocaleString()} km`}
                      </td>
                      <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:60, height:4, background:'var(--panel3)', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:2, background: v.nivel_combustible < 25 ? 'var(--red)' : v.nivel_combustible < 50 ? 'var(--amber)' : 'var(--green)', width:`${v.nivel_combustible}%` }} />
                          </div>
                          <span style={{ fontSize:11, fontFamily:'Space Mono', color:'var(--text-2)' }}>{v.nivel_combustible}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)' }}><StatusPill status={v.estado} /></td>
                      <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => cargarDatosEdicion(v)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">✏️</button>
                          <button onClick={(e) => { e.stopPropagation(); eliminarVehiculo(v.id, v.codigo); }} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}
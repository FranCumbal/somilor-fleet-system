import { useEffect, useState } from 'react'
import { vehiculosAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, StatusPill, Btn, Chip, LoadingSpinner, EmptyState } from '../components/layout/UI'

const idUnico = () => Math.random().toString(36).substr(2, 9)
const estadoInicial = { placa:'', marca:'', modelo:'', anio:'', color:'', tipo:'liviano' }

const preventInvalidChars = (e) => {
  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
    e.preventDefault()
  }
}

const COLORES_AUTOS = [
  'Blanco', 'Negro', 'Plateado', 'Gris', 'Rojo',
  'Azul', 'Verde', 'Amarillo', 'Naranja', 'Beige', 'Otro'
]

export default function VehiculosPage() {
  const [vehiculos, setVehiculos]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [showForm, setShowForm]     = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formularios, setFormularios] = useState([{ idRef: idUnico(), ...estadoInicial }])
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [detalleActivo, setDetalleActivo] = useState(null)
  const [busqueda, setBusqueda]     = useState('')
  const [pagina, setPagina]         = useState(1)
  const POR_PAGINA                  = 15

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
  useEffect(() => { setPagina(1) }, [filtroTipo, filtroEstado, busqueda])

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
        const promesas = formularios.map(f => {
          const payload = { ...f, anio: parseInt(f.anio) || null }
          delete payload.idRef
          return vehiculosAPI.create(payload)
        })
        await Promise.all(promesas)
      }
      cerrarFormulario()
      cargar()
    } catch {
      setError('Error al guardar. Revisa que no haya placas repetidas.')
    } finally { setSaving(false) }
  }

  const cargarDatosEdicion = (v) => {
    setEditandoId(v.id)
    setFormularios([{
      idRef:  idUnico(),
      placa:  v.placa  || '',
      marca:  v.marca  || '',
      modelo: v.modelo || '',
      anio:   v.anio   || '',
      color:  v.color  || '',
      tipo:   v.tipo   || 'liviano'
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

  const eliminarVehiculo = async (id, placa) => {
    if (window.confirm(`¿Estás seguro de eliminar el vehículo con placa ${placa}?`)) {
      try {
        await vehiculosAPI.delete(id)
        cargar()
      } catch {
        alert('Error al eliminar el vehículo')
      }
    }
  }

  const vehiculosFiltrados = vehiculos.filter(v => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      (v.placa  || '').toLowerCase().includes(q) ||
      (v.marca  || '').toLowerCase().includes(q) ||
      (v.modelo || '').toLowerCase().includes(q) ||
      (v.color  || '').toLowerCase().includes(q) ||
      (v.tipo   || '').toLowerCase().includes(q) ||
      (v.estado || '').toLowerCase().includes(q) ||
      (v.anio?.toString() || '').includes(q)
    )
  })

  const totalPaginas    = Math.max(1, Math.ceil(vehiculosFiltrados.length / POR_PAGINA))
  const vehiculosPagina = vehiculosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const stats = {
    total:      vehiculos.length,
    operativos: vehiculos.filter(v => v.estado === 'operativo').length,
    taller:     vehiculos.filter(v => v.estado === 'taller').length,
    libres:     vehiculos.filter(v => v.estado === 'libre').length,
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth:0, width:'100%' }}>
      <PageHeader title="Gestión de Flota" subtitle={`${stats.total} vehículos registrados`}>
        <Btn variant={showForm ? 'ghost' : 'primary'} onClick={() => { cerrarFormulario(); setShowForm(!showForm) }}>
          {showForm ? 'Volver al catálogo' : '+ Nuevo vehículo'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {formularios.map((f, index) => (
            <Panel key={f.idRef}>
              <PanelHeader title={editandoId ? 'Editar vehículo' : `Vehículo #${index + 1}`}>
                {!editandoId && formularios.length > 1 && (
                  <button type="button" onClick={() => removerFormulario(f.idRef)}
                    style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                    🗑️ Quitar
                  </button>
                )}
              </PanelHeader>
              <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
                {[
                  { key:'placa',  label:'Placa del Vehículo *', ph:'Ej: PCV-1234' },
                  { key:'marca',  label:'Marca',                ph:'Ej: Toyota' },
                  { key:'modelo', label:'Modelo',               ph:'Ej: Hilux 4x4' },
                  { key:'anio',   label:'Año de Fabricación',   ph:'Ej: 2022', type:'number', min:1950 },
                  { key:'color',  label:'Color del Vehículo',   type:'select', options:COLORES_AUTOS },
                ].map(campo => (
                  <div key={campo.key}>
                    <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{campo.label}</label>
                    {campo.type === 'select' ? (
                      <select
                        value={f[campo.key]}
                        onChange={e => updateField(f.idRef, campo.key, e.target.value)}
                        required={campo.label.includes('*')}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}>
                        <option value="">Seleccionar color...</option>
                        {campo.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={campo.type || 'text'}
                        placeholder={campo.ph}
                        value={f[campo.key]}
                        onChange={e => updateField(f.idRef, campo.key, e.target.value)}
                        required={campo.label.includes('*')}
                        onKeyDown={campo.type === 'number' ? preventInvalidChars : undefined}
                        min={campo.min}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}
                      />
                    )}
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Tipo de Unidad *</label>
                  <select value={f.tipo} onChange={e => updateField(f.idRef, 'tipo', e.target.value)}
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}>
                    <option value="liviano">Liviano</option>
                    <option value="pesado">Pesado</option>
                    <option value="maquinaria">Maquinaria / Equipo</option>
                  </select>
                </div>
              </div>
            </Panel>
          ))}

          {!editandoId && (
            <div onClick={agregarFormulario}
              style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)', transition:'all 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
              ➕ Agregar otro vehículo a la lista
            </div>
          )}

          {error && (
            <div style={{ color:'var(--red)', fontSize:13, background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8, fontWeight:500 }}>
              {error}
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving}
              style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
              {saving ? 'Guardando...' : editandoId ? 'Actualizar vehículo' : `Guardar ${formularios.length} vehículo(s)`}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Total',      value:stats.total,      accent:'var(--gold)',  data:vehiculos },
              { label:'Operativos', value:stats.operativos, accent:'var(--green)', data:vehiculos.filter(v => v.estado === 'operativo') },
              { label:'En taller',  value:stats.taller,     accent:'var(--red)',   data:vehiculos.filter(v => v.estado === 'taller') },
              { label:'Libres',     value:stats.libres,     accent:'var(--amber)', data:vehiculos.filter(v => v.estado === 'libre') },
            ].map(k => (
              <div key={k.label}
                onClick={() => setDetalleActivo({ tipo:`Unidades: ${k.label}`, data:k.data })}
                style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden', cursor:'pointer', transition:'transform 0.2s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accent, opacity:0.7 }} />
                <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.label}</div>
                <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono' }}>{k.value}</div>
              </div>
            ))}
          </div>

          <Panel style={{ maxWidth:'100%', overflow:'hidden' }}>
            <PanelHeader title="Catálogo de flota">
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:16 }}>
                <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:600, letterSpacing:'0.05em' }}>TIPO:</span>
                  {['todos','liviano','pesado','maquinaria'].map(t => (
                    <Chip key={t} active={filtroTipo === t} onClick={() => setFiltroTipo(t)}>
                      {t === 'todos' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </Chip>
                  ))}
                </div>
                <div style={{ width:1, height:18, background:'var(--border-soft)' }} />
                <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10, color:'var(--text-3)', fontWeight:600, letterSpacing:'0.05em' }}>ESTADO:</span>
                  {['todos','operativo','taller','libre'].map(e => (
                    <Chip key={e} active={filtroEstado === e} onClick={() => setFiltroEstado(e)}>
                      {e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1)}
                    </Chip>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  style={{ background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'5px 12px', color:'var(--text-1)', fontSize:12, outline:'none', width:160, fontFamily:'DM Sans' }}
                />
              </div>
            </PanelHeader>

            {loading ? <LoadingSpinner /> : vehiculosFiltrados.length === 0 ? <EmptyState message="No hay vehículos registrados" /> : (
              <>
                <div style={{ width:'100%', maxWidth:'100%', overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'8px' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'900px' }}>
                    <thead>
                      <tr>
                        {['Placa','Marca / Modelo','Color','Tipo','Año','Uso','Estado','Acciones'].map(h => (
                          <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vehiculosPagina.map(v => (
                        <tr key={v.id}
                          onClick={() => setDetalleActivo({ tipo:'Ficha Técnica', data:v })}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--panel2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ cursor:'pointer', transition:'background 0.15s' }}>
                          <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            <span style={{ fontFamily:'Space Mono', fontSize:14, color:'var(--gold-light)', fontWeight:700 }}>{v.placa}</span>
                          </td>
                          <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            <div style={{ fontSize:13, fontWeight:500 }}>{v.marca || '—'}</div>
                            <div style={{ fontSize:10, color:'var(--text-3)' }}>{v.modelo || '—'}</div>
                          </td>
                          <td style={{ padding:'14px 20px', fontSize:12, color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>{v.color || '—'}</td>
                          <td style={{ padding:'14px 20px', fontSize:12, color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', textTransform:'capitalize', whiteSpace:'nowrap' }}>{v.tipo}</td>
                          <td style={{ padding:'14px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>{v.anio || '—'}</td>
                          <td style={{ padding:'14px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            {v.tipo === 'maquinaria' ? `${v.horas_operacion} h` : `${v.kilometraje_actual.toLocaleString()} km`}
                          </td>
                          <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            {v.estado === 'operativo' && (
                              <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, padding:'5px 14px', borderRadius:20, fontWeight:700, color:'#fff', background:'var(--green)', boxShadow:'0 0 10px rgba(61,200,122,0.4)' }}>
                                <span style={{ width:6, height:6, borderRadius:'50%', background:'#fff', display:'inline-block' }} />
                                Operativo
                              </span>
                            )}
                            {v.estado === 'taller' && (
                              <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, padding:'5px 14px', borderRadius:20, fontWeight:700, color:'#fff', background:'var(--red)', boxShadow:'0 0 10px rgba(224,82,82,0.4)' }}>
                                <span style={{ width:6, height:6, borderRadius:'50%', background:'#fff', display:'inline-block' }} />
                                En taller
                              </span>
                            )}
                            {v.estado === 'libre' && (
                              <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, padding:'5px 14px', borderRadius:20, fontWeight:700, color:'#0E1117', background:'var(--amber)', boxShadow:'0 0 10px rgba(240,167,66,0.4)' }}>
                                <span style={{ width:6, height:6, borderRadius:'50%', background:'#0E1117', display:'inline-block' }} />
                                Libre
                              </span>
                            )}
                          </td>
                          <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex', gap:8 }}>
                              <button onClick={e => { e.stopPropagation(); cargarDatosEdicion(v) }}
                                style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">✏️</button>
                              <button onClick={e => { e.stopPropagation(); eliminarVehiculo(v.id, v.placa) }}
                                style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPaginas > 1 && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid var(--border-soft)' }}>
                    <span style={{ fontSize:12, color:'var(--text-3)' }}>
                      Página {pagina} de {totalPaginas} · {vehiculosFiltrados.length} vehículos
                    </span>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setPagina(1)} disabled={pagina === 1}
                        style={{ fontSize:12, padding:'5px 10px', borderRadius:6, background:'var(--panel2)', border:'1px solid var(--border-soft)', color:pagina === 1 ? 'var(--text-3)' : 'var(--text-1)', cursor:pagina === 1 ? 'default' : 'pointer' }}>«</button>
                      <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                        style={{ fontSize:12, padding:'5px 10px', borderRadius:6, background:'var(--panel2)', border:'1px solid var(--border-soft)', color:pagina === 1 ? 'var(--text-3)' : 'var(--text-1)', cursor:pagina === 1 ? 'default' : 'pointer' }}>‹</button>
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                        .filter(n => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1)
                        .reduce((acc, n, idx, arr) => {
                          if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...')
                          acc.push(n)
                          return acc
                        }, [])
                        .map((item, idx) =>
                          item === '...'
                            ? <span key={`e${idx}`} style={{ fontSize:12, padding:'5px 4px', color:'var(--text-3)' }}>…</span>
                            : <button key={item} onClick={() => setPagina(item)}
                                style={{ fontSize:12, padding:'5px 10px', borderRadius:6, border:'1px solid var(--border-soft)', cursor:'pointer', background:pagina === item ? 'var(--gold)' : 'var(--panel2)', color:pagina === item ? '#0E1117' : 'var(--text-1)', fontWeight:pagina === item ? 700 : 400 }}>
                                {item}
                              </button>
                        )
                      }
                      <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                        style={{ fontSize:12, padding:'5px 10px', borderRadius:6, background:'var(--panel2)', border:'1px solid var(--border-soft)', color:pagina === totalPaginas ? 'var(--text-3)' : 'var(--text-1)', cursor:pagina === totalPaginas ? 'default' : 'pointer' }}>›</button>
                      <button onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas}
                        style={{ fontSize:12, padding:'5px 10px', borderRadius:6, background:'var(--panel2)', border:'1px solid var(--border-soft)', color:pagina === totalPaginas ? 'var(--text-3)' : 'var(--text-1)', cursor:pagina === totalPaginas ? 'default' : 'pointer' }}>»</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Panel>
        </>
      )}

      {detalleActivo && (
        <div onClick={() => setDetalleActivo(null)}
          style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(10,12,17,0.85)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, animation:'fadeInModal 0.2s ease-out', padding:'20px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:'100%', maxWidth:Array.isArray(detalleActivo.data) ? '700px' : '500px', background:'var(--panel)', borderRadius:16, padding:'30px', border:'1px solid var(--border-soft)', boxShadow:'0 20px 50px rgba(0,0,0,0.5)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:15, borderBottom:'1px solid var(--border-soft)' }}>
              <h2 style={{ margin:0, color:'var(--gold-light)', fontSize:18 }}>{detalleActivo.tipo}</h2>
              <button onClick={() => setDetalleActivo(null)} style={{ background:'transparent', border:'none', color:'var(--text-3)', fontSize:24, cursor:'pointer' }}>×</button>
            </div>

            <div style={{ color:'var(--text-2)' }}>
              {Array.isArray(detalleActivo.data) && (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', minWidth:'450px', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ textAlign:'left', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)' }}>
                        <th style={{ padding:'10px' }}>Unidad</th>
                        <th style={{ padding:'10px' }}>Tipo</th>
                        <th style={{ padding:'10px' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleActivo.data.length === 0
                        ? <tr><td colSpan="3" style={{ padding:20, textAlign:'center' }}>No hay unidades en esta categoría</td></tr>
                        : detalleActivo.data.map((v, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid var(--border-soft)' }}>
                            <td style={{ padding:'12px 10px' }}>
                              <div style={{ color:'#fff', fontWeight:600, fontFamily:'Space Mono' }}>{v.placa}</div>
                              <div style={{ fontSize:11, color:'var(--text-3)' }}>{v.marca} {v.modelo}</div>
                            </td>
                            <td style={{ padding:'12px 10px', textTransform:'capitalize' }}>{v.tipo}</td>
                            <td style={{ padding:'12px 10px' }}><StatusPill status={v.estado} /></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}

              {!Array.isArray(detalleActivo.data) && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                    <div>
                      <div style={{ fontSize:24, fontWeight:'bold', color:'#fff', fontFamily:'Space Mono' }}>{detalleActivo.data.placa}</div>
                      <div style={{ fontSize:14, color:'var(--gold-light)' }}>{detalleActivo.data.marca} {detalleActivo.data.modelo} ({detalleActivo.data.anio || 'N/A'})</div>
                    </div>
                    <StatusPill status={detalleActivo.data.estado} />
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:15, marginBottom:20 }}>
                    <div style={{ background:'var(--panel2)', padding:'15px', borderRadius:8, border:'1px solid var(--border-soft)' }}>
                      <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Uso registrado</div>
                      <div style={{ fontSize:16, fontWeight:600, color:'#fff', marginTop:5, fontFamily:'Space Mono' }}>
                        {detalleActivo.data.tipo === 'maquinaria'
                          ? `${detalleActivo.data.horas_operacion} h`
                          : `${detalleActivo.data.kilometraje_actual.toLocaleString()} km`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:15, fontSize:13, color:'var(--text-2)', padding:'15px', background:'var(--panel2)', borderRadius:8 }}>
                    <div><strong style={{ color:'#fff' }}>Tipo:</strong> <span style={{ textTransform:'capitalize' }}>{detalleActivo.data.tipo}</span></div>
                    <div><strong style={{ color:'#fff' }}>Color:</strong> {detalleActivo.data.color || 'No especificado'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInModal { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { asignacionesAPI, vehiculosAPI, choferesAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, StatusPill, LoadingSpinner, EmptyState } from '../components/layout/UI'

const idUnico = () => Math.random().toString(36).substr(2, 9)
const estadoInicial = { vehiculo_id:'', chofer_id:'', observaciones:'' }

export default function AsignacionesPage() {
  const [asignaciones, setAsignaciones] = useState([])
  const [vehiculos, setVehiculos]       = useState([])
  const [choferes, setChoferes]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [formularios, setFormularios]   = useState([{ idRef: idUnico(), ...estadoInicial }])
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [detalleActivo, setDetalleActivo] = useState(null)
  const [busqueda, setBusqueda]         = useState('')
  const [pagina, setPagina]             = useState(1)
  const POR_PAGINA                      = 15

  const cargar = () => {
    setLoading(true)
    Promise.all([
      asignacionesAPI.list({ limit: 500 }),
      vehiculosAPI.list(),
      choferesAPI.list()
    ]).then(([a, v, c]) => {
      setAsignaciones(a.data)
      setVehiculos(v.data)
      setChoferes(c.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])
  useEffect(() => { setPagina(1) }, [busqueda])

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
      const promesas = formularios.map(f => asignacionesAPI.create({
        vehiculo_id:   parseInt(f.vehiculo_id),
        chofer_id:     parseInt(f.chofer_id),
        observaciones: f.observaciones || null
      }))
      await Promise.all(promesas)
      cerrarFormulario()
      cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar la asignación.')
    } finally { setSaving(false) }
  }

  const confirmarRecepcion = async (id) => {
    setSaving(true)
    try {
      await asignacionesAPI.terminar(id)
      setDetalleActivo(null)
      cargar()
    } catch {
      alert('Error al cerrar la asignación')
    } finally { setSaving(false) }
  }

  const cerrarFormulario = () => {
    setShowForm(false)
    setFormularios([{ idRef: idUnico(), ...estadoInicial }])
    setError('')
  }

  const asignacionesFiltradas = asignaciones.filter(a => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      (a.vehiculo?.placa  || '').toLowerCase().includes(q) ||
      (a.vehiculo?.marca  || '').toLowerCase().includes(q) ||
      (a.vehiculo?.modelo || '').toLowerCase().includes(q) ||
      (a.chofer?.nombre   || '').toLowerCase().includes(q) ||
      (a.chofer?.apellido || '').toLowerCase().includes(q) ||
      (a.observaciones    || '').toLowerCase().includes(q)
    )
  })

  const totalPaginas       = Math.max(1, Math.ceil(asignacionesFiltradas.length / POR_PAGINA))
  const asignacionesPagina = asignacionesFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const asignacionesActivas = asignaciones.filter(a => a.activa)

  const stats = {
    activas:  asignacionesActivas.length,
    libres:   vehiculos.filter(v => v.estado === 'libre').length,
    taller:   vehiculos.filter(v => v.estado === 'taller').length,
    historico: asignaciones.length
  }

  const vehiculosAsignables = vehiculos.filter(v => v.estado === 'libre')

  const Paginacion = () => (
    totalPaginas > 1 ? (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid var(--border-soft)' }}>
        <span style={{ fontSize:12, color:'var(--text-3)' }}>
          Página {pagina} de {totalPaginas} · {asignacionesFiltradas.length} registros
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
    ) : null
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth:0, width:'100%', position:'relative' }}>
      <PageHeader title="Despacho y Asignaciones" subtitle="Gestión de llaves y control en ruta">
        <Btn variant={showForm ? 'ghost' : 'primary'} onClick={() => { cerrarFormulario(); setShowForm(!showForm) }}>
          {showForm ? 'Volver al panel' : '+ Asignar Llaves'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {formularios.map((f, index) => (
            <Panel key={f.idRef}>
              <PanelHeader title={`Despacho #${index + 1}`}>
                {formularios.length > 1 && (
                  <button type="button" onClick={() => removerFormulario(f.idRef)}
                    style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                    🗑️ Quitar
                  </button>
                )}
              </PanelHeader>
              <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16 }}>
                <div>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo Libre (Listo en patio) *</label>
                  <select value={f.vehiculo_id} onChange={e => updateField(f.idRef, 'vehiculo_id', e.target.value)} required
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}>
                    <option value="">Seleccionar unidad...</option>
                    {vehiculosAsignables.map(v => (
                      <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>
                    ))}
                  </select>
                  {vehiculosAsignables.length === 0 && (
                    <span style={{ fontSize:11, color:'var(--amber)', marginTop:4, display:'block' }}>No hay vehículos libres en este momento.</span>
                  )}
                </div>
                <div>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Chofer Asignado *</label>
                  <select value={f.chofer_id} onChange={e => updateField(f.idRef, 'chofer_id', e.target.value)} required
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}>
                    <option value="">Seleccionar chofer...</option>
                    {choferes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} {c.apellido} (CI: {c.cedula})</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Observaciones de Entrega</label>
                  <textarea placeholder="Ej: Se entregan las llaves y documentos completos..." value={f.observaciones}
                    onChange={e => updateField(f.idRef, 'observaciones', e.target.value)} rows={2}
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', resize:'vertical', fontFamily:'DM Sans' }} />
                </div>
              </div>
            </Panel>
          ))}

          <div onClick={agregarFormulario}
            style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)', transition:'all 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
            ➕ Agregar otra asignación
          </div>

          {error && (
            <div style={{ color:'var(--red)', fontSize:13, background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8, fontWeight:500 }}>
              {error}
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving || vehiculosAsignables.length === 0}
              style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, opacity:vehiculosAsignables.length === 0 ? 0.5 : 1 }}>
              {saving ? 'Despachando...' : `Confirmar Salida (${formularios.length})`}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Rutas Activas',               value:stats.activas,  accent:'var(--green)', data:asignacionesActivas },
              { label:'Vehículos en Patio (Libres)', value:stats.libres,   accent:'var(--blue)',  data:vehiculos.filter(v => v.estado === 'libre') },
              { label:'Vehículos Retenidos (Taller)',value:stats.taller,   accent:'var(--red)',   data:vehiculos.filter(v => v.estado === 'taller') },
              { label:'Histórico Asignaciones',      value:stats.historico,accent:'var(--amber)', data:asignaciones },
            ].map(k => (
              <div key={k.label}
                onClick={() => setDetalleActivo({ tipo:k.label, data:k.data, isVehiculos:k.label.includes('Vehículos') })}
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
            <PanelHeader title="Registro de Entregas y Recepciones">
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'5px 12px', color:'var(--text-1)', fontSize:12, outline:'none', width:160, fontFamily:'DM Sans' }}
              />
            </PanelHeader>

            {loading ? (
              <LoadingSpinner />
            ) : asignacionesFiltradas.length === 0 ? (
              <EmptyState message="No hay asignaciones registradas" />
            ) : (
              <>
                <div style={{ width:'100%', maxWidth:'100%', overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'8px' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'950px' }}>
                    <thead>
                      <tr>
                        {['Estado','Salida','Retorno','Unidad Asignada','Chofer','Observaciones','Acción'].map(h => (
                          <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {asignacionesPagina.map(a => (
                        <tr key={a.id}
                          onClick={() => setDetalleActivo({ tipo:'Detalle de Asignación', data:a, isVehiculos:false })}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--panel2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ cursor:'pointer', transition:'background 0.15s' }}>
                          <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            {a.activa
                              ? <span style={{ fontSize:11, color:'var(--green)', background:'rgba(61,200,122,0.1)', padding:'4px 8px', borderRadius:8, fontWeight:600 }}>🟢 En Ruta</span>
                              : <span style={{ fontSize:11, color:'var(--text-3)', background:'rgba(255,255,255,0.05)', padding:'4px 8px', borderRadius:8, fontWeight:600 }}>Cerrada</span>
                            }
                          </td>
                          <td style={{ padding:'14px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-1)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            {new Date(a.fecha_inicio).toLocaleString('es-EC')}
                          </td>
                          <td style={{ padding:'14px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            {a.fecha_fin ? new Date(a.fecha_fin).toLocaleString('es-EC') : '—'}
                          </td>
                          <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            <span style={{ fontFamily:'Space Mono', fontSize:14, color:'var(--gold-light)', fontWeight:700 }}>{a.vehiculo?.placa}</span>
                            <div style={{ fontSize:10, color:'var(--text-3)' }}>{a.vehiculo?.marca} {a.vehiculo?.modelo}</div>
                          </td>
                          <td style={{ padding:'14px 20px', fontSize:13, fontWeight:500, color:'var(--text-1)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            {a.chofer?.nombre} {a.chofer?.apellido}
                          </td>
                          <td style={{ padding:'14px 20px', fontSize:12, color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={a.observaciones}>
                            {a.observaciones || '—'}
                          </td>
                          <td style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            {a.activa ? (
                              <button
                                onClick={e => { e.stopPropagation(); setDetalleActivo({ tipo:'Recepción de Vehículo', data:a, isRecepcion:true }) }}
                                style={{ fontSize:12, padding:'6px 12px', borderRadius:6, background:'rgba(240,167,66,0.1)', color:'var(--amber)', border:'none', cursor:'pointer', fontFamily:'DM Sans', fontWeight:600 }}>
                                📥 Recibir
                              </button>
                            ) : (
                              <span style={{ fontSize:12, color:'var(--text-3)' }}>Finalizada</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Paginacion />
              </>
            )}
          </Panel>
        </>
      )}

      {detalleActivo && (
        <div onClick={() => setDetalleActivo(null)}
          style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(10,12,17,0.85)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, animation:'fadeInModal 0.2s ease-out', padding:'20px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:'100%', maxWidth:Array.isArray(detalleActivo.data) ? '800px' : '500px', background:'var(--panel)', borderRadius:16, padding:'30px', border:'1px solid var(--border-soft)', boxShadow:'0 20px 50px rgba(0,0,0,0.5)', maxHeight:'90vh', overflowY:'auto' }}>

            {!detalleActivo.isRecepcion && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:15, borderBottom:'1px solid var(--border-soft)' }}>
                <h2 style={{ margin:0, color:'var(--gold-light)', fontSize:18 }}>{detalleActivo.tipo}</h2>
                <button onClick={() => setDetalleActivo(null)} style={{ background:'transparent', border:'none', color:'var(--text-3)', fontSize:24, cursor:'pointer' }}>×</button>
              </div>
            )}

            <div style={{ color:'var(--text-2)' }}>
              {Array.isArray(detalleActivo.data) && detalleActivo.isVehiculos && (
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
                        ? <tr><td colSpan="3" style={{ padding:20, textAlign:'center' }}>No hay datos</td></tr>
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

              {Array.isArray(detalleActivo.data) && !detalleActivo.isVehiculos && (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', minWidth:'700px', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ textAlign:'left', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)' }}>
                        <th style={{ padding:'10px' }}>Unidad / Chofer</th>
                        <th style={{ padding:'10px' }}>Salida</th>
                        <th style={{ padding:'10px' }}>Observaciones</th>
                        <th style={{ padding:'10px' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleActivo.data.length === 0
                        ? <tr><td colSpan="4" style={{ padding:20, textAlign:'center' }}>No hay datos</td></tr>
                        : detalleActivo.data.map((a, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid var(--border-soft)' }}>
                            <td style={{ padding:'12px 10px' }}>
                              <div style={{ color:'#fff', fontWeight:600, fontFamily:'Space Mono' }}>{a.vehiculo?.placa}</div>
                              <div style={{ fontSize:11, color:'var(--gold-light)' }}>{a.chofer?.nombre} {a.chofer?.apellido}</div>
                            </td>
                            <td style={{ padding:'12px 10px', fontFamily:'Space Mono', fontSize:12 }}>{new Date(a.fecha_inicio).toLocaleDateString('es-EC')}</td>
                            <td style={{ padding:'12px 10px', fontSize:12, color:'var(--text-3)', maxWidth:200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={a.observaciones}>
                              {a.observaciones || '—'}
                            </td>
                            <td style={{ padding:'12px 10px' }}>
                              <span style={{ fontSize:10, color:a.activa ? 'var(--green)' : 'var(--text-3)' }}>{a.activa ? 'En Ruta' : 'Cerrada'}</span>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}

              {!Array.isArray(detalleActivo.data) && !detalleActivo.isRecepcion && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                    <div>
                      <div style={{ fontSize:24, fontWeight:'bold', color:'#fff', fontFamily:'Space Mono' }}>{detalleActivo.data.vehiculo?.placa}</div>
                      <div style={{ fontSize:14, color:'var(--gold-light)' }}>{detalleActivo.data.chofer?.nombre} {detalleActivo.data.chofer?.apellido}</div>
                    </div>
                    {detalleActivo.data.activa
                      ? <StatusPill status="en_proceso" />
                      : <StatusPill status="completado" />
                    }
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:15, marginBottom:20 }}>
                    <div style={{ background:'var(--panel2)', padding:'15px', borderRadius:8, border:'1px solid var(--border-soft)' }}>
                      <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Fecha de Salida</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginTop:5, fontFamily:'Space Mono' }}>
                        {new Date(detalleActivo.data.fecha_inicio).toLocaleString('es-EC')}
                      </div>
                    </div>
                    <div style={{ background:'var(--panel2)', padding:'15px', borderRadius:8, border:'1px solid var(--border-soft)' }}>
                      <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Fecha de Retorno</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginTop:5, fontFamily:'Space Mono' }}>
                        {detalleActivo.data.fecha_fin ? new Date(detalleActivo.data.fecha_fin).toLocaleString('es-EC') : 'Pendiente...'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:13, color:'var(--text-2)', padding:'15px', background:'var(--panel2)', borderRadius:8 }}>
                    <div><strong style={{ color:'#fff' }}>Vehículo:</strong> <span style={{ float:'right' }}>{detalleActivo.data.vehiculo?.marca} {detalleActivo.data.vehiculo?.modelo}</span></div>
                    <div><strong style={{ color:'#fff' }}>Licencia del Chofer:</strong> <span style={{ float:'right' }}>Tipo {detalleActivo.data.chofer?.categoria_licencia}</span></div>
                    <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border-soft)' }}>
                      <strong style={{ color:'#fff' }}>Observaciones del Despacho:</strong><br/>
                      <div style={{ fontStyle:'italic', marginTop:8, padding:10, background:'rgba(0,0,0,0.2)', borderRadius:6 }}>
                        {detalleActivo.data.observaciones || 'No se registraron observaciones.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!Array.isArray(detalleActivo.data) && detalleActivo.isRecepcion && (
                <div>
                  <div style={{ textAlign:'center', marginBottom:25, paddingBottom:20, borderBottom:'1px dashed var(--border-soft)' }}>
                    <div style={{ fontSize:50, marginBottom:10 }}>📥</div>
                    <h3 style={{ color:'#fff', fontSize:20, marginBottom:8 }}>Confirmar Recepción de Unidad</h3>
                    <p style={{ color:'var(--text-3)', fontSize:14, lineHeight:1.5 }}>
                      Se registrará el retorno del vehículo <strong style={{ color:'var(--gold-light)', fontFamily:'Space Mono' }}>{detalleActivo.data.vehiculo?.placa}</strong>.
                      <br/>Pasará automáticamente a estar <strong>Libre</strong> en el patio.
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                    <Btn variant="ghost" onClick={() => setDetalleActivo(null)}>Cancelar</Btn>
                    <button onClick={() => confirmarRecepcion(detalleActivo.data.id)} disabled={saving}
                      style={{ padding:'10px 24px', borderRadius:8, background:'var(--green)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
                      {saving ? 'Procesando...' : 'Confirmar Recepción y Liberar'}
                    </button>
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
import { useEffect, useState } from 'react'
import { checklistAPI, vehiculosAPI, choferesAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState, StatusPill } from '../components/layout/UI'

const ITEMS = [
  { key:'luces_delanteras',   label:'Luces delanteras',        icon:'🔦' },
  { key:'luces_traseras',     label:'Luces traseras / stop',   icon:'🔦' },
  { key:'llantas',            label:'Estado de llantas',       icon:'🛞'  },
  { key:'extintor',           label:'Extintor vigente',        icon:'🔴' },
  { key:'nivel_agua',         label:'Nivel de agua',           icon:'💧' },
  { key:'nivel_aceite',       label:'Nivel de aceite',         icon:'🛢️' },
  { key:'bateria',            label:'Batería y bornes',        icon:'⚡' },
  { key:'limpiabrisas',       label:'Limpiabrisas',            icon:'🪟' },
  { key:'bocina',             label:'Bocina funcional',        icon:'🔔' },
  { key:'espejos',            label:'Espejos retrovisores',    icon:'🪞' },
  { key:'cinturones',         label:'Cinturones de seguridad', icon:'🔐' },
  { key:'senales_emergencia', label:'Señales de emergencia',   icon:'🚦' },
]

const idUnico = () => Math.random().toString(36).substr(2, 9)
const initCheck = () => Object.fromEntries(ITEMS.map(i => [i.key, true]))
const estadoInicial = { tipo_vehiculo:'', vehiculo_id:'', chofer_id:'', turno:'dia', observaciones:'', ...initCheck() }

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [choferes, setChoferes] = useState([])
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)

  const [formularios, setFormularios] = useState([{ idRef: idUnico(), ...estadoInicial }])
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ESTADO PARA EL MODAL INTERACTIVO
  const [detalleActivo, setDetalleActivo] = useState(null)

  const cargar = () => {
    setLoading(true)
    Promise.all([
      checklistAPI.list({ limit: 100 }), 
      vehiculosAPI.list(),
      choferesAPI.list(),
      checklistAPI.resumenHoy(),
    ]).then(([c, v, ch, r]) => {
      setChecklists(c.data); setVehiculos(v.data); setChoferes(ch.data); setResumen(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const updateField = (idRef, field, value) => {
    setFormularios(prev => prev.map(f => f.idRef === idRef ? { ...f, [field]: value } : f))
  }

  const agregarFormulario = () => {
    setFormularios(prev => [...prev, { idRef: idUnico(), ...estadoInicial }])
  }

  const removerFormulario = (idRef) => {
    setFormularios(prev => prev.filter(f => f.idRef !== idRef))
  }

  const getStats = (form) => {
    const fallos = ITEMS.filter(i => form[i.key] === false).length
    return { fallos, aprobado: fallos === 0 }
  }

  const getVehiculosFiltrados = (tipo) => tipo ? vehiculos.filter(v => v.tipo === tipo) : vehiculos

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      if (editandoId) {
        const payload = {
          vehiculo_id: parseInt(formularios[0].vehiculo_id),
          chofer_id: parseInt(formularios[0].chofer_id),
          turno: formularios[0].turno,
          observaciones: formularios[0].observaciones || null,
          ...Object.fromEntries(ITEMS.map(i => [i.key, formularios[0][i.key]])),
        }
        await checklistAPI.update(editandoId, payload)
        setSuccess('✅ Checklist actualizado correctamente.')
      } else {
        const promesas = formularios.map(f => {
          const payload = {
            vehiculo_id: parseInt(f.vehiculo_id),
            chofer_id: parseInt(f.chofer_id),
            turno: f.turno,
            observaciones: f.observaciones || null,
            ...Object.fromEntries(ITEMS.map(i => [i.key, f[i.key]])),
          }
          return checklistAPI.create(payload)
        })
        await Promise.all(promesas)
        setSuccess(`✅ ${formularios.length} inspección(es) registrada(s).`)
      }
      
      cerrarFormulario()
      cargar()
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const cargarDatosEdicion = (c) => {
    setEditandoId(c.id)
    setFormularios([{
      idRef: idUnico(),
      tipo_vehiculo: c.vehiculo?.tipo || '',
      vehiculo_id: c.vehiculo_id || '',
      chofer_id: c.chofer_id || '',
      turno: c.turno || 'dia',
      observaciones: c.observaciones || '',
      ...Object.fromEntries(ITEMS.map(i => [i.key, c[i.key] ?? true]))
    }])
    setShowForm(true)
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cerrarFormulario = () => {
    setShowForm(false)
    setEditandoId(null)
    setFormularios([{ idRef: idUnico(), ...estadoInicial }])
    setError('')
  }

  const eliminarChecklist = async (id) => {
    if (window.confirm(`¿Estás seguro de eliminar este checklist?`)) {
      try {
        await checklistAPI.delete(id)
        cargar()
      } catch (err) {
        alert('Error al eliminar el registro')
      }
    }
  }

  // Preparar datos filtrados para el modal de KPIs
  const hoyStr = new Date().toLocaleDateString('es-EC')
  const checklistsHoy = checklists.filter(c => new Date(c.fecha).toLocaleDateString('es-EC') === hoyStr)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth: 0, width: '100%', position: 'relative' }}>
      <PageHeader title="Checklist Pre-operacional" subtitle="Validación de salida de vehículos">
        <Btn variant={showForm ? "ghost" : "primary"} onClick={() => { cerrarFormulario(); setShowForm(!showForm); }}>
          {showForm ? 'Volver al panel' : '+ Nueva inspección'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formularios.map((f, index) => {
            const { fallos, aprobado } = getStats(f)
            const vehiculosFiltrados = getVehiculosFiltrados(f.tipo_vehiculo)
            return (
              <Panel key={f.idRef}>
                <PanelHeader title={editandoId ? "Editar inspección" : `Inspección #${index + 1}`}>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <span style={{ fontSize:12, color: aprobado ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                      {fallos === 0 ? '✓ APROBADO' : `✗ ${fallos} FALLA(S)`}
                    </span>
                    {!editandoId && formularios.length > 1 && (
                      <button type="button" onClick={() => removerFormulario(f.idRef)} style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                        🗑️ Quitar
                      </button>
                    )}
                  </div>
                </PanelHeader>

                <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, borderBottom:'1px solid var(--border-soft)' }}>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Categoría de Vehículo</label>
                    <select value={f.tipo_vehiculo} onChange={e => { updateField(f.idRef, 'tipo_vehiculo', e.target.value); updateField(f.idRef, 'vehiculo_id', ''); }}
                      style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                      <option value="">Todas las categorías</option>
                      <option value="liviano">Liviano</option>
                      <option value="pesado">Pesado</option>
                      <option value="maquinaria">Maquinaria</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
                    <select value={f.vehiculo_id} onChange={e => updateField(f.idRef, 'vehiculo_id', e.target.value)} required disabled={f.tipo_vehiculo && vehiculosFiltrados.length === 0}
                      style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', opacity: (f.tipo_vehiculo && vehiculosFiltrados.length === 0) ? 0.5 : 1 }}>
                      <option value="">Seleccionar...</option>
                      {vehiculosFiltrados.map(v => <option key={v.id} value={v.id}>{v.placa || v.codigo} — {v.marca} {v.modelo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Chofer *</label>
                    <select value={f.chofer_id} onChange={e => updateField(f.idRef, 'chofer_id', e.target.value)} required
                      style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                      <option value="">Seleccionar...</option>
                      {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1px', background:'var(--border-soft)' }}>
                  {ITEMS.map(item => (
                    <div key={item.key} style={{ background:'var(--panel)', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
                        <span style={{ fontSize:16 }}>{item.icon}</span>
                        {item.label}
                      </div>
                      <div style={{ display:'flex', gap:4 }}>
                        {[true, false].map(val => (
                          <button key={String(val)} type="button"
                            onClick={() => updateField(f.idRef, item.key, val)}
                            style={{
                              padding:'4px 12px', borderRadius:6, fontSize:11, fontWeight:600,
                              border:'none', cursor:'pointer', fontFamily:'DM Sans',
                              background: f[item.key] === val
                                ? (val ? 'var(--green)' : 'var(--red)')
                                : (val ? 'rgba(61,200,122,0.1)' : 'rgba(224,82,82,0.1)'),
                              color: f[item.key] === val
                                ? (val ? '#0E1117' : '#fff')
                                : (val ? 'var(--green)' : 'var(--red)'),
                              opacity: f[item.key] === val ? 1 : 0.5,
                            }}>
                            {val ? 'OK' : 'FALLA'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding:'16px 20px', borderTop:'1px solid var(--border-soft)', display:'flex', flexWrap:'wrap', gap:16, alignItems:'center', justifyContent:'space-between' }}>
                  <textarea placeholder="Observaciones adicionales..." value={f.observaciones}
                    onChange={e => updateField(f.idRef, 'observaciones', e.target.value)} rows={2}
                    style={{ flex:1, minWidth:'250px', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'8px 12px', color:'var(--text-1)', fontSize:12, outline:'none', resize:'none', fontFamily:'DM Sans' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Turno</label>
                      <select value={f.turno} onChange={e => updateField(f.idRef, 'turno', e.target.value)}
                        style={{ width:'120px', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                        <option value="dia">Día</option>
                        <option value="noche">Noche</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Panel>
            )
          })}

          {!editandoId && (
            <div onClick={agregarFormulario} style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)', transition:'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
              ➕ Agregar otra inspección a la lista
            </div>
          )}

          {error && <div style={{ color:'var(--red)', fontSize:13, background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8, fontWeight:500 }}>{error}</div>}
          
          <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving} style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
              {saving ? 'Guardando...' : (editandoId ? 'Actualizar' : `Guardar ${formularios.length} inspección(es)`)}
            </button>
          </div>
        </form>
      ) : (
        <>
          {success && <div style={{ margin:'0 0 16px', color: success.includes('✅') ? 'var(--green)' : 'var(--red)', fontSize:13, fontWeight:600, background: success.includes('✅') ? 'rgba(61,200,122,0.1)' : 'rgba(224,82,82,0.1)', padding:'10px 14px', borderRadius:8 }}>{success}</div>}
          
          {resumen && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {[
                { label:'Inspecciones Hoy', value:resumen.total, accent:'var(--blue)', data: checklistsHoy },
                { label:'Aprobados', value:resumen.aprobados, accent:'var(--green)', data: checklistsHoy.filter(c => c.aprobado === true) },
                { label:'Reprobados / Taller', value:resumen.reprobados, accent:'var(--red)', data: checklistsHoy.filter(c => c.aprobado === false) },
              ].map(k => (
                <div key={k.label} 
                     onClick={() => setDetalleActivo({ tipo: k.label, data: k.data })}
                     style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                     onMouseOver={e => e.currentTarget.style.transform='translateY(-3px)'} 
                     onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accent, opacity:0.7 }} />
                  <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.label}</div>
                  <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono', color: k.label === 'Reprobados / Taller' && k.value > 0 ? 'var(--red)' : 'var(--text-1)' }}>{k.value}</div>
                </div>
              ))}
            </div>
          )}

          <Panel style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <PanelHeader title="Historial de checklists recientes" />
            {loading ? <LoadingSpinner /> : checklists.length === 0 ? <EmptyState message="Sin checklists registrados" /> : (
              <div className="table-responsive-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr>
                      {['Fecha','Placa/Vehículo','Chofer','Turno','Resultado','Observaciones','Acciones'].map(h => (
                        <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {checklists.map(c => (
                      <tr key={c.id} 
                        onClick={() => setDetalleActivo({ tipo: 'Hoja de Inspección Técnica', data: c })}
                        onMouseEnter={e => e.currentTarget.style.background='var(--panel2)'} 
                        onMouseLeave={e => e.currentTarget.style.background='transparent'} 
                        style={{ cursor: 'pointer', transition:'background 0.15s' }}>
                        <td style={{ padding:'13px 20px', fontSize:11, fontFamily:'Space Mono', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                          {new Date(c.fecha).toLocaleString('es-EC', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                        </td>
                        <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                          <div style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>
                            {c.vehiculo?.placa || c.vehiculo?.codigo || `V-${c.vehiculo_id}`}
                          </div>
                          {c.vehiculo?.marca && <div style={{ fontSize:10, color:'var(--text-3)' }}>{c.vehiculo.marca} {c.vehiculo.modelo}</div>}
                        </td>
                        <td style={{ padding:'13px 20px', fontSize:13, color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                          {c.chofer ? `${c.chofer.nombre} ${c.chofer.apellido}` : '—'}
                        </td>
                        <td style={{ padding:'13px 20px', fontSize:12, color:'var(--text-3)', textTransform:'capitalize', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>{c.turno}</td>
                        <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                          {c.aprobado === null
                            ? <span style={{ fontSize:11, color:'var(--amber)' }}>Pendiente</span>
                            : c.aprobado
                              ? <span style={{ fontSize:11, color:'var(--green)', fontWeight:600 }}>✓ Aprobado</span>
                              : <span style={{ fontSize:11, color:'var(--red)', fontWeight:600 }}>✗ Reprobado</span>
                          }
                        </td>
                        <td style={{ padding:'13px 20px', fontSize:12, color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={c.observaciones}>
                          {c.observaciones || '—'}
                        </td>
                        <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={(e) => { e.stopPropagation(); cargarDatosEdicion(c); }} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); eliminarChecklist(c.id); }} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}

      {/* ========================================================= */}
      {/* EL MODAL INTELIGENTE DE CHECKLISTS                        */}
      {/* ========================================================= */}
      {detalleActivo && (
        <div onClick={() => setDetalleActivo(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10, 12, 17, 0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeInModal 0.2s ease-out', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: Array.isArray(detalleActivo.data) ? '650px' : '550px', background: 'var(--panel)', borderRadius: 16, padding: '30px', border: '1px solid var(--border-soft)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottom: '1px solid var(--border-soft)' }}>
              <h2 style={{ margin: 0, color: 'var(--gold-light)', fontSize: 18 }}>{detalleActivo.tipo}</h2>
              <button onClick={() => setDetalleActivo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ color: 'var(--text-2)' }}>
              
              {/* VISTA 1: Lista filtrada desde los KPIs (Array) */}
              {Array.isArray(detalleActivo.data) && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)' }}>
                        <th style={{ padding: '10px' }}>Hora</th>
                        <th style={{ padding: '10px' }}>Unidad</th>
                        <th style={{ padding: '10px' }}>Chofer</th>
                        <th style={{ padding: '10px' }}>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleActivo.data.length === 0 ? <tr><td colSpan="4" style={{padding:20, textAlign:'center'}}>No hay inspecciones en esta categoría hoy</td></tr> : null}
                      {detalleActivo.data.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '12px 10px', fontFamily: 'Space Mono', fontSize: 11 }}>
                            {new Date(c.fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ color: '#fff', fontWeight: 600, fontFamily: 'Space Mono' }}>{c.vehiculo?.placa || c.vehiculo?.codigo}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{c.chofer ? `${c.chofer.nombre}` : '—'}</td>
                          <td style={{ padding: '12px 10px' }}>
                             <StatusPill status={c.aprobado ? 'aprobado' : 'reprobado'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA 2: Detalle de una sola inspección (El Checklist Completo) */}
              {!Array.isArray(detalleActivo.data) && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', fontFamily: 'Space Mono' }}>{detalleActivo.data.vehiculo?.placa || detalleActivo.data.vehiculo?.codigo || 'Vehículo'}</div>
                      <div style={{ fontSize: 14, color: 'var(--gold-light)' }}>{detalleActivo.data.vehiculo?.marca} {detalleActivo.data.vehiculo?.modelo}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <StatusPill status={detalleActivo.data.aprobado ? 'aprobado' : 'reprobado'} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-3)', marginBottom: 20, paddingBottom: 15, borderBottom: '1px solid var(--border-soft)' }}>
                    <div><strong style={{ color: 'var(--text-2)' }}>Fecha:</strong> {new Date(detalleActivo.data.fecha).toLocaleString('es-EC')}</div>
                    <div><strong style={{ color: 'var(--text-2)' }}>Turno:</strong> <span style={{ textTransform: 'capitalize' }}>{detalleActivo.data.turno}</span></div>
                    <div><strong style={{ color: 'var(--text-2)' }}>Chofer:</strong> {detalleActivo.data.chofer ? `${detalleActivo.data.chofer.nombre} ${detalleActivo.data.chofer.apellido}` : '—'}</div>
                  </div>
                  
                  {/* GRILLA DE ITEMS DE INSPECCIÓN */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
                    {ITEMS.map(item => {
                       const isOk = detalleActivo.data[item.key]
                       return (
                         <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--panel2)', padding: '10px 15px', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                            <span style={{ flex: 1, fontSize: 13, color: 'var(--text-1)' }}>{item.label}</span>
                            {isOk === null ? (
                               <span style={{ color: 'var(--amber)', fontWeight: 'bold', fontSize: 12 }}>—</span>
                            ) : isOk ? (
                               <span style={{ color: 'var(--green)', fontWeight: 'bold', fontSize: 16 }}>✓</span>
                            ) : (
                               <span style={{ color: 'var(--red)', fontWeight: 'bold', fontSize: 16 }}>✗</span>
                            )}
                         </div>
                       )
                    })}
                  </div>

                  <div style={{ padding: '15px', background: 'var(--panel2)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)' }}>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: 5 }}>Observaciones registradas:</strong> 
                    <div style={{ fontStyle: 'italic' }}>
                      {detalleActivo.data.observaciones || 'No se registraron novedades adicionales durante la inspección.'}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeInModal { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
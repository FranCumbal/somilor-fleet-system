import { useEffect, useState } from 'react'
import { mantenimientoAPI, vehiculosAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, StatusPill, Chip, LoadingSpinner, EmptyState } from '../components/layout/UI'

const idUnico = () => Math.random().toString(36).substr(2, 9)
const estadoInicialForm = { tipo_vehiculo:'', vehiculo_id:'', tipo:'preventivo', descripcion:'', fecha_programada:'', km_programado:'', taller:'', costo:'', observaciones:'' }

export default function MantenimientoPage() {
  const [mantenimientos, setMantenimientos] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [catalogoDB, setCatalogoDB] = useState([]) 
  const [alertas, setAlertas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  
  const [formularios, setFormularios] = useState([{ idRef: idUnico(), ...estadoInicialForm }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const cargar = () => {
    const params = {}
    if (filtro !== 'todos') params.estado = filtro
    
    Promise.all([
      mantenimientoAPI.list(params),
      vehiculosAPI.list(),
      mantenimientoAPI.alertas(),
      mantenimientoAPI.catalogo()
    ]).then(([m, v, a, cat]) => {
      setMantenimientos(m.data); setVehiculos(v.data); setAlertas(a.data); setCatalogoDB(cat.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filtro])

  const updateField = (idRef, field, value) => {
    setFormularios(prev => {
      const formIndex = prev.findIndex(f => f.idRef === idRef)
      
      if (field === 'vehiculo_id' && value !== '') {
        const vehiculoSeleccionado = vehiculos.find(v => v.id.toString() === value)
        if (vehiculoSeleccionado) {
          if (formIndex === 0) {
            return prev.map(f => ({ ...f, vehiculo_id: value, tipo_vehiculo: vehiculoSeleccionado.tipo, descripcion: '' }))
          }
          return prev.map(f => f.idRef === idRef ? { ...f, vehiculo_id: value, tipo_vehiculo: vehiculoSeleccionado.tipo, descripcion: '' } : f)
        }
      }

      if (field === 'tipo') {
        return prev.map(f => f.idRef === idRef ? { ...f, tipo: value, descripcion: '' } : f)
      }

      if (formIndex === 0 && (field === 'tipo_vehiculo' || field === 'vehiculo_id')) {
        return prev.map(f => ({ ...f, [field]: value }))
      }
      
      return prev.map(f => f.idRef === idRef ? { ...f, [field]: value } : f)
    })
  }

  const agregarFormulario = () => {
    const formPrincipal = formularios[0]
    if (!formPrincipal.vehiculo_id) {
      setError('⚠️ Selecciona un vehículo en el primer mantenimiento antes de agregar otro.')
      return
    }
    setError('')
    setFormularios(prev => [...prev, { idRef: idUnico(), ...estadoInicialForm, tipo_vehiculo: formPrincipal.tipo_vehiculo }])
  }

  const removerFormulario = (idRef) => setFormularios(prev => prev.filter(f => f.idRef !== idRef))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const formPrincipal = formularios[0]
      if (editandoId) {
        const payload = {
          vehiculo_id: parseInt(formPrincipal.vehiculo_id),
          tipo: formPrincipal.tipo, 
          descripcion: formPrincipal.descripcion,
          fecha_programada: formPrincipal.fecha_programada || null,
          km_programado: formPrincipal.km_programado ? parseFloat(formPrincipal.km_programado) : null,
          taller: formPrincipal.taller || null,
          costo: formPrincipal.costo ? parseFloat(formPrincipal.costo) : null,
          observaciones: formPrincipal.observaciones || null,
        }
        await mantenimientoAPI.update(editandoId, payload)
      } else {
        const promesas = formularios.map(f => {
          return mantenimientoAPI.create({
            vehiculo_id: parseInt(formPrincipal.vehiculo_id),
            fecha_programada: formPrincipal.fecha_programada || null,
            km_programado: formPrincipal.km_programado ? parseFloat(formPrincipal.km_programado) : null,
            tipo: f.tipo, 
            descripcion: f.descripcion,
            taller: f.taller || null,
            costo: f.costo ? parseFloat(f.costo) : null,
            observaciones: f.observaciones || null,
          })
        })
        await Promise.all(promesas)
      }
      cerrarFormulario()
      cargar()
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar los registros') }
    finally { setSaving(false) }
  }

  const cargarDatosEdicion = (m) => {
    setEditandoId(m.id)
    setFormularios([{
      idRef: idUnico(),
      tipo_vehiculo: m.vehiculo?.tipo || '',
      vehiculo_id: m.vehiculo_id,
      tipo: m.tipo,
      descripcion: m.descripcion,
      fecha_programada: m.fecha_programada ? new Date(m.fecha_programada).toISOString().slice(0, 16) : '',
      km_programado: m.km_programado || '',
      taller: m.taller || '',
      costo: m.costo || '',
      observaciones: m.observaciones || ''
    }])
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const eliminarMantenimiento = async (id, descripcion) => {
    if (window.confirm(`¿Seguro que deseas eliminar el mantenimiento: "${descripcion}"?`)) {
      try { await mantenimientoAPI.delete(id); cargar() } catch (err) { alert('Error al eliminar') }
    }
  }

  const cerrarFormulario = () => {
    setShowForm(false); setEditandoId(null); setFormularios([{ idRef: idUnico(), ...estadoInicialForm }]); setError('')
  }

  const completar = async (id) => {
    await mantenimientoAPI.update(id, { estado:'completado', fecha_realizado: new Date().toISOString() })
    cargar()
  }

  const agruparProcedimientos = (tipoVehiculo, claseMantenimiento) => {
    const filtrados = catalogoDB.filter(p => p.tipo_vehiculo === tipoVehiculo && p.clase === claseMantenimiento)
    return filtrados.reduce((acc, curr) => {
      if (!acc[curr.sistema]) acc[curr.sistema] = []
      acc[curr.sistema].push(curr)
      return acc
    }, {})
  }

  return (
    /* MAGIA 1: minWidth: 0, width: 100% para frenar el Flexbox Blowout */
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth: 0, width: '100%' }}>
      <PageHeader title="Gestión de Mantenimiento" subtitle="Control preventivo y correctivo">
        <Btn variant={showForm ? "ghost" : "primary"} onClick={() => { cerrarFormulario(); setShowForm(!showForm); }}>
          {showForm ? 'Volver al panel' : '+ Registrar mantenimiento'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formularios.map((f, index) => {
            const esEsclavo = index > 0;
            const vehiculosFiltrados = f.tipo_vehiculo ? vehiculos.filter(v => v.tipo === f.tipo_vehiculo) : vehiculos;
            const procedimientosAgrupados = (f.tipo_vehiculo && f.tipo) ? agruparProcedimientos(f.tipo_vehiculo, f.tipo) : null;
            
            return (
              <Panel key={f.idRef} style={{ borderLeft: esEsclavo ? '4px solid var(--gold)' : 'none' }}>
                <PanelHeader title={editandoId ? "Editar mantenimiento" : `Mantenimiento #${index + 1}`}>
                  {!editandoId && esEsclavo && (
                    <button type="button" onClick={() => removerFormulario(f.idRef)} style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                      🗑️ Quitar
                    </button>
                  )}
                </PanelHeader>

                {!esEsclavo ? (
                  <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Filtrar Categoría</label>
                      <select value={f.tipo_vehiculo} onChange={e => { updateField(f.idRef, 'tipo_vehiculo', e.target.value); updateField(f.idRef, 'vehiculo_id', ''); }}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                        <option value="">Mostrar todos los vehículos</option>
                        <option value="liviano">Livianos</option>
                        <option value="pesado">Pesados</option>
                        <option value="maquinaria">Maquinaria</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
                      <select value={f.vehiculo_id} onChange={e => updateField(f.idRef, 'vehiculo_id', e.target.value)} required disabled={f.tipo_vehiculo && vehiculosFiltrados.length === 0}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', opacity: (f.tipo_vehiculo && vehiculosFiltrados.length === 0) ? 0.5 : 1 }}>
                        <option value="">Seleccionar vehículo...</option>
                        {vehiculosFiltrados.map(v => <option key={v.id} value={v.id}>{v.placa || v.codigo} — {v.marca} {v.modelo}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Fecha de Mantenimiento</label>
                      <input type="datetime-local" value={f.fecha_programada} onChange={e => updateField(f.idRef, 'fecha_programada', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
                    </div>
                    
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Tipo de Trabajo *</label>
                      <select value={f.tipo} onChange={e => updateField(f.idRef, 'tipo', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                        <option value="preventivo">Preventivo</option>
                        <option value="correctivo">Correctivo</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Kilometraje / Horas</label>
                      <input type="number" placeholder="Ej: 85000" value={f.km_programado} onChange={e => updateField(f.idRef, 'km_programado', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Costo Total ($)</label>
                      <input type="number" step="any" placeholder="0.00" value={f.costo} onChange={e => updateField(f.idRef, 'costo', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
                    </div>

                    <div style={{ gridColumn:'1/3' }}>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Procedimiento Específico *</label>
                      <select required value={f.descripcion} onChange={e => updateField(f.idRef, 'descripcion', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', opacity: f.vehiculo_id ? 1 : 0.5 }}>
                        <option value="">{f.vehiculo_id ? `-- Seleccione procedimiento ${f.tipo} --` : '-- Primero seleccione un vehículo arriba --'}</option>
                        {procedimientosAgrupados && Object.entries(procedimientosAgrupados).map(([grupo, items]) => (
                          <optgroup key={grupo} label={`[ ${grupo.toUpperCase()} ]`} style={{ color: 'var(--gold)', fontWeight: 600, fontStyle: 'normal' }}>
                            {items.map(item => (
                              <option key={item.id} value={item.descripcion} style={{ color: 'var(--text-1)', fontWeight: 400 }}>
                                {item.descripcion}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Taller</label>
                      <input placeholder="Taller Central SOMILOR" value={f.taller} onChange={e => updateField(f.idRef, 'taller', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, background:'rgba(255,255,255,0.01)' }}>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Tipo de Trabajo *</label>
                      <select value={f.tipo} onChange={e => updateField(f.idRef, 'tipo', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                        <option value="preventivo">Preventivo</option>
                        <option value="correctivo">Correctivo</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Taller</label>
                      <input placeholder="Taller Central SOMILOR" value={f.taller} onChange={e => updateField(f.idRef, 'taller', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Costo Extra ($)</label>
                      <input type="number" step="any" placeholder="0.00" value={f.costo} onChange={e => updateField(f.idRef, 'costo', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
                    </div>
                    
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Procedimiento Específico *</label>
                      <select required value={f.descripcion} onChange={e => updateField(f.idRef, 'descripcion', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                        <option value="">{`-- Seleccione procedimiento ${f.tipo} --`}</option>
                        {procedimientosAgrupados && Object.entries(procedimientosAgrupados).map(([grupo, items]) => (
                          <optgroup key={grupo} label={`[ ${grupo.toUpperCase()} ]`} style={{ color: 'var(--gold)', fontWeight: 600, fontStyle: 'normal' }}>
                            {items.map(item => (
                              <option key={item.id} value={item.descripcion} style={{ color: 'var(--text-1)', fontWeight: 400 }}>
                                {item.descripcion}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </Panel>
            )
          })}

          {!editandoId && (
            <div onClick={agregarFormulario} style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)', transition:'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
              ➕ Añadir otro mantenimiento para este mismo vehículo
            </div>
          )}

          {error && <div style={{ color:'var(--red)', fontSize:13, background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8, fontWeight:500 }}>{error}</div>}
          
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving} style={{ padding:'8px 20px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:13 }}>
              {saving ? 'Guardando...' : (editandoId ? 'Actualizar' : `Guardar ${formularios.length} mantenimiento(s)`)}
            </button>
          </div>
        </form>
      ) : (
        <>
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

          {/* MAGIA 2: Panel con maxWidth: 100% y overflow: hidden */}
          <Panel style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <PanelHeader title="Historial de mantenimientos">
              {/* MAGIA 3: flexWrap para los filtros */}
              <div style={{ display:'flex', flexWrap: 'wrap', gap:6 }}>
                {['todos','programado','en_proceso','completado','vencido'].map(e => (
                  <Chip key={e} active={filtro===e} onClick={() => setFiltro(e)}>
                    {e === 'todos' ? 'Todos' : e.replace('_',' ')}
                  </Chip>
                ))}
              </div>
            </PanelHeader>
            {loading ? <LoadingSpinner /> : mantenimientos.length === 0 ? <EmptyState message="Sin registros de mantenimiento" /> : (
              
              /* MAGIA 4: Contenedor scrolleable y minWidth en la tabla */
              <div className="table-responsive-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth: '1050px' }}>
                  <thead>
                    <tr>
                      {['Placa/Vehículo','Tipo','Descripción','Fecha','KM','Costo','Estado','Acciones'].map(h => (
                        <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mantenimientos.map(m => (
                      <tr key={m.id}
                        onMouseEnter={e => e.currentTarget.style.background='var(--panel2)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}
                        style={{ transition:'background 0.15s' }}>
                        <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                          <div style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>
                            {m.vehiculo?.placa || m.vehiculo?.codigo || `V-${m.vehiculo_id}`}
                          </div>
                          {m.vehiculo?.marca && <div style={{ fontSize:10, color:'var(--text-3)' }}>{m.vehiculo.marca} {m.vehiculo.modelo}</div>}
                        </td>
                        <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace: 'nowrap' }}><StatusPill status={m.tipo} /></td>
                        {/* A la descripción le dejamos un ancho máximo para que no sea infinita, pero que corte con '...' */}
                        <td style={{ padding:'13px 20px', fontSize:13, borderBottom:'1px solid var(--border-soft)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.descripcion}>
                          {m.descripcion}
                        </td>
                        <td style={{ padding:'13px 20px', fontSize:11, fontFamily:'Space Mono', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                          {m.fecha_programada ? new Date(m.fecha_programada).toLocaleDateString('es-EC') : '—'}
                        </td>
                        <td style={{ padding:'13px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                          {m.km_programado ? `${m.km_programado.toLocaleString()} km` : '—'}
                        </td>
                        <td style={{ padding:'13px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--green)', borderBottom:'1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                          {m.costo ? `$${m.costo.toFixed(2)}` : '—'}
                        </td>
                        <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace: 'nowrap' }}><StatusPill status={m.estado} /></td>
                        <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            {m.estado !== 'completado' && (
                              <button onClick={() => completar(m.id)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(61,200,122,0.1)', color:'var(--green)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Marcar completado">
                                ✓
                              </button>
                            )}
                            <button onClick={() => cargarDatosEdicion(m)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">
                              ✏️
                            </button>
                            <button onClick={() => eliminarMantenimiento(m.id, m.descripcion)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">
                              🗑️
                            </button>
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
    </div>
  )
}
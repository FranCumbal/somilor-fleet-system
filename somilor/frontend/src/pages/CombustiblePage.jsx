import { useEffect, useState } from 'react'
import { combustibleAPI, vehiculosAPI, choferesAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState } from '../components/layout/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const idUnico = () => Math.random().toString(36).substr(2, 9)
const getLocalNow = () => new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
const estadoInicial = { vehiculo_id:'', chofer_id:'', costo_total:'', fecha: '', observaciones:'' }
const preventInvalidChars = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault()
  }
}

export default function CombustiblePage() {
  const [tanqueos, setTanqueos] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [choferes, setChoferes] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [formularios, setFormularios] = useState([{ idRef: idUnico(), ...estadoInicial, fecha: getLocalNow() }])
  const [editandoId, setEditandoId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [detalleActivo, setDetalleActivo] = useState(null)

  const cargar = () => {
    setLoading(true)
    Promise.all([
      combustibleAPI.list({ limit: 100 }), 
      vehiculosAPI.list(),
      choferesAPI.list(),
    ]).then(([t, v, c]) => {
      setVehiculos(v.data); 
      setChoferes(c.data);
      const tanqueosCompletos = t.data.map(tanqueo => ({
        ...tanqueo,
        vehiculo: v.data.find(veh => veh.id === tanqueo.vehiculo_id),
        chofer: c.data.find(chof => chof.id === tanqueo.chofer_id)
      }))
      setTanqueos(tanqueosCompletos);
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const updateField = (idRef, field, value) => {
    setFormularios(prev => prev.map(f => f.idRef === idRef ? { ...f, [field]: value } : f))
  }

  const agregarFormulario = () => setFormularios(prev => [...prev, { idRef: idUnico(), ...estadoInicial, fecha: getLocalNow() }])
  const removerFormulario = (idRef) => setFormularios(prev => prev.filter(f => f.idRef !== idRef))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')

    // VALIDACIÓN ESTRICTA: El costo debe ser mayor a 0
    for (const f of formularios) {
      if (!f.costo_total || parseFloat(f.costo_total) <= 0) {
        setError(`El costo total debe ser un valor mayor a $0.00. Revisa el formulario.`)
        setSaving(false)
        return
      }
    }

    try {
      if (editandoId) {
        const f = formularios[0]
        const payload = {
          vehiculo_id: parseInt(f.vehiculo_id),
          chofer_id: f.chofer_id ? parseInt(f.chofer_id) : null,
          costo_total: parseFloat(f.costo_total),
          fecha: f.fecha ? new Date(f.fecha).toISOString() : null,
          observaciones: f.observaciones || null,
        }
        await combustibleAPI.update(editandoId, payload)
      } else {
        const promesas = formularios.map(f => {
          return combustibleAPI.create({
            vehiculo_id: parseInt(f.vehiculo_id),
            chofer_id: f.chofer_id ? parseInt(f.chofer_id) : null,
            costo_total: parseFloat(f.costo_total),
            fecha: f.fecha ? new Date(f.fecha).toISOString() : null,
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

  const cargarDatosEdicion = (t) => {
    setEditandoId(t.id)
    setFormularios([{
      idRef: idUnico(),
      vehiculo_id: t.vehiculo_id || '',
      chofer_id: t.chofer_id || '',
      costo_total: t.costo_total || '',
      fecha: t.fecha ? new Date(new Date(t.fecha).getTime() - new Date(t.fecha).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : getLocalNow(),
      observaciones: t.observaciones || ''
    }])
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cerrarFormulario = () => {
    setShowForm(false); setEditandoId(null); setFormularios([{ idRef: idUnico(), ...estadoInicial, fecha: getLocalNow() }]); setError('')
  }

  const eliminarTanqueo = async (id) => {
    if (window.confirm(`¿Estás seguro de eliminar este registro financiero?`)) {
      try { await combustibleAPI.delete(id); cargar() } catch (err) { alert('Error al eliminar') }
    }
  }

  // --- CÁLCULOS DINÁMICOS PARA KPIs ---
  const hoyStr = new Date().toLocaleDateString('es-EC')
  const costoHoy = tanqueos.filter(t => new Date(t.fecha).toLocaleDateString('es-EC') === hoyStr).reduce((acc, t) => acc + (t.costo_total || 0), 0)
  const costoTotalMes = tanqueos.reduce((acc, t) => acc + (t.costo_total || 0), 0)
  const totalTickets = tanqueos.length

  // --- CONSTRUCCIÓN DE LA GRÁFICA EN TIEMPO REAL ---
  const chartDataObj = {}
  tanqueos.forEach(t => {
    const dia = new Date(t.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
    chartDataObj[dia] = (chartDataObj[dia] || 0) + (t.costo_total || 0)
  })
  const chartData = Object.keys(chartDataObj).map(dia => ({ dia, costo: chartDataObj[dia] })).slice(0, 7).reverse()

  const handleChartClick = (state) => {
    if (state && state.activePayload) {
      const diaSeleccionado = state.activePayload[0].payload.dia
      const datosDia = tanqueos.filter(t => new Date(t.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) === diaSeleccionado)
      setDetalleActivo({ tipo: `Registros del ${diaSeleccionado}`, data: datosDia })
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth: 0, width: '100%', position: 'relative' }}>
      <PageHeader title="Control Financiero de Flota" subtitle="Registro de gastos por abastecimiento">
        <Btn variant={showForm ? "ghost" : "primary"} onClick={() => { cerrarFormulario(); setShowForm(!showForm); }}>
          {showForm ? 'Volver al panel' : '+ Registrar Gasto'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formularios.map((f, index) => (
            <Panel key={f.idRef}>
              <PanelHeader title={editandoId ? "Editar registro" : `Factura #${index + 1}`}>
                {!editandoId && formularios.length > 1 && (
                  <button type="button" onClick={() => removerFormulario(f.idRef)} style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                    🗑️ Quitar
                  </button>
                )}
              </PanelHeader>
              <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
                <div>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
                  <select value={f.vehiculo_id} onChange={e => updateField(f.idRef, 'vehiculo_id', e.target.value)} required
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                    <option value="">Seleccionar...</option>
                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa || v.codigo} — {v.marca} {v.modelo}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Chofer Autorizado</label>
                  <select value={f.chofer_id} onChange={e => updateField(f.idRef, 'chofer_id', e.target.value)}
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                    <option value="">Ninguno</option>
                    {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                  </select>
                </div>
                
                <div>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Fecha y Hora del Consumo *</label>
                  <input type="datetime-local" value={f.fecha}
                    onChange={e => updateField(f.idRef, 'fecha', e.target.value)} required
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize:12, color:'var(--gold)', display:'block', marginBottom:6, fontWeight:700 }}>Costo Total ($) *</label>
                  <input 
                    type="number" 
                    min="0.01" 
                    step="any" 
                    placeholder="Ej: 45.50" 
                    value={f.costo_total}
                    onChange={e => updateField(f.idRef, 'costo_total', e.target.value)} 
                    onKeyDown={preventInvalidChars}
                    required
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--gold-dim)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}
                  />
                </div>
                
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Observaciones (No. Factura, Estación de servicio, etc.)</label>
                  <textarea value={f.observaciones} onChange={e => updateField(f.idRef, 'observaciones', e.target.value)} rows={2}
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', resize:'vertical', fontFamily:'DM Sans' }} />
                </div>
              </div>
            </Panel>
          ))}

          {!editandoId && (
            <div onClick={agregarFormulario} style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)', transition:'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
              ➕ Agregar otro registro a la lista
            </div>
          )}

          {error && <div style={{ color:'var(--red)', fontSize:13, background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8, fontWeight:500 }}>{error}</div>}
          
          <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving} style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
              {saving ? 'Guardando...' : (editandoId ? 'Actualizar registro' : `Guardar ${formularios.length} registro(s)`)}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {[
              { label:'Gasto de Hoy', value:`$${costoHoy.toFixed(2)}`, accent:'var(--gold)', data: tanqueos.filter(t => new Date(t.fecha).toLocaleDateString('es-EC') === hoyStr) },
              { label:'Inversión Total', value: `$${costoTotalMes.toFixed(2)}`, accent:'var(--blue)', data: tanqueos },
              { label:'Tickets Registrados', value: totalTickets, accent:'var(--green)', data: tanqueos },
            ].map(k => (
              <div key={k.label} 
                   onClick={() => setDetalleActivo({ tipo: k.label, data: k.data })}
                   style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                   onMouseOver={e => e.currentTarget.style.transform='translateY(-3px)'} 
                   onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accent, opacity:0.7 }} />
                <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.label}</div>
                <div style={{ fontSize:26, fontWeight:600, fontFamily:'Space Mono', color: 'var(--text-1)' }}>{k.value}</div>
              </div>
            ))}
          </div>

          <Panel style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <PanelHeader title="Inversión Diaria (USD) ➔" />
            <div style={{ padding:'20px 20px 10px' }}>
              {chartData.length === 0 ? (
                 <div style={{ display: 'flex', height: 180, alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Sin datos suficientes para graficar</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top:10, right:10, left:-20, bottom:0 }} onClick={handleChartClick}>
                    <XAxis dataKey="dia" tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={val => `$${val}`} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, fontSize:12 }} itemStyle={{ color:'var(--gold-light)' }} formatter={(value) => [`$${value.toFixed(2)}`, 'Inversión']} />
                    <Bar dataKey="costo" radius={[4,4,0,0]} cursor="pointer">
                      {chartData.map((entry, i) => <Cell key={i} fill={i === chartData.length-1 ? 'var(--gold)' : 'rgba(200,168,75,0.4)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>

          <Panel style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <PanelHeader title="Historial Financiero" />
            {loading ? <LoadingSpinner /> : tanqueos.length === 0 ? <EmptyState message="Sin registros financieros" /> : (
              <div className="table-responsive-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr>
                      {['Fecha','Unidad','Chofer Responsable','Inversión ($)','Acciones'].map(h => (
                        <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tanqueos.map(t => (
                      <tr key={t.id} 
                          onClick={() => setDetalleActivo({ tipo: 'Factura Detallada', data: t })}
                          onMouseEnter={e => e.currentTarget.style.background='var(--panel2)'} 
                          onMouseLeave={e => e.currentTarget.style.background='transparent'} 
                          style={{ transition:'background 0.15s', cursor: 'pointer' }}>
                        <td style={{ padding:'13px 20px', fontSize:11, fontFamily:'Space Mono', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                          {new Date(t.fecha).toLocaleString('es-EC', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                        </td>
                        <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                          <div style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>
                            {t.vehiculo?.placa || t.vehiculo?.codigo || `V-${t.vehiculo_id}`}
                          </div>
                          {t.vehiculo?.marca && <div style={{ fontSize:10, color:'var(--text-3)' }}>{t.vehiculo.marca} {t.vehiculo.modelo}</div>}
                        </td>
                        <td style={{ padding:'13px 20px', fontSize:13, color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                          {t.chofer ? `${t.chofer.nombre} ${t.chofer.apellido}` : '—'}
                        </td>
                        <td style={{ padding:'13px 20px', fontSize:14, fontWeight:700, fontFamily:'Space Mono', color:'var(--gold-light)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                          ${(t.costo_total || 0).toFixed(2)}
                        </td>
                        <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={(e) => { e.stopPropagation(); cargarDatosEdicion(t); }} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); eliminarTanqueo(t.id); }} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">🗑️</button>
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
      {/* EL MODAL INTELIGENTE FINANCIERO                           */}
      {/* ========================================================= */}
      {detalleActivo && (
        <div onClick={() => setDetalleActivo(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10, 12, 17, 0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeInModal 0.2s ease-out', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: Array.isArray(detalleActivo.data) ? '600px' : '450px', background: 'var(--panel)', borderRadius: 16, padding: '30px', border: '1px solid var(--border-soft)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottom: '1px solid var(--border-soft)' }}>
              <h2 style={{ margin: 0, color: 'var(--gold-light)', fontSize: 18 }}>{detalleActivo.tipo}</h2>
              <button onClick={() => setDetalleActivo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ color: 'var(--text-2)' }}>
              
              {/* VISTA 1: Lista filtrada (Array) */}
              {Array.isArray(detalleActivo.data) && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)' }}>
                        <th style={{ padding: '10px' }}>Fecha</th>
                        <th style={{ padding: '10px' }}>Unidad</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Inversión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleActivo.data.length === 0 ? <tr><td colSpan="3" style={{padding:20, textAlign:'center'}}>No hay transacciones registradas</td></tr> : null}
                      {detalleActivo.data.map((t, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '12px 10px', fontFamily: 'Space Mono', fontSize: 11 }}>{new Date(t.fecha).toLocaleDateString('es-EC')}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ color: '#fff', fontWeight: 600, fontFamily: 'Space Mono' }}>{t.vehiculo?.placa || t.vehiculo?.codigo}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{t.chofer ? `${t.chofer.nombre}` : '—'}</div>
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: 'var(--gold-light)', fontWeight: 700, fontFamily: 'Space Mono' }}>${(t.costo_total||0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA 2: Detalle de una sola factura (Objeto) */}
              {!Array.isArray(detalleActivo.data) && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 25, paddingBottom: 20, borderBottom: '1px dashed var(--border-soft)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Costo Registrado</div>
                    <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--gold-light)', fontFamily: 'Space Mono', margin: '10px 0' }}>
                      ${(detalleActivo.data.costo_total || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Registrado el: {new Date(detalleActivo.data.fecha).toLocaleString('es-EC')}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-2)', padding: '15px', background: 'var(--panel2)', borderRadius: 8 }}>
                    <div><strong style={{ color: '#fff' }}>Unidad:</strong> <span style={{ float: 'right', fontFamily: 'Space Mono', color: 'var(--gold-light)', fontWeight: 'bold' }}>{detalleActivo.data.vehiculo?.placa || detalleActivo.data.vehiculo?.codigo}</span></div>
                    <div><strong style={{ color: '#fff' }}>Chofer:</strong> <span style={{ float: 'right' }}>{detalleActivo.data.chofer ? `${detalleActivo.data.chofer.nombre} ${detalleActivo.data.chofer.apellido}` : '—'}</span></div>
                    <div style={{ marginTop: 5, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
                      <strong style={{ color: '#fff', display: 'block', marginBottom: 5 }}>Observaciones:</strong> 
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6, fontStyle: 'italic' }}>
                        {detalleActivo.data.observaciones || 'Sin detalles.'}
                      </div>
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
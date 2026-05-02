import { useEffect, useState } from 'react'
import { dashboardAPI } from '../services/api'
import { KpiCard, Panel, PanelHeader, PageHeader, StatusPill } from '../components/layout/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const choferesList = [
  { nombre: 'Carlos Ruiz', unidad: 'GSD-9876', licencia: 'Tipo E', turno: 'Diurno' },
  { nombre: 'Luis Perez', unidad: 'UBA-4321', licencia: 'Tipo C', turno: 'Nocturno' },
  { nombre: 'Jorge Arias', unidad: 'Sin unidad', licencia: 'Tipo G', turno: 'Descanso' },
]

const dotColor = { red:'var(--red)', amber:'var(--amber)', blue:'var(--blue)' }

const VehiculoStatus = ({ estado }) => {
  const st = estado?.toLowerCase() || ''
  const map = {
    operativo: { label:'Operativo', color:'var(--green)', bg:'rgba(61,200,122,0.1)' },
    taller:    { label:'En Taller', color:'var(--red)',   bg:'rgba(224,82,82,0.1)' },
    libre:     { label:'Libre',     color:'var(--amber)', bg:'rgba(240,167,66,0.1)' },
  }
  const m = map[st] || { label: estado, color:'var(--text-2)', bg:'var(--panel2)' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, padding:'4px 12px', borderRadius:20, fontWeight:600, color: m.color, background: m.bg, whiteSpace: 'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
      {m.label}
    </span>
  )
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [detalleActivo, setDetalleActivo] = useState(null)

  useEffect(() => {
    dashboardAPI.kpis()
      .then(r => setKpis(r.data))
      .catch(err => console.error("Error cargando dashboard:", err))
      .finally(() => setLoading(false))
  }, [])

  const showToast = (mensaje) => {
    setToast(mensaje)
    setTimeout(() => setToast(null), 3000)
  }

  const handleChartClick = (state) => {
    if (state && state.activePayload) {
      setDetalleActivo({ tipo: 'Detalle Diario Combustible', data: state.activePayload[0].payload })
    }
  }

  const k = kpis || {}
  
  const fuelData = k.consumo_semana || []
  const flotaCompleta = k.flota_completa || []
  const mantenimientosData = k.mantenimientos_data || []
  const alertas = k.alertas || []

  const totalVehiculos = (k.vehiculos_operativos || 0) + (k.vehiculos_taller || 0) + (k.vehiculos_libres || 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth: 0, width: '100%', position: 'relative' }}>
      
      {/* TOAST FLOTANTE */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(14, 17, 23, 0.95)', backdropFilter: 'blur(10px)',
          border: '1px solid var(--gold)', color: 'var(--gold-light)',
          padding: '14px 28px', borderRadius: '30px', fontSize: '14px', fontWeight: 600,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 99999,
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'toastPopUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}>
          <span style={{ fontSize: '18px' }}>✨</span> {toast}
        </div>
      )}

      <PageHeader title="Panel de Control" subtitle={new Date().toLocaleDateString('es-EC', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}>
        <button onClick={() => showToast('La exportación de reportes estará disponible próximamente')} style={{ padding:'8px 16px', borderRadius:8, fontSize:13, background:'var(--panel2)', color:'var(--text-2)', border:'1px solid var(--border-soft)', cursor:'pointer' }}>Exportar</button>
        <button onClick={() => showToast('El registro rápido estará disponible próximamente')} style={{ padding:'8px 16px', borderRadius:8, fontSize:13, background:'var(--gold)', color:'#0E1117', border:'none', cursor:'pointer', fontWeight:600 }}>+ Registrar</button>
      </PageHeader>

      {/* 1. KPIs BÁSICOS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14 }}>
        <div onClick={() => setDetalleActivo({ tipo: 'Unidades Operativas', data: flotaCompleta.filter(f => f.estado.toLowerCase().includes('operativ')) })} style={{cursor:'pointer', transition:'transform 0.2s'}} onMouseOver={e => e.currentTarget.style.transform='translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
          <KpiCard label="Vehículos operativos" value={loading ? '...' : k.vehiculos_operativos ?? 0} delta="Datos en tiempo real" deltaType="up" accent="var(--green)" />
        </div>
        <div onClick={() => setDetalleActivo({ tipo: 'Unidades en Taller', data: flotaCompleta.filter(f => f.estado.toLowerCase().includes('taller')) })} style={{cursor:'pointer', transition:'transform 0.2s'}} onMouseOver={e => e.currentTarget.style.transform='translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
          <KpiCard label="En taller" value={loading ? '...' : k.vehiculos_taller ?? 0} delta="Atención requerida" deltaType="down" accent="var(--red)" />
        </div>
        <div onClick={() => setDetalleActivo({ tipo: 'Inversión en Combustible', data: fuelData })} style={{cursor:'pointer', transition:'transform 0.2s'}} onMouseOver={e => e.currentTarget.style.transform='translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
          <KpiCard label="Gasto en combustible hoy" value={loading ? '...' : `$${k.combustible_hoy_costo ?? '0.00'}`} delta="Corte de hoy" deltaType="warn" accent="var(--gold)" />
        </div>
        <div onClick={() => setDetalleActivo({ tipo: 'Nómina de Choferes', data: choferesList })} style={{cursor:'pointer', transition:'transform 0.2s'}} onMouseOver={e => e.currentTarget.style.transform='translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
          <KpiCard label="Choferes activos" value={loading ? '...' : k.choferes_activos ?? 0} delta="Plantilla actual" deltaType="up" accent="var(--blue)" />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>
        
        {/* 2. GRÁFICO DE COMBUSTIBLE */}
        <Panel style={{ maxWidth: '100%', overflow: 'hidden', height: '100%' }}>
          <div onClick={() => setDetalleActivo({ tipo: 'Inversión en Combustible', data: fuelData })} style={{ cursor: 'pointer' }} title="Ver registro semanal completo">
            <PanelHeader title="Inversión en Combustible — semana (USD) ➔" />
          </div>
          <div style={{ padding:'20px 20px 10px' }}>
            {loading ? (
              <div style={{ display: 'flex', height: 200, alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Cargando gráfica...</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={fuelData} margin={{ top:10, right:10, left:-20, bottom:0 }} onClick={handleChartClick}>
                  <XAxis dataKey="dia" tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, fontSize:12 }} />
                  <Bar dataKey="costo" radius={[4,4,0,0]} cursor="pointer">
                    {fuelData.map((entry, i) => (
                      <Cell key={i} fill={entry.dia === 'Hoy' ? 'var(--gold)' : 'rgba(200,168,75,0.35)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        {/* 3. ALERTAS ACTIVAS */}
        <Panel>
          <div onClick={() => setDetalleActivo({ tipo: 'Todas las Alertas', data: alertas })} style={{ cursor: 'pointer' }} title="Expandir todas las alertas">
            <PanelHeader title="Alertas activas ➔">
              <span style={{ fontSize:10, background:'var(--red)', color:'#fff', borderRadius:8, padding:'1px 6px', fontWeight:600 }}>{alertas.length}</span>
            </PanelHeader>
          </div>
          {alertas.length === 0 && !loading && (
             <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No hay alertas recientes.</div>
          )}
          {alertas.map((a, i) => (
            <div key={i} onClick={() => setDetalleActivo({ tipo: 'Alerta de Flota', data: a })} style={{ display:'flex', gap:12, padding:'12px 18px', borderBottom: i < alertas.length - 1 ? '1px solid var(--border-soft)' : 'none', cursor:'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width:8, height:8, borderRadius:'50%', marginTop:4, flexShrink:0, background: dotColor[a.tipo] }} />
              <div>
                <div style={{ fontSize:12, fontWeight:500, marginBottom:2 }}>{a.titulo}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </Panel>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16 }}>
        
        {/* 4. DISPONIBILIDAD DE FLOTA */}
        <Panel>
          <div onClick={() => setDetalleActivo({ tipo: 'Unidades: Estado General', data: flotaCompleta })} style={{ cursor: 'pointer' }}>
            <PanelHeader title="Disponibilidad de flota ➔" />
          </div>
          <div style={{ padding:'20px' }}>
            {[
              { label:'Operativos', val: k.vehiculos_operativos ?? 0, total: totalVehiculos || 1, color:'var(--green)', keyword: 'operativ' },
              { label:'En taller',  val: k.vehiculos_taller ?? 0,  total: totalVehiculos || 1, color:'var(--red)', keyword: 'taller' },
              { label:'Libres',     val: k.vehiculos_libres ?? 0,  total: totalVehiculos || 1, color:'var(--amber)', keyword: 'libre' },
            ].map(row => (
              <div key={row.label} 
                   onClick={() => setDetalleActivo({ tipo: `Unidades: ${row.label}`, data: flotaCompleta.filter(f => f.estado.toLowerCase().includes(row.keyword)) })} 
                   style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, cursor:'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ fontSize:12, color:'var(--text-2)', width:90 }}>{row.label}</div>
                <div style={{ flex:1, height:6, background:'var(--panel2)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:row.color, borderRadius:3, width:`${(row.val/row.total)*100}%` }} />
                </div>
                <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', minWidth:30, textAlign:'right' }}>{row.val}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* 5. MANTENIMIENTOS */}
        <Panel style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <div onClick={() => setDetalleActivo({ tipo: 'Mantenimientos Programados', data: mantenimientosData })} style={{ cursor: 'pointer' }}>
            <PanelHeader title="Mantenimientos próximos ➔" />
          </div>
          {mantenimientosData.length === 0 && !loading && (
             <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No hay mantenimientos programados.</div>
          )}
          {mantenimientosData.map((m, i) => (
            <div key={i} onClick={() => setDetalleActivo({ tipo: 'Ficha de Unidad', data: m })} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom: i < mantenimientosData.length - 1 ? '1px solid var(--border-soft)' : 'none', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ minWidth: 90 }}>
                <div style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>{m.placa}</div>
                <div style={{ fontSize:10, color:'var(--text-3)' }}>{m.vehiculo}</div>
              </div>
              <div style={{ flex:1, overflow: 'hidden' }}>
                <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.desc}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>{m.info}</div>
              </div>
              <StatusPill status={m.estado} />
            </div>
          ))}
        </Panel>
      </div>

      {/* ========================================================= */}
      {/* EL MODAL INTELIGENTE                                      */}
      {/* ========================================================= */}
      {detalleActivo && (
        <div onClick={() => setDetalleActivo(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10, 12, 17, 0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeInModal 0.2s ease-out', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: Array.isArray(detalleActivo.data) ? '700px' : '500px', background: 'var(--panel)', borderRadius: 16, padding: '30px', border: '1px solid var(--border-soft)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottom: '1px solid var(--border-soft)' }}>
              <h2 style={{ margin: 0, color: 'var(--gold-light)', fontSize: 18 }}>{detalleActivo.tipo}</h2>
              <button onClick={() => setDetalleActivo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ color: 'var(--text-2)' }}>
              
              {/* Lógica: TABLAS DE FLOTA (Operativos, Taller, Libres, etc) */}
              {detalleActivo.tipo.includes('Unidades') && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '450px', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)' }}>
                        <th style={{ padding: '10px' }}>Unidad</th>
                        <th style={{ padding: '10px' }}>Chofer Asignado</th>
                        <th style={{ padding: '10px' }}>Estado Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleActivo.data.length === 0 ? <tr><td colSpan="3" style={{padding:20, textAlign:'center'}}>No hay unidades en esta categoría</td></tr> : null}
                      {detalleActivo.data.map((v, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ color: '#fff', fontWeight: 600, fontFamily: 'Space Mono' }}>{v.placa}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{v.marca} {v.modelo}</div>
                          </td>
                          <td style={{ padding: '12px 10px', color: v.responsable !== 'Sin asignar' ? 'var(--gold-light)' : 'var(--text-3)' }}>
                            {v.responsable}
                          </td>
                          <td style={{ padding: '12px 10px' }}><VehiculoStatus estado={v.estado} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Lógica: TABLA DE CHOFERES */}
              {detalleActivo.tipo === 'Nómina de Choferes' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '450px', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)' }}><th style={{ padding: 10 }}>Nombre</th><th style={{ padding: 10 }}>Asignación</th><th style={{ padding: 10 }}>Licencia / Turno</th></tr>
                    </thead>
                    <tbody>
                      {detalleActivo.data.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#fff' }}>{c.nombre}</td>
                          <td style={{ padding: '12px 10px', fontFamily: 'Space Mono', color: 'var(--gold-light)' }}>{c.unidad}</td>
                          <td style={{ padding: '12px 10px' }}>{c.licencia} <span style={{color:'var(--text-3)'}}>• {c.turno}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Lógica: TODAS LAS ALERTAS */}
              {detalleActivo.tipo === 'Todas las Alertas' && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                   {detalleActivo.data.length === 0 ? <p style={{textAlign:'center', padding:20}}>No hay alertas activas.</p> : null}
                   {detalleActivo.data.map((a, i) => (
                     <div key={i} style={{ background:'var(--panel2)', padding:15, borderRadius:8, borderLeft: `4px solid ${dotColor[a.tipo]}` }}>
                       <div style={{fontWeight:'bold', color:'#fff', marginBottom:4}}>{a.titulo}</div>
                       <div style={{fontSize:13}}>{a.desc}</div>
                       <div style={{fontSize:11, color: 'var(--text-3)', marginTop: 5}}>{a.tiempo}</div>
                     </div>
                   ))}
                </div>
              )}

              {/* Lógica: 1 SOLA ALERTA */}
              {detalleActivo.tipo === 'Alerta de Flota' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>{detalleActivo.data.titulo}</div>
                  <div style={{ fontSize: 14 }}><strong>Detalle:</strong> {detalleActivo.data.desc}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Reportado: {detalleActivo.data.tiempo}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button onClick={() => setDetalleActivo(null)} style={{ flex: 1, padding: '12px', background: 'var(--panel2)', border: '1px solid var(--border-soft)', color: '#fff', borderRadius: 8, cursor: 'pointer' }}>Ignorar</button>
                    <button style={{ flex: 1, padding: '12px', background: 'var(--gold)', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: 8, cursor: 'pointer' }}>Atender Caso</button>
                  </div>
                </div>
              )}

              {/* Lógica: SEMANA DE COMBUSTIBLE */}
              {detalleActivo.tipo === 'Inversión en Combustible' && (
                <div style={{ display: 'grid', gap: 10 }}>
                  <p style={{marginBottom:10, fontSize:13}}>Resumen financiero de los últimos 7 días.</p>
                  {detalleActivo.data.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--panel2)', padding: '10px 15px', borderRadius: 8 }}>
                      <span>Día: <strong style={{color: '#fff'}}>{d.dia}</strong></span><span style={{ color: 'var(--gold)' }}>${d.costo.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Lógica: 1 SOLO DIA DE COMBUSTIBLE */}
              {detalleActivo.tipo === 'Detalle Diario Combustible' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 16, color: 'var(--text-3)', marginBottom: 10 }}>Consumo registrado</div>
                  <div style={{ fontSize: 40, fontWeight: 'bold', color: 'var(--gold)' }}>${detalleActivo.data.costo.toFixed(2)}</div>
                  <div style={{ fontSize: 24, color: '#fff', marginTop: 10 }}>Día {detalleActivo.data.dia}</div>
                </div>
              )}

              {/* Lógica: MANTENIMIENTOS PROGRAMADOS (Lista Completa) */}
              {detalleActivo.tipo === 'Mantenimientos Programados' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '450px', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)' }}>
                        <th style={{ padding: '10px' }}>Unidad</th>
                        <th style={{ padding: '10px' }}>Intervención</th>
                        <th style={{ padding: '10px' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleActivo.data.length === 0 ? <tr><td colSpan="3" style={{padding:20, textAlign:'center'}}>No hay mantenimientos</td></tr> : null}
                      {detalleActivo.data.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ color: '#fff', fontWeight: 600, fontFamily: 'Space Mono' }}>{m.placa}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.vehiculo}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{m.desc}</td>
                          <td style={{ padding: '12px 10px' }}><StatusPill status={m.estado} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Lógica: 1 SOLO MANTENIMIENTO */}
              {detalleActivo.tipo === 'Ficha de Unidad' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div><div style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', fontFamily: 'Space Mono' }}>{detalleActivo.data.placa}</div><div style={{ fontSize: 14, color: 'var(--gold-light)' }}>{detalleActivo.data.vehiculo}</div></div>
                    <StatusPill status={detalleActivo.data.estado} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 20 }}>
                    <div style={{ background: 'var(--panel2)', padding: '15px', borderRadius: 8, border: '1px solid var(--border-soft)' }}><div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Trabajo a realizar</div><div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginTop: 5 }}>{detalleActivo.data.desc}</div></div>
                    <div style={{ background: 'var(--panel2)', padding: '15px', borderRadius: 8, border: '1px solid var(--border-soft)' }}><div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Uso Registrado</div><div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginTop: 5, fontFamily: 'Space Mono' }}>{detalleActivo.data.kilometraje}</div></div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', padding: '10px', background: 'rgba(200,168,75,0.05)', borderRadius: 8 }}><strong>Responsable:</strong> {detalleActivo.data.responsable}</div>
                </div>
              )}

              {/* Lógica: Ficha Técnica de 1 solo Vehículo desde el Modal */}
              {!Array.isArray(detalleActivo.data) && detalleActivo.tipo.includes('Unidades') && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', fontFamily: 'Space Mono' }}>{detalleActivo.data.placa || 'SIN PLACA'}</div>
                      <div style={{ fontSize: 14, color: 'var(--gold-light)' }}>{detalleActivo.data.marca} {detalleActivo.data.modelo} ({detalleActivo.data.anio || 'N/A'})</div>
                    </div>
                    <VehiculoStatus estado={detalleActivo.data.estado} />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 20 }}>
                    <div style={{ background: 'var(--panel2)', padding: '15px', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Uso Registrado</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 5, fontFamily: 'Space Mono' }}>
                         {detalleActivo.data.tipo === 'maquinaria' ? `${detalleActivo.data.horas_operacion} h` : `${detalleActivo.data.kilometraje_actual.toLocaleString()} km`}
                      </div>
                    </div>
                    <div style={{ background: 'var(--panel2)', padding: '15px', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Combustible</div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop: 5 }}>
                        <div style={{ width: '100%', height:6, background:'var(--panel3)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:3, background: detalleActivo.data.nivel_combustible < 25 ? 'var(--red)' : detalleActivo.data.nivel_combustible < 50 ? 'var(--amber)' : 'var(--green)', width:`${detalleActivo.data.nivel_combustible}%` }} />
                        </div>
                        <span style={{ fontSize:13, fontWeight: 600, fontFamily:'Space Mono', color: '#fff' }}>{detalleActivo.data.nivel_combustible}%</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 15, fontSize: 13, color: 'var(--text-2)', padding: '15px', background: 'var(--panel2)', borderRadius: 8 }}>
                    <div><strong style={{ color: '#fff' }}>Tipo:</strong> <span style={{ textTransform: 'capitalize' }}>{detalleActivo.data.tipo}</span></div>
                    <div><strong style={{ color: '#fff' }}>Color:</strong> {detalleActivo.data.color || 'No especificado'}</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes toastPopUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fadeInModal { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
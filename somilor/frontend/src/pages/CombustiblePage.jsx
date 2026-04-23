import { useEffect, useState } from 'react'
import { combustibleAPI, vehiculosAPI, choferesAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState, StatusPill } from '../components/layout/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const idUnico = () => Math.random().toString(36).substr(2, 9)
const estadoInicial = { vehiculo_id:'', chofer_id:'', litros:'', km_inicial:'', km_final:'', precio_litro:'1.10', observaciones:'' }

const fuelDays = [
  {d:'01',l:185},{d:'02',l:210},{d:'03',l:165},{d:'04',l:230},{d:'05',l:195},
  {d:'06',l:120},{d:'07',l:205},{d:'08',l:90},
]

export default function CombustiblePage() {
  const [tanqueos, setTanqueos] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [choferes, setChoferes] = useState([])
  const [resumenHoy, setResumenHoy] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  
  const [formularios, setFormularios] = useState([{ idRef: idUnico(), ...estadoInicial }])
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const cargar = () => {
    setLoading(true)
    Promise.all([
      combustibleAPI.list({ limit:20 }),
      vehiculosAPI.list(),
      choferesAPI.list(),
      combustibleAPI.resumenHoy(),
    ]).then(([t, v, c, r]) => {
      setTanqueos(t.data); setVehiculos(v.data); setChoferes(c.data); setResumenHoy(r.data)
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

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editandoId) {
        const payload = {
          vehiculo_id: parseInt(formularios[0].vehiculo_id),
          chofer_id: formularios[0].chofer_id ? parseInt(formularios[0].chofer_id) : null,
          litros: parseFloat(formularios[0].litros),
          km_inicial: formularios[0].km_inicial ? parseFloat(formularios[0].km_inicial) : null,
          km_final: formularios[0].km_final ? parseFloat(formularios[0].km_final) : null,
          precio_litro: formularios[0].precio_litro ? parseFloat(formularios[0].precio_litro) : null,
          observaciones: formularios[0].observaciones || null,
        }
        await combustibleAPI.update(editandoId, payload)
      } else {
        const promesas = formularios.map(f => {
          const payload = {
            vehiculo_id: parseInt(f.vehiculo_id),
            chofer_id: f.chofer_id ? parseInt(f.chofer_id) : null,
            litros: parseFloat(f.litros),
            km_inicial: f.km_inicial ? parseFloat(f.km_inicial) : null,
            km_final: f.km_final ? parseFloat(f.km_final) : null,
            precio_litro: f.precio_litro ? parseFloat(f.precio_litro) : null,
            observaciones: f.observaciones || null,
          }
          return combustibleAPI.create(payload)
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
      litros: t.litros || '',
      km_inicial: t.km_inicial || '',
      km_final: t.km_final || '',
      precio_litro: t.precio_litro || '',
      observaciones: t.observaciones || ''
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

  const eliminarTanqueo = async (id) => {
    if (window.confirm(`¿Estás seguro de eliminar este registro de tanqueo?`)) {
      try {
        await combustibleAPI.delete(id)
        cargar()
      } catch (err) {
        alert('Error al eliminar el registro')
      }
    }
  }

  const anomalias = tanqueos.filter(t => t.es_anomalia).length
  const totalMes = tanqueos.reduce((s, t) => s + (t.litros || 0), 0)
  const rendProm = tanqueos.filter(t => t.rendimiento_km_l).reduce((s, t, _, a) => s + t.rendimiento_km_l / a.length, 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <PageHeader title="Gestión de Combustible" subtitle="Control de tanqueos y rendimiento">
        <Btn variant={showForm ? "ghost" : "primary"} onClick={() => { cerrarFormulario(); setShowForm(!showForm); }}>
          {showForm ? 'Volver al panel' : '+ Registrar tanqueo'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formularios.map((f, index) => (
            <Panel key={f.idRef}>
              <PanelHeader title={editandoId ? "Editar tanqueo" : `Tanqueo #${index + 1}`}>
                {!editandoId && formularios.length > 1 && (
                  <button type="button" onClick={() => removerFormulario(f.idRef)} style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                    🗑️ Quitar
                  </button>
                )}
              </PanelHeader>
              <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                <div>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
                  <select value={f.vehiculo_id} onChange={e => updateField(f.idRef, 'vehiculo_id', e.target.value)} required
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                    <option value="">Seleccionar...</option>
                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa || v.codigo} — {v.marca} {v.modelo} ({v.color || 'S/C'})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Chofer</label>
                  <select value={f.chofer_id} onChange={e => updateField(f.idRef, 'chofer_id', e.target.value)}
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                    <option value="">Ninguno</option>
                    {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                  </select>
                </div>
                {[
                  { key:'litros', label:'Litros *', ph:'45' },
                  { key:'km_inicial', label:'KM inicial', ph:'45000' },
                  { key:'km_final', label:'KM final', ph:'45450' },
                  { key:'precio_litro', label:'Precio/litro', ph:'1.10' },
                ].map(campo => (
                  <div key={campo.key}>
                    <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{campo.label}</label>
                    <input type="number" step="any" placeholder={campo.ph} value={f[campo.key]}
                      onChange={e => updateField(f.idRef, campo.key, e.target.value)}
                      required={campo.label.includes('*')}
                      style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}
                    />
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Observaciones</label>
                  <textarea value={f.observaciones} onChange={e => updateField(f.idRef, 'observaciones', e.target.value)} rows={2}
                    style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', resize:'vertical', fontFamily:'DM Sans' }} />
                </div>
              </div>
            </Panel>
          ))}

          {!editandoId && (
            <div onClick={agregarFormulario} style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)', transition:'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
              ➕ Agregar otro tanqueo a la lista
            </div>
          )}

          {error && <div style={{ color:'var(--red)', fontSize:13, background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8, fontWeight:500 }}>{error}</div>}
          
          <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving} style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
              {saving ? 'Guardando...' : (editandoId ? 'Actualizar tanqueo' : `Guardar ${formularios.length} tanqueo(s)`)}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Consumo hoy', value:`${resumenHoy?.litros_total ?? 0} L`, accent:'var(--gold)' },
              { label:'Total registros', value: totalMes.toFixed(0) + ' L', accent:'var(--blue)' },
              { label:'Rendimiento prom.', value: rendProm ? `${rendProm.toFixed(1)} km/L` : '—', accent:'var(--green)' },
              { label:'Anomalías', value: anomalias, accent:'var(--red)' },
            ].map(k => (
              <div key={k.label} style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accent, opacity:0.7 }} />
                <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.label}</div>
                <div style={{ fontSize:26, fontWeight:600, fontFamily:'Space Mono' }}>{k.value}</div>
              </div>
            ))}
          </div>

          <Panel>
            <PanelHeader title="Consumo diario — mes actual (litros)" />
            <div style={{ padding:'20px 20px 10px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={fuelDays} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                  <XAxis dataKey="d" tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, fontSize:12 }} itemStyle={{ color:'var(--gold-light)' }} labelStyle={{ color:'var(--text-2)' }} />
                  <Bar dataKey="l" name="Litros" radius={[4,4,0,0]}>
                    {fuelDays.map((_, i) => <Cell key={i} fill={i === fuelDays.length-1 ? 'var(--gold)' : 'rgba(200,168,75,0.4)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Últimos tanqueos registrados" />
            {loading ? <LoadingSpinner /> : tanqueos.length === 0 ? <EmptyState message="Sin registros de combustible" /> : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Fecha','Placa/Vehículo','Chofer','Litros','KM inicial','KM final','Rendimiento','Estado','Acciones'].map(h => (
                      <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tanqueos.map(t => (
                    <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background='var(--panel2)'} onMouseLeave={e => e.currentTarget.style.background='transparent'} style={{ transition:'background 0.15s' }}>
                      <td style={{ padding:'13px 20px', fontSize:11, fontFamily:'Space Mono', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)' }}>
                        {new Date(t.fecha).toLocaleString('es-EC', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                        <div style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>
                          {t.vehiculo?.placa || t.vehiculo?.codigo || `V-${t.vehiculo_id}`}
                        </div>
                        {t.vehiculo?.marca && <div style={{ fontSize:10, color:'var(--text-3)' }}>{t.vehiculo.marca} {t.vehiculo.modelo}</div>}
                      </td>
                      <td style={{ padding:'13px 20px', fontSize:13, color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>
                        {t.chofer ? `${t.chofer.nombre} ${t.chofer.apellido}` : '—'}
                      </td>
                      <td style={{ padding:'13px 20px', fontSize:13, fontFamily:'Space Mono', borderBottom:'1px solid var(--border-soft)' }}>{t.litros} L</td>
                      <td style={{ padding:'13px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>{t.km_inicial?.toLocaleString() ?? '—'}</td>
                      <td style={{ padding:'13px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>{t.km_final?.toLocaleString() ?? '—'}</td>
                      <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                        {t.rendimiento_km_l ? (
                          <span style={{ fontFamily:'Space Mono', fontSize:12, color: t.rendimiento_km_l < 4 ? 'var(--red)' : 'var(--green)' }}>{t.rendimiento_km_l} km/L</span>
                        ) : <span style={{ color:'var(--text-3)', fontSize:12 }}>—</span>}
                      </td>
                      <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                        {t.es_anomalia
                          ? <span style={{ fontSize:11, color:'var(--red)', background:'rgba(224,82,82,0.1)', padding:'3px 8px', borderRadius:8, fontWeight:600 }}>⚠ Anomalía</span>
                          : <span style={{ fontSize:11, color:'var(--green)' }}>Normal</span>
                        }
                      </td>
                      <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => cargarDatosEdicion(t)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">✏️</button>
                          <button onClick={() => eliminarTanqueo(t.id)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">🗑️</button>
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
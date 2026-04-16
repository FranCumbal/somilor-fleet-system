import { useEffect, useState } from 'react'
import { combustibleAPI, vehiculosAPI, choferesAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState, StatusPill } from '../components/layout/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

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
  const [form, setForm] = useState({ vehiculo_id:'', chofer_id:'', litros:'', km_inicial:'', km_final:'', precio_litro:'1.10', observaciones:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      combustibleAPI.list({ limit:20 }),
      vehiculosAPI.list(),
      choferesAPI.list(),
      combustibleAPI.resumenHoy(),
    ]).then(([t, v, c, r]) => {
      setTanqueos(t.data); setVehiculos(v.data); setChoferes(c.data); setResumenHoy(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        vehiculo_id: parseInt(form.vehiculo_id),
        chofer_id: form.chofer_id ? parseInt(form.chofer_id) : null,
        litros: parseFloat(form.litros),
        km_inicial: form.km_inicial ? parseFloat(form.km_inicial) : null,
        km_final: form.km_final ? parseFloat(form.km_final) : null,
        precio_litro: form.precio_litro ? parseFloat(form.precio_litro) : null,
        costo_total: form.litros && form.precio_litro ? parseFloat(form.litros) * parseFloat(form.precio_litro) : null,
        observaciones: form.observaciones || null,
      }
      await combustibleAPI.create(payload)
      setShowForm(false)
      const [t, r] = await Promise.all([combustibleAPI.list({ limit:20 }), combustibleAPI.resumenHoy()])
      setTanqueos(t.data); setResumenHoy(r.data)
    } catch (err) { setError(err.response?.data?.detail || 'Error al registrar') }
    finally { setSaving(false) }
  }

  const anomalias = tanqueos.filter(t => t.es_anomalia).length
  const totalMes = tanqueos.reduce((s, t) => s + (t.litros || 0), 0)
  const rendProm = tanqueos.filter(t => t.rendimiento_km_l).reduce((s, t, _, a) => s + t.rendimiento_km_l / a.length, 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <PageHeader title="Gestión de Combustible" subtitle="Control de tanqueos y rendimiento">
        <Btn variant="primary" onClick={() => setShowForm(!showForm)}>+ Registrar tanqueo</Btn>
      </PageHeader>

      {/* KPIs */}
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

      {/* Gráfico */}
      <Panel>
        <PanelHeader title="Consumo diario — abril 2026 (litros)" />
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

      {/* Formulario */}
      {showForm && (
        <Panel>
          <PanelHeader title="Registrar tanqueo">
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
          </PanelHeader>
          <form onSubmit={handleSubmit} style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            <div>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
              <select value={form.vehiculo_id} onChange={e => setForm(p=>({...p, vehiculo_id:e.target.value}))} required
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                <option value="">Seleccionar...</option>
                {vehiculos.map(v => <option key={v.id} value={v.id}>{v.codigo} — {v.marca} {v.modelo}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Chofer</label>
              <select value={form.chofer_id} onChange={e => setForm(p=>({...p, chofer_id:e.target.value}))}
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
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{f.label}</label>
                <input type="number" step="any" placeholder={f.ph} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required={f.label.includes('*')}
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}
                />
              </div>
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Observaciones</label>
              <textarea value={form.observaciones} onChange={e => setForm(p=>({...p,observaciones:e.target.value}))} rows={2}
                style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', resize:'vertical', fontFamily:'DM Sans' }} />
            </div>
            {error && <div style={{ gridColumn:'1/-1', color:'var(--red)', fontSize:12, background:'rgba(224,82,82,0.1)', padding:'8px 12px', borderRadius:8 }}>{error}</div>}
            <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
              <button type="submit" disabled={saving} style={{ padding:'8px 20px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                {saving ? 'Guardando...' : 'Registrar tanqueo'}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* Tabla */}
      <Panel>
        <PanelHeader title="Últimos tanqueos registrados" />
        {loading ? <LoadingSpinner /> : tanqueos.length === 0 ? <EmptyState message="Sin registros de combustible" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Fecha','Vehículo','Chofer','Litros','KM inicial','KM final','Rendimiento','Estado'].map(h => (
                  <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tanqueos.map(t => (
                <tr key={t.id}
                  onMouseEnter={e => e.currentTarget.style.background='var(--panel2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  style={{ cursor:'pointer', transition:'background 0.15s' }}>
                  <td style={{ padding:'13px 20px', fontSize:11, fontFamily:'Space Mono', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)' }}>
                    {new Date(t.fecha).toLocaleString('es-EC', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                  </td>
                  <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                    <span style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>{t.vehiculo?.codigo ?? `V-${t.vehiculo_id}`}</span>
                  </td>
                  <td style={{ padding:'13px 20px', fontSize:13, color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>{t.chofer_id ? `C-${t.chofer_id}` : '—'}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}

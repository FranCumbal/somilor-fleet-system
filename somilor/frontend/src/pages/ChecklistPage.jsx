import { useEffect, useState } from 'react'
import { checklistAPI, vehiculosAPI, choferesAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState } from '../components/layout/UI'

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

const initCheck = () => Object.fromEntries(ITEMS.map(i => [i.key, true]))

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [choferes, setChoferes] = useState([])
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)

  const estadoInicial = { tipo_vehiculo:'', vehiculo_id:'', chofer_id:'', turno:'dia', observaciones:'', ...initCheck() }
  const [form, setForm] = useState(estadoInicial)
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cargar = () => {
    setLoading(true)
    Promise.all([
      checklistAPI.list({ limit:15 }),
      vehiculosAPI.list(),
      choferesAPI.list(),
      checklistAPI.resumenHoy(),
    ]).then(([c, v, ch, r]) => {
      setChecklists(c.data); setVehiculos(v.data); setChoferes(ch.data); setResumen(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const aprobado = ITEMS.every(i => form[i.key] === true)
  const fallos = ITEMS.filter(i => form[i.key] === false).length

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      const payload = {
        vehiculo_id: parseInt(form.vehiculo_id),
        chofer_id: parseInt(form.chofer_id),
        turno: form.turno,
        observaciones: form.observaciones || null,
        ...Object.fromEntries(ITEMS.map(i => [i.key, form[i.key]])),
      }
      
      if (editandoId) {
        await checklistAPI.update(editandoId, payload)
        setSuccess('✅ Checklist actualizado correctamente.')
      } else {
        await checklistAPI.create(payload)
        setSuccess(aprobado ? '✅ Checklist aprobado. El vehículo puede salir.' : `❌ Checklist reprobado. ${fallos} item(s) con falla. Vehículo retenido.`)
      }
      
      cerrarFormulario()
      cargar()
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const cargarDatosEdicion = (c) => {
    setEditandoId(c.id)
    setForm({
      tipo_vehiculo: c.vehiculo?.tipo || '',
      vehiculo_id: c.vehiculo_id || '',
      chofer_id: c.chofer_id || '',
      turno: c.turno || 'dia',
      observaciones: c.observaciones || '',
      // Mapeamos dinámicamente los valores booleanos que vienen de la base de datos
      ...Object.fromEntries(ITEMS.map(i => [i.key, c[i.key] ?? true]))
    })
    setShowForm(true)
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cerrarFormulario = () => {
    setShowForm(false)
    setEditandoId(null)
    setForm(estadoInicial)
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

  const vehiculosFiltrados = form.tipo_vehiculo ? vehiculos.filter(v => v.tipo === form.tipo_vehiculo) : vehiculos;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <PageHeader title="Checklist Pre-operacional" subtitle="Validación de salida de vehículos">
        <Btn variant="primary" onClick={() => { cerrarFormulario(); setShowForm(!showForm); }}>+ Nueva inspección</Btn>
      </PageHeader>

      {/* KPIs */}
      {resumen && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {[
            { label:'Total hoy', value:resumen.total, accent:'var(--blue)' },
            { label:'Aprobados', value:resumen.aprobados, accent:'var(--green)' },
            { label:'Reprobados', value:resumen.reprobados, accent:'var(--red)' },
          ].map(k => (
            <div key={k.label} style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accent, opacity:0.7 }} />
              <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.label}</div>
              <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <Panel>
          <PanelHeader title={editandoId ? "Editar inspección" : "Nueva inspección pre-operacional"}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ fontSize:12, color: aprobado ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                {fallos === 0 ? '✓ APROBADO' : `✗ ${fallos} FALLA(S)`}
              </span>
              <Btn variant="ghost" onClick={cerrarFormulario}>Cancelar</Btn>
            </div>
          </PanelHeader>

          <form onSubmit={handleSubmit}>
            <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, borderBottom:'1px solid var(--border-soft)' }}>
              <div>
                <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Categoría de Vehículo</label>
                <select value={form.tipo_vehiculo} onChange={e => setForm(p=>({...p, tipo_vehiculo:e.target.value, vehiculo_id:''}))}
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                  <option value="">Todas las categorías</option>
                  <option value="liviano">Liviano</option>
                  <option value="pesado">Pesado</option>
                  <option value="maquinaria">Maquinaria</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
                <select value={form.vehiculo_id} onChange={e => setForm(p=>({...p,vehiculo_id:e.target.value}))} required disabled={form.tipo_vehiculo && vehiculosFiltrados.length === 0}
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', opacity: (form.tipo_vehiculo && vehiculosFiltrados.length === 0) ? 0.5 : 1 }}>
                  <option value="">Seleccionar...</option>
                  {vehiculosFiltrados.map(v => <option key={v.id} value={v.id}>{v.placa || v.codigo} — {v.marca} {v.modelo} ({v.color || 'S/C'})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Chofer *</label>
                <select value={form.chofer_id} onChange={e => setForm(p=>({...p,chofer_id:e.target.value}))} required
                  style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                  <option value="">Seleccionar...</option>
                  {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'var(--border-soft)' }}>
              {ITEMS.map(item => (
                <div key={item.key} style={{ background:'var(--panel)', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
                    <span style={{ fontSize:16 }}>{item.icon}</span>
                    {item.label}
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    {[true, false].map(val => (
                      <button key={String(val)} type="button"
                        onClick={() => setForm(p => ({ ...p, [item.key]: val }))}
                        style={{
                          padding:'4px 12px', borderRadius:6, fontSize:11, fontWeight:600,
                          border:'none', cursor:'pointer', fontFamily:'DM Sans',
                          background: form[item.key] === val
                            ? (val ? 'var(--green)' : 'var(--red)')
                            : (val ? 'rgba(61,200,122,0.1)' : 'rgba(224,82,82,0.1)'),
                          color: form[item.key] === val
                            ? (val ? '#0E1117' : '#fff')
                            : (val ? 'var(--green)' : 'var(--red)'),
                          opacity: form[item.key] === val ? 1 : 0.5,
                        }}>
                        {val ? 'OK' : 'FALLA'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding:'16px 20px', borderTop:'1px solid var(--border-soft)', display:'flex', gap:16, alignItems:'center', justifyContent:'space-between' }}>
              <textarea placeholder="Observaciones adicionales..." value={form.observaciones}
                onChange={e => setForm(p=>({...p,observaciones:e.target.value}))} rows={2}
                style={{ flex:1, background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'8px 12px', color:'var(--text-1)', fontSize:12, outline:'none', resize:'none', fontFamily:'DM Sans' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Turno</label>
                  <select value={form.turno} onChange={e => setForm(p=>({...p,turno:e.target.value}))}
                    style={{ width:'120px', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                    <option value="dia">Día</option>
                    <option value="noche">Noche</option>
                  </select>
                </div>
                <button type="submit" disabled={saving || !form.vehiculo_id || !form.chofer_id}
                  style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, flexShrink:0, opacity: (!form.vehiculo_id || !form.chofer_id) ? 0.5 : 1, marginTop: '20px' }}>
                  {saving ? 'Guardando...' : (editandoId ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </div>

            {error  && <div style={{ margin:'0 20px 16px', color:'var(--red)', fontSize:12, background:'rgba(224,82,82,0.1)', padding:'10px 14px', borderRadius:8 }}>{error}</div>}
          </form>
        </Panel>
      )}

      {success && !showForm && <div style={{ margin:'0 0 16px', color: success.includes('✅') ? 'var(--green)' : 'var(--red)', fontSize:13, fontWeight:600, background: success.includes('✅') ? 'rgba(61,200,122,0.1)' : 'rgba(224,82,82,0.1)', padding:'10px 14px', borderRadius:8 }}>{success}</div>}

      {/* Historial */}
      <Panel>
        <PanelHeader title="Historial de checklists recientes" />
        {loading ? <LoadingSpinner /> : checklists.length === 0 ? <EmptyState message="Sin checklists registrados" /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Fecha','Placa/Vehículo','Chofer','Turno','Resultado','Observaciones','Acciones'].map(h => (
                  <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {checklists.map(c => (
                <tr key={c.id}
                  onMouseEnter={e => e.currentTarget.style.background='var(--panel2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  style={{ transition:'background 0.15s' }}>
                  <td style={{ padding:'13px 20px', fontSize:11, fontFamily:'Space Mono', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)' }}>
                    {new Date(c.fecha).toLocaleString('es-EC', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                  </td>
                  <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                    <div style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>
                      {c.vehiculo?.placa || c.vehiculo?.codigo || `V-${c.vehiculo_id}`}
                    </div>
                    {c.vehiculo?.marca && <div style={{ fontSize:10, color:'var(--text-3)' }}>{c.vehiculo.marca} {c.vehiculo.modelo}</div>}
                  </td>
                  <td style={{ padding:'13px 20px', fontSize:13, color:'var(--text-2)', borderBottom:'1px solid var(--border-soft)' }}>
                    {c.chofer ? `${c.chofer.nombre} ${c.chofer.apellido}` : '—'}
                  </td>
                  <td style={{ padding:'13px 20px', fontSize:12, color:'var(--text-3)', textTransform:'capitalize', borderBottom:'1px solid var(--border-soft)' }}>{c.turno}</td>
                  <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                    {c.aprobado === null
                      ? <span style={{ fontSize:11, color:'var(--amber)' }}>Pendiente</span>
                      : c.aprobado
                        ? <span style={{ fontSize:11, color:'var(--green)', fontWeight:600 }}>✓ Aprobado</span>
                        : <span style={{ fontSize:11, color:'var(--red)', fontWeight:600 }}>✗ Reprobado</span>
                    }
                  </td>
                  <td style={{ padding:'13px 20px', fontSize:12, color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {c.observaciones || '—'}
                  </td>
                  <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => cargarDatosEdicion(c)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">
                        ✏️
                      </button>
                      <button onClick={() => eliminarChecklist(c.id)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">
                        🗑️
                      </button>
                    </div>
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
import { useEffect, useState } from 'react'
import { mantenimientoAPI, vehiculosAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, StatusPill, Chip, LoadingSpinner, EmptyState } from '../components/layout/UI'

const idUnico = () => Math.random().toString(36).substr(2, 9)
const estadoInicialForm = { tipo_vehiculo:'', vehiculo_id:'', tipo:'preventivo', descripcion:'', fecha_programada:'', km_programado:'', taller:'', costo:'', observaciones:'' }

const preventInvalidChars = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
}

export default function MantenimientoPage() {
  const [mantenimientos, setMantenimientos] = useState([])
  const [vehiculos, setVehiculos]           = useState([])
  const [catalogoDB, setCatalogoDB]         = useState([])
  const [alertas, setAlertas]               = useState(null)
  const [loading, setLoading]               = useState(true)
  const [filtro, setFiltro]                 = useState('todos')
  const [showForm, setShowForm]             = useState(false)
  const [editandoId, setEditandoId]         = useState(null)
  const [formularios, setFormularios]       = useState([{ idRef: idUnico(), ...estadoInicialForm }])
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState('')
  const [detalleActivo, setDetalleActivo]   = useState(null)
  const [busqueda, setBusqueda]             = useState('')
  const [pagina, setPagina]                 = useState(1)
  const POR_PAGINA                          = 15

  const cargar = () => {
    const params = {}
    if (filtro !== 'todos') params.estado = filtro
    Promise.all([
      mantenimientoAPI.list(params),
      vehiculosAPI.list(),
      mantenimientoAPI.alertas(),
      mantenimientoAPI.catalogo()
    ]).then(([m, v, a, cat]) => {
      const completos = m.data.map(mant => ({
        ...mant,
        vehiculo: v.data.find(veh => veh.id === mant.vehiculo_id)
      }))
      setMantenimientos(completos)
      setVehiculos(v.data)
      setAlertas(a.data)
      setCatalogoDB(cat.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [filtro])
  useEffect(() => { setPagina(1) }, [filtro, busqueda])

  const mantenimientosFiltrados = mantenimientos.filter(m => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      (m.vehiculo?.placa  || '').toLowerCase().includes(q) ||
      (m.vehiculo?.marca  || '').toLowerCase().includes(q) ||
      (m.vehiculo?.modelo || '').toLowerCase().includes(q) ||
      (m.descripcion      || '').toLowerCase().includes(q) ||
      (m.tipo             || '').toLowerCase().includes(q) ||
      (m.estado           || '').toLowerCase().includes(q) ||
      (m.taller           || '').toLowerCase().includes(q)
    )
  })

  const totalPaginas         = Math.max(1, Math.ceil(mantenimientosFiltrados.length / POR_PAGINA))
  const mantenimientosPagina = mantenimientosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const ahora    = new Date()
  const en7Dias  = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)
  const mantsVencidos    = mantenimientos.filter(m => m.estado === 'vencido' || (m.estado === 'programado' && m.fecha_programada && new Date(m.fecha_programada) < ahora))
  const mantsProximos    = mantenimientos.filter(m => m.estado === 'programado' && m.fecha_programada && new Date(m.fecha_programada) >= ahora && new Date(m.fecha_programada) <= en7Dias)
  const mantsCompletados = mantenimientos.filter(m => m.estado === 'completado')

  const updateField = (idRef, field, value) => {
    setFormularios(prev => {
      const formIndex = prev.findIndex(f => f.idRef === idRef)
      if (field === 'vehiculo_id' && value !== '') {
        const v = vehiculos.find(v => v.id.toString() === value)
        if (v) {
          if (formIndex === 0) return prev.map(f => ({ ...f, vehiculo_id: value, tipo_vehiculo: v.tipo, descripcion: '' }))
          return prev.map(f => f.idRef === idRef ? { ...f, vehiculo_id: value, tipo_vehiculo: v.tipo, descripcion: '' } : f)
        }
      }
      if (field === 'tipo') return prev.map(f => f.idRef === idRef ? { ...f, tipo: value, descripcion: '' } : f)
      if (formIndex === 0 && (field === 'tipo_vehiculo' || field === 'vehiculo_id')) return prev.map(f => ({ ...f, [field]: value }))
      return prev.map(f => f.idRef === idRef ? { ...f, [field]: value } : f)
    })
  }

  const agregarFormulario = () => {
    const formPrincipal = formularios[0]
    if (!formPrincipal.vehiculo_id) { setError('Selecciona un vehículo en el primer mantenimiento antes de agregar otro.'); return }
    setError('')
    setFormularios(prev => [...prev, { idRef: idUnico(), ...estadoInicialForm, tipo_vehiculo: formPrincipal.tipo_vehiculo }])
  }

  const removerFormulario = (idRef) => setFormularios(prev => prev.filter(f => f.idRef !== idRef))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const formPrincipal = formularios[0]
      if (editandoId) {
        await mantenimientoAPI.update(editandoId, {
          vehiculo_id:      parseInt(formPrincipal.vehiculo_id),
          tipo:             formPrincipal.tipo,
          descripcion:      formPrincipal.descripcion,
          fecha_programada: formPrincipal.fecha_programada || null,
          km_programado:    formPrincipal.km_programado ? parseFloat(formPrincipal.km_programado) : null,
          taller:           formPrincipal.taller || null,
          costo:            formPrincipal.costo ? parseFloat(formPrincipal.costo) : null,
          observaciones:    formPrincipal.observaciones || null,
        })
      } else {
        await Promise.all(formularios.map(f => mantenimientoAPI.create({
          vehiculo_id:      parseInt(formPrincipal.vehiculo_id),
          fecha_programada: formPrincipal.fecha_programada || null,
          km_programado:    formPrincipal.km_programado ? parseFloat(formPrincipal.km_programado) : null,
          tipo:             f.tipo,
          descripcion:      f.descripcion,
          taller:           f.taller || null,
          costo:            f.costo ? parseFloat(f.costo) : null,
          observaciones:    f.observaciones || null,
        })))
      }
      cerrarFormulario(); cargar()
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar los registros') }
    finally { setSaving(false) }
  }

  const cargarDatosEdicion = (m) => {
    setEditandoId(m.id)
    setFormularios([{
      idRef:            idUnico(),
      tipo_vehiculo:    m.vehiculo?.tipo || '',
      vehiculo_id:      m.vehiculo_id,
      tipo:             m.tipo,
      descripcion:      m.descripcion,
      fecha_programada: m.fecha_programada ? new Date(m.fecha_programada).toISOString().slice(0, 16) : '',
      km_programado:    m.km_programado || '',
      taller:           m.taller || '',
      costo:            m.costo || '',
      observaciones:    m.observaciones || ''
    }])
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const eliminarMantenimiento = async (id, descripcion) => {
    if (window.confirm(`¿Seguro que deseas eliminar: "${descripcion}"?`)) {
      try { await mantenimientoAPI.delete(id); cargar() }
      catch { alert('Error al eliminar') }
    }
  }

  const cerrarFormulario = () => {
    setShowForm(false); setEditandoId(null)
    setFormularios([{ idRef: idUnico(), ...estadoInicialForm }]); setError('')
  }

  const completar = async (id) => {
    await mantenimientoAPI.update(id, { estado:'completado', fecha_realizado: new Date().toISOString() })
    cargar()
  }

  const iniciar = async (id) => {
    await mantenimientoAPI.update(id, { estado:'en_proceso' })
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

  const Paginacion = () => totalPaginas > 1 ? (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid var(--border-soft)' }}>
      <span style={{ fontSize:12, color:'var(--text-3)' }}>
        Página {pagina} de {totalPaginas} · {mantenimientosFiltrados.length} registros
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
            acc.push(n); return acc
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

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth:0, width:'100%', position:'relative' }}>
      <PageHeader title="Gestión de Mantenimiento" subtitle="Control preventivo y correctivo">
        <Btn variant={showForm ? 'ghost' : 'primary'} onClick={() => { cerrarFormulario(); setShowForm(!showForm) }}>
          {showForm ? 'Volver al panel' : '+ Registrar mantenimiento'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {formularios.map((f, index) => {
            const esEsclavo = index > 0
            const vehiculosFiltrados = f.tipo_vehiculo ? vehiculos.filter(v => v.tipo === f.tipo_vehiculo) : vehiculos
            const procedimientosAgrupados = (f.tipo_vehiculo && f.tipo) ? agruparProcedimientos(f.tipo_vehiculo, f.tipo) : null
            return (
              <Panel key={f.idRef} style={{ borderLeft: esEsclavo ? '4px solid var(--gold)' : 'none' }}>
                <PanelHeader title={editandoId ? 'Editar mantenimiento' : `Mantenimiento #${index + 1}`}>
                  {!editandoId && esEsclavo && (
                    <button type="button" onClick={() => removerFormulario(f.idRef)}
                      style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                      🗑️ Quitar
                    </button>
                  )}
                </PanelHeader>
                {!esEsclavo ? (
                  <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Filtrar Categoría</label>
                      <select value={f.tipo_vehiculo} onChange={e => { updateField(f.idRef, 'tipo_vehiculo', e.target.value); updateField(f.idRef, 'vehiculo_id', '') }}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                        <option value="">Mostrar todos los vehículos</option>
                        <option value="liviano">Livianos</option>
                        <option value="pesado">Pesados</option>
                        <option value="maquinaria">Maquinaria</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Vehículo *</label>
                      <select value={f.vehiculo_id} onChange={e => updateField(f.idRef, 'vehiculo_id', e.target.value)} required
                        disabled={f.tipo_vehiculo && vehiculosFiltrados.length === 0}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', opacity:(f.tipo_vehiculo && vehiculosFiltrados.length === 0) ? 0.5 : 1 }}>
                        <option value="">Seleccionar vehículo...</option>
                        {vehiculosFiltrados.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
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
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Kilometraje</label>
                      <input type="number" min="0" step="any" placeholder="Ej: 85000" value={f.km_programado}
                        onChange={e => updateField(f.idRef, 'km_programado', e.target.value)} onKeyDown={preventInvalidChars}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Costo Total ($)</label>
                      <input type="number" min="0" step="any" placeholder="0.00" value={f.costo}
                        onChange={e => updateField(f.idRef, 'costo', e.target.value)} onKeyDown={preventInvalidChars}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Procedimiento Específico *</label>
                      <select required value={f.descripcion} onChange={e => updateField(f.idRef, 'descripcion', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', opacity: f.vehiculo_id ? 1 : 0.5 }}>
                        <option value="">{f.vehiculo_id ? `-- Seleccione procedimiento ${f.tipo} --` : '-- Primero seleccione un vehículo --'}</option>
                        {procedimientosAgrupados && Object.entries(procedimientosAgrupados).map(([grupo, items]) => (
                          <optgroup key={grupo} label={`[ ${grupo.toUpperCase()} ]`}>
                            {items.map(item => <option key={item.id} value={item.descripcion}>{item.descripcion}</option>)}
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
                  <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, background:'rgba(255,255,255,0.01)' }}>
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
                      <input type="number" min="0" step="any" placeholder="0.00" value={f.costo}
                        onChange={e => updateField(f.idRef, 'costo', e.target.value)} onKeyDown={preventInvalidChars}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Procedimiento Específico *</label>
                      <select required value={f.descripcion} onChange={e => updateField(f.idRef, 'descripcion', e.target.value)}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none' }}>
                        <option value="">{`-- Seleccione procedimiento ${f.tipo} --`}</option>
                        {procedimientosAgrupados && Object.entries(procedimientosAgrupados).map(([grupo, items]) => (
                          <optgroup key={grupo} label={`[ ${grupo.toUpperCase()} ]`}>
                            {items.map(item => <option key={item.id} value={item.descripcion}>{item.descripcion}</option>)}
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
            <div onClick={agregarFormulario}
              style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)', transition:'all 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
              ➕ Añadir otro mantenimiento para este mismo vehículo
            </div>
          )}

          {error && <div style={{ color:'var(--red)', fontSize:13, background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8, fontWeight:500 }}>{error}</div>}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving}
              style={{ padding:'8px 20px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:13 }}>
              {saving ? 'Guardando...' : editandoId ? 'Actualizar' : `Guardar ${formularios.length} mantenimiento(s)`}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Vencidos',       value:mantsVencidos.length,    accent:'var(--red)',   data:mantsVencidos },
              { label:'Próximos 7 días',value:mantsProximos.length,    accent:'var(--amber)', data:mantsProximos },
              { label:'Total registros',value:mantenimientos.length,   accent:'var(--blue)',  data:mantenimientos },
              { label:'Completados',    value:mantsCompletados.length, accent:'var(--green)', data:mantsCompletados },
            ].map(k => (
              <div key={k.label}
                onClick={() => setDetalleActivo({ tipo:`Filtrado: ${k.label}`, data:k.data })}
                style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden', cursor:'pointer', transition:'transform 0.2s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accent, opacity:0.7 }} />
                <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.label}</div>
                <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono', color:k.label === 'Vencidos' && k.value > 0 ? 'var(--red)' : 'var(--text-1)' }}>{k.value}</div>
              </div>
            ))}
          </div>

          <Panel style={{ maxWidth:'100%', overflow:'hidden' }}>
            <PanelHeader title="Historial de mantenimientos">
              <input type="text" placeholder="Buscar..." value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'5px 12px', color:'var(--text-1)', fontSize:12, outline:'none', width:160, fontFamily:'DM Sans' }}
              />
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {['todos','programado','en_proceso','completado','vencido'].map(e => (
                  <Chip key={e} active={filtro === e} onClick={() => setFiltro(e)}>
                    {e === 'todos' ? 'Todos' : e.replace('_',' ')}
                  </Chip>
                ))}
              </div>
            </PanelHeader>

            {loading ? <LoadingSpinner /> : mantenimientosFiltrados.length === 0 ? <EmptyState message="Sin registros de mantenimiento" /> : (
              <>
                <div className="table-responsive-container" style={{ width:'100%', overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:8 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'1050px' }}>
                    <thead>
                      <tr>
                        {['Placa/Vehículo','Tipo','Descripción','Fecha Programada','Costo','Estado','Acciones'].map(h => (
                          <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', background:'var(--panel2)', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mantenimientosPagina.map(m => (
                        <tr key={m.id}
                          onClick={() => setDetalleActivo({ tipo:'Ficha de Intervención', data:m })}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--panel2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ cursor:'pointer', transition:'background 0.15s' }}>
                          <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            <div style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700 }}>
                              {m.vehiculo?.placa || `V-${m.vehiculo_id}`}
                            </div>
                            {m.vehiculo?.marca && <div style={{ fontSize:10, color:'var(--text-3)' }}>{m.vehiculo.marca} {m.vehiculo.modelo}</div>}
                          </td>
                          <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}><StatusPill status={m.tipo} /></td>
                          <td style={{ padding:'13px 20px', fontSize:13, borderBottom:'1px solid var(--border-soft)', maxWidth:'250px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={m.descripcion}>
                            {m.descripcion}
                          </td>
                          <td style={{ padding:'13px 20px', fontSize:11, fontFamily:'Space Mono', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            {m.fecha_programada ? new Date(m.fecha_programada).toLocaleDateString('es-EC') : '—'}
                          </td>
                          <td style={{ padding:'13px 20px', fontSize:12, fontFamily:'Space Mono', color:'var(--green)', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            {m.costo ? `$${m.costo.toFixed(2)}` : '—'}
                          </td>
                          <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}><StatusPill status={m.estado} /></td>
                          <td style={{ padding:'13px 20px', borderBottom:'1px solid var(--border-soft)', whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                              {m.estado !== 'completado' && m.estado !== 'en_proceso' && (
                                <button onClick={e => { e.stopPropagation(); iniciar(m.id) }}
                                  style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(240,167,66,0.1)', color:'var(--amber)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Iniciar trabajo">▶️</button>
                              )}
                              {m.estado !== 'completado' && (
                                <button onClick={e => { e.stopPropagation(); completar(m.id) }}
                                  style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(61,200,122,0.1)', color:'var(--green)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Marcar completado">✓</button>
                              )}
                              <button onClick={e => { e.stopPropagation(); cargarDatosEdicion(m) }}
                                style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">✏️</button>
                              <button onClick={e => { e.stopPropagation(); eliminarMantenimiento(m.id, m.descripcion) }}
                                style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">🗑️</button>
                            </div>
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
            style={{ width:'100%', maxWidth:Array.isArray(detalleActivo.data) ? '800px' : '550px', background:'var(--panel)', borderRadius:16, padding:'30px', border:'1px solid var(--border-soft)', boxShadow:'0 20px 50px rgba(0,0,0,0.5)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:15, borderBottom:'1px solid var(--border-soft)' }}>
              <h2 style={{ margin:0, color:'var(--gold-light)', fontSize:18 }}>{detalleActivo.tipo}</h2>
              <button onClick={() => setDetalleActivo(null)} style={{ background:'transparent', border:'none', color:'var(--text-3)', fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ color:'var(--text-2)' }}>
              {Array.isArray(detalleActivo.data) ? (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', minWidth:'600px', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ textAlign:'left', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)' }}>
                        <th style={{ padding:10 }}>Fecha Prog.</th>
                        <th style={{ padding:10 }}>Unidad</th>
                        <th style={{ padding:10 }}>Trabajo</th>
                        <th style={{ padding:10 }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleActivo.data.length === 0
                        ? <tr><td colSpan="4" style={{ padding:20, textAlign:'center' }}>No hay registros en esta categoría</td></tr>
                        : detalleActivo.data.map((m, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid var(--border-soft)' }}>
                            <td style={{ padding:'12px 10px', fontFamily:'Space Mono', fontSize:11, color:m.estado === 'vencido' ? 'var(--red)' : 'var(--text-2)' }}>
                              {m.fecha_programada ? new Date(m.fecha_programada).toLocaleDateString('es-EC') : 'Sin fecha'}
                            </td>
                            <td style={{ padding:'12px 10px' }}>
                              <div style={{ color:'#fff', fontWeight:600, fontFamily:'Space Mono' }}>{m.vehiculo?.placa}</div>
                              <div style={{ fontSize:10, color:'var(--text-3)' }}>{m.vehiculo?.marca}</div>
                            </td>
                            <td style={{ padding:'12px 10px', maxWidth:'200px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={m.descripcion}>
                              {m.descripcion}
                            </td>
                            <td style={{ padding:'12px 10px' }}><StatusPill status={m.estado} /></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                    <div>
                      <div style={{ fontSize:24, fontWeight:'bold', color:'#fff', fontFamily:'Space Mono' }}>{detalleActivo.data.vehiculo?.placa || 'Vehículo'}</div>
                      <div style={{ fontSize:14, color:'var(--gold-light)' }}>{detalleActivo.data.vehiculo?.marca} {detalleActivo.data.vehiculo?.modelo}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                      <StatusPill status={detalleActivo.data.estado} />
                      <StatusPill status={detalleActivo.data.tipo} />
                    </div>
                  </div>
                  <div style={{ background:'var(--panel2)', padding:'18px', borderRadius:8, border:'1px solid var(--border-soft)', marginBottom:20 }}>
                    <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Procedimiento a realizar</div>
                    <div style={{ fontSize:16, fontWeight:600, color:'#fff', marginTop:5, lineHeight:1.4 }}>{detalleActivo.data.descripcion}</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:15, marginBottom:20 }}>
                    <div style={{ background:'var(--panel2)', padding:'15px', borderRadius:8, border:'1px solid var(--border-soft)' }}>
                      <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase' }}>Programado para</div>
                      <div style={{ fontSize:15, fontWeight:600, color:detalleActivo.data.estado === 'vencido' ? 'var(--red)' : '#fff', marginTop:5, fontFamily:'Space Mono' }}>
                        {detalleActivo.data.fecha_programada ? new Date(detalleActivo.data.fecha_programada).toLocaleDateString('es-EC') : 'Por definir'}
                      </div>
                    </div>
                    <div style={{ background:'var(--panel2)', padding:'15px', borderRadius:8, border:'1px solid var(--border-soft)' }}>
                      <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase' }}>Kilometraje Ref.</div>
                      <div style={{ fontSize:15, fontWeight:600, color:'#fff', marginTop:5, fontFamily:'Space Mono' }}>
                        {detalleActivo.data.km_programado ? detalleActivo.data.km_programado.toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, fontSize:13, color:'var(--text-2)', padding:'15px', background:'var(--panel2)', borderRadius:8 }}>
                    <div><strong style={{ color:'#fff' }}>Taller Encargado:</strong><span style={{ float:'right' }}>{detalleActivo.data.taller || 'Taller Central SOMILOR'}</span></div>
                    <div><strong style={{ color:'#fff' }}>Inversión Estimada/Real:</strong><span style={{ float:'right', fontFamily:'Space Mono', color:'var(--green)', fontWeight:600 }}>{detalleActivo.data.costo ? `$${detalleActivo.data.costo.toFixed(2)}` : 'Pendiente'}</span></div>
                    {detalleActivo.data.observaciones && (
                      <div style={{ marginTop:5, paddingTop:10, borderTop:'1px solid var(--border-soft)' }}>
                        <strong style={{ color:'#fff', display:'block', marginBottom:5 }}>Observaciones:</strong>
                        <div style={{ background:'rgba(0,0,0,0.2)', padding:10, borderRadius:6, fontStyle:'italic' }}>{detalleActivo.data.observaciones}</div>
                      </div>
                    )}
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
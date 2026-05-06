import { useEffect, useState, useMemo } from 'react'
import { generacionAPI, personalAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState, Chip } from '../components/layout/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const idUnico = () => Math.random().toString(36).substr(2, 9)

const getLocalNow = () =>
  new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

const estadoInicial = { generador_id: '', personal_id: '', fecha: '', galones: '', observaciones: '' }

const preventInvalidChars = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
}

const PERIODOS = [
  { id: 'hoy',    label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes',    label: 'Este mes' },
  { id: 'ano',    label: 'Este año' },
  { id: 'todo',   label: 'Histórico' },
]

const PERIODOS_GRAFICA = [
  { id: 'dias',    label: 'Días' },
  { id: 'semanas', label: 'Semanas' },
  { id: 'meses',   label: 'Meses' },
  { id: 'anos',    label: 'Años' },
]

const REGISTROS_POR_PAGINA = 15

function getFechaInicio(periodo) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  switch (periodo) {
    case 'hoy':    return d
    case 'semana': {
      const day  = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(new Date(d).setDate(diff))
    }
    case 'mes':  return new Date(d.getFullYear(), d.getMonth(), 1)
    case 'ano':  return new Date(d.getFullYear(), 0, 1)
    default:     return new Date(0)
  }
}

function getLabelPeriodo(periodo) {
  return PERIODOS.find(p => p.id === periodo)?.label || 'Histórico'
}

export default function GeneracionPage() {
  const [consumos, setConsumos]           = useState([])
  const [generadores, setGeneradores]     = useState([])
  const [personal, setPersonal]           = useState([])
  const [precios, setPrecios]             = useState([])
  const [loading, setLoading]             = useState(true)

  const [periodoActivo, setPeriodoActivo]     = useState('mes')
  const [periodoGrafica, setPeriodoGrafica]   = useState('dias')

  const [showForm, setShowForm]           = useState(false)
  const [showPrecioForm, setShowPrecioForm] = useState(false)
  const [editandoId, setEditandoId]       = useState(null)
  const [formularios, setFormularios]     = useState([{ idRef: idUnico(), ...estadoInicial, fecha: getLocalNow() }])
  const [precioForm, setPrecioForm]       = useState({ precio_galon: '', fecha_inicio: getLocalNow(), observaciones: '' })

  const [saving, setSaving]               = useState(false)
  const [savingPrecio, setSavingPrecio]   = useState(false)
  const [error, setError]                 = useState('')
  const [errorPrecio, setErrorPrecio]     = useState('')
  const [detalleActivo, setDetalleActivo] = useState(null)

  const [pagina, setPagina]               = useState(1)

  const cargar = () => {
    setLoading(true)
    Promise.all([
      generacionAPI.listConsumos({ limit: 500 }),
      generacionAPI.listGeneradores(),
      personalAPI.list(),
      generacionAPI.listPrecios(),
    ]).then(([c, g, p, pr]) => {
      setConsumos(c.data)
      setGeneradores(g.data)
      setPersonal(p.data)
      setPrecios(pr.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  // Resetear página al cambiar filtro
  useEffect(() => { setPagina(1) }, [periodoActivo])

  // ── Consumos filtrados por período principal ──────────
  const consumosFiltrados = useMemo(() => {
    const desde = getFechaInicio(periodoActivo)
    return consumos.filter(c => new Date(c.fecha) >= desde)
  }, [consumos, periodoActivo])

  const totalGalones = useMemo(() =>
    consumosFiltrados.reduce((acc, c) => acc + (c.galones || 0), 0),
  [consumosFiltrados])

  const totalCosto = useMemo(() =>
    consumosFiltrados.reduce((acc, c) => acc + (c.costo_calculado || 0), 0),
  [consumosFiltrados])

  // ── Paginación del historial ──────────────────────────
  const totalPaginas  = Math.max(1, Math.ceil(consumosFiltrados.length / REGISTROS_POR_PAGINA))
  const consumosPagina = consumosFiltrados.slice(
    (pagina - 1) * REGISTROS_POR_PAGINA,
    pagina * REGISTROS_POR_PAGINA
  )

  // ── Gráfica por generador (reactiva al período) ───────
  const chartPorGenerador = useMemo(() =>
    generadores.map(g => ({
      nombre:  g.nombre.replace('CUMMINS', 'CUM').replace('WEICHAI', 'WEI'),
      galones: parseFloat(
        consumosFiltrados
          .filter(c => c.generador_id === g.id)
          .reduce((acc, c) => acc + (c.galones || 0), 0)
          .toFixed(2)
      ),
      generador_id: g.id,
    })),
  [consumosFiltrados, generadores])

  // ── Gráfica temporal con su propio filtro ─────────────
  const chartTemporal = useMemo(() => {
    const hoy   = new Date()
    const datos = {}

    const fmt = (fecha) => {
      switch (periodoGrafica) {
        case 'dias': {
          return fecha.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit' })
        }
        case 'semanas': {
          const inicio = new Date(fecha)
          const dia    = inicio.getDay()
          const diff   = inicio.getDate() - dia + (dia === 0 ? -6 : 1)
          inicio.setDate(diff)
          return `Sem ${inicio.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit' })}`
        }
        case 'meses': {
          return fecha.toLocaleDateString('es-EC', { month: 'short', year: '2-digit' })
        }
        case 'anos': {
          return fecha.getFullYear().toString()
        }
        default: return ''
      }
    }

    const desde = (() => {
      switch (periodoGrafica) {
        case 'dias':    { const d = new Date(hoy); d.setDate(d.getDate() - 29); return d }
        case 'semanas': { const d = new Date(hoy); d.setDate(d.getDate() - 83); return d }
        case 'meses':   { const d = new Date(hoy); d.setMonth(d.getMonth() - 11); return d }
        case 'anos':    return new Date(0)
        default:        return new Date(0)
      }
    })()

    consumos
      .filter(c => new Date(c.fecha) >= desde)
      .forEach(c => {
        const clave = fmt(new Date(c.fecha))
        datos[clave] = (datos[clave] || 0) + (c.galones || 0)
      })

    return Object.entries(datos)
      .map(([label, galones]) => ({ label, galones: parseFloat(galones.toFixed(2)) }))
  }, [consumos, periodoGrafica])

  // ── Estado de generadores reactivo al período ─────────
  const estadoGeneradores = useMemo(() =>
    generadores.map(g => {
      const galones = consumosFiltrados
        .filter(c => c.generador_id === g.id)
        .reduce((acc, c) => acc + (c.galones || 0), 0)
      const precioVigente = precios[0]?.precio_galon || null
      return {
        ...g,
        galones_periodo: parseFloat(galones.toFixed(2)),
        costo_periodo:   precioVigente ? parseFloat((galones * precioVigente).toFixed(2)) : null,
      }
    }),
  [consumosFiltrados, generadores, precios])

  // ── Formulario consumo ────────────────────────────────
  const updateField = (idRef, field, value) => {
    setFormularios(prev => prev.map(f => f.idRef === idRef ? { ...f, [field]: value } : f))
  }

  const agregarFormulario = () => {
    setFormularios(prev => [...prev, { idRef: idUnico(), ...estadoInicial, fecha: getLocalNow() }])
  }

  const removerFormulario = (idRef) => {
    setFormularios(prev => prev.filter(f => f.idRef !== idRef))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    for (const f of formularios) {
      if (!f.galones || parseFloat(f.galones) <= 0) {
        setError('Los galones deben ser un valor mayor a 0.')
        setSaving(false)
        return
      }
    }
    try {
      if (editandoId) {
        const f = formularios[0]
        await generacionAPI.updateConsumo(editandoId, {
          generador_id:  parseInt(f.generador_id),
          personal_id:   f.personal_id ? parseInt(f.personal_id) : null,
          fecha:         new Date(f.fecha).toISOString(),
          galones:       parseFloat(f.galones),
          observaciones: f.observaciones || null,
        })
      } else {
        await Promise.all(formularios.map(f => generacionAPI.createConsumo({
          generador_id:  parseInt(f.generador_id),
          personal_id:   f.personal_id ? parseInt(f.personal_id) : null,
          fecha:         new Date(f.fecha).toISOString(),
          galones:       parseFloat(f.galones),
          observaciones: f.observaciones || null,
        })))
      }
      cerrarFormulario()
      cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const cargarDatosEdicion = (c) => {
    setEditandoId(c.id)
    setFormularios([{
      idRef:         idUnico(),
      generador_id:  c.generador_id || '',
      personal_id:   c.personal_id  || '',
      fecha:         c.fecha
        ? new Date(new Date(c.fecha).getTime() - new Date(c.fecha).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        : getLocalNow(),
      galones:       c.galones       || '',
      observaciones: c.observaciones || '',
    }])
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cerrarFormulario = () => {
    setShowForm(false)
    setEditandoId(null)
    setFormularios([{ idRef: idUnico(), ...estadoInicial, fecha: getLocalNow() }])
    setError('')
  }

  const eliminarConsumo = async (id) => {
    if (window.confirm('¿Eliminar este registro de consumo?')) {
      try { await generacionAPI.deleteConsumo(id); cargar() }
      catch { alert('Error al eliminar') }
    }
  }

  // ── Formulario precio ─────────────────────────────────
  const handleSubmitPrecio = async (e) => {
    e.preventDefault()
    setSavingPrecio(true)
    setErrorPrecio('')
    if (!precioForm.precio_galon || parseFloat(precioForm.precio_galon) <= 0) {
      setErrorPrecio('El precio debe ser mayor a 0.')
      setSavingPrecio(false)
      return
    }
    try {
      await generacionAPI.createPrecio({
        precio_galon:  parseFloat(precioForm.precio_galon),
        fecha_inicio:  new Date(precioForm.fecha_inicio).toISOString(),
        observaciones: precioForm.observaciones || null,
      })
      setShowPrecioForm(false)
      setPrecioForm({ precio_galon: '', fecha_inicio: getLocalNow(), observaciones: '' })
      cargar()
    } catch (err) {
      setErrorPrecio(err.response?.data?.detail || 'Error al guardar precio')
    } finally {
      setSavingPrecio(false)
    }
  }

  const eliminarPrecio = async (id) => {
    if (window.confirm('¿Eliminar este precio?')) {
      try { await generacionAPI.deletePrecio(id); cargar() }
      catch { alert('Error al eliminar precio') }
    }
  }

  const precioVigente = precios[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0, width: '100%', position: 'relative' }}>
      <PageHeader title="Control de Generación" subtitle="Consumo de diesel por generador">
        <Btn variant="ghost" onClick={() => setDetalleActivo({ tipo: 'Precio del diesel', data: precios })}>
          ⛽ {precioVigente ? `$${precioVigente.precio_galon.toFixed(2)}/gal` : 'Sin precio'}
        </Btn>
        <Btn variant={showForm ? 'ghost' : 'primary'} onClick={() => { cerrarFormulario(); setShowForm(!showForm) }}>
          {showForm ? 'Volver al panel' : '+ Registrar consumo'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formularios.map((f, index) => (
            <Panel key={f.idRef}>
              <PanelHeader title={editandoId ? 'Editar consumo' : `Registro #${index + 1}`}>
                {!editandoId && formularios.length > 1 && (
                  <button type="button" onClick={() => removerFormulario(f.idRef)}
                    style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: 'rgba(224,82,82,0.1)', color: 'var(--red)', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'DM Sans' }}>
                    🗑️ Quitar
                  </button>
                )}
              </PanelHeader>
              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Generador *</label>
                  <select value={f.generador_id} onChange={e => updateField(f.idRef, 'generador_id', e.target.value)} required
                    style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-1)', fontSize: 13, outline: 'none', fontFamily: 'DM Sans' }}>
                    <option value="">Seleccionar generador...</option>
                    {generadores.map(g => (
                      <option key={g.id} value={g.id}>{g.nombre} — {g.ubicacion}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Responsable</label>
                  <select value={f.personal_id} onChange={e => updateField(f.idRef, 'personal_id', e.target.value)}
                    style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-1)', fontSize: 13, outline: 'none', fontFamily: 'DM Sans' }}>
                    <option value="">Sin responsable</option>
                    {personal.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Fecha y hora *</label>
                  <input type="datetime-local" value={f.fecha}
                    onChange={e => updateField(f.idRef, 'fecha', e.target.value)} required
                    style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-1)', fontSize: 13, outline: 'none', fontFamily: 'DM Sans' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--gold)', display: 'block', marginBottom: 6, fontWeight: 700 }}>Galones consumidos *</label>
                  <input type="number" min="0.01" step="any" placeholder="Ej: 120.5"
                    value={f.galones} onChange={e => updateField(f.idRef, 'galones', e.target.value)}
                    onKeyDown={preventInvalidChars} required
                    style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--gold-dim)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-1)', fontSize: 13, outline: 'none' }} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Observaciones</label>
                  <textarea placeholder="Ej: Informe semanal semana 22..." value={f.observaciones}
                    onChange={e => updateField(f.idRef, 'observaciones', e.target.value)} rows={2}
                    style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-1)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'DM Sans' }} />
                </div>
              </div>
            </Panel>
          ))}

          {!editandoId && (
            <div onClick={agregarFormulario}
              style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer', color: 'var(--gold-dim)', fontWeight: 600, fontSize: 14, background: 'rgba(200,168,75,0.03)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
              ➕ Agregar otro registro
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--red)', fontSize: 13, background: 'rgba(224,82,82,0.1)', padding: '12px 16px', borderRadius: 8, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving}
              style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--gold)', color: '#0E1117', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              {saving ? 'Guardando...' : editandoId ? 'Actualizar' : `Guardar ${formularios.length} registro(s)`}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Filtro de período principal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Período:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PERIODOS.map(opt => (
                <Chip key={opt.id} active={periodoActivo === opt.id} onClick={() => setPeriodoActivo(opt.id)}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* KPIs — solo 2, reactivos al período */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              {
                label:   `Galones — ${getLabelPeriodo(periodoActivo)}`,
                value:   `${totalGalones.toFixed(2)} gal`,
                accent:  'var(--gold)',
                data:    consumosFiltrados,
              },
              {
                label:   `Costo — ${getLabelPeriodo(periodoActivo)}`,
                value:   `$${totalCosto.toFixed(2)}`,
                accent:  'var(--green)',
                data:    consumosFiltrados,
              },
            ].map(k => (
              <div key={k.label}
                onClick={() => setDetalleActivo({ tipo: k.label, data: k.data })}
                style={{ background: 'var(--panel)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '18px 20px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: k.accent, opacity: 0.7 }} />
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'Space Mono' }}>{loading ? '...' : k.value}</div>
              </div>
            ))}
          </div>

          {/* Gráficas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

            {/* Gráfica por generador — reactiva al período principal */}
            <Panel>
              <PanelHeader title={`Por generador — ${getLabelPeriodo(periodoActivo)}`} />
              <div style={{ padding: '20px 20px 10px' }}>
                {chartPorGenerador.every(g => g.galones === 0) ? (
                  <EmptyState message="Sin consumos en este período" />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartPorGenerador} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      onClick={state => {
                        if (state?.activePayload) {
                          const item  = state.activePayload[0].payload
                          const gen   = generadores.find(g => g.id === item.generador_id)
                          if (gen) setDetalleActivo({
                            tipo: `Consumos — ${gen.nombre}`,
                            data: consumosFiltrados.filter(c => c.generador_id === gen.id),
                          })
                        }
                      }}>
                      <XAxis dataKey="nombre" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}g`} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ background: 'var(--panel2)', border: '1px solid var(--border-soft)', borderRadius: 8, fontSize: 12 }}
                        formatter={value => [`${value} gal`, 'Consumo']} />
                      <Bar dataKey="galones" radius={[4, 4, 0, 0]} cursor="pointer">
                        {chartPorGenerador.map((_, i) => (
                          <Cell key={i} fill={i % 2 === 0 ? 'var(--gold)' : 'rgba(200,168,75,0.45)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>

            {/* Gráfica temporal — filtro propio */}
            <Panel>
              <PanelHeader title="Evolución temporal">
                <div style={{ display: 'flex', gap: 6 }}>
                  {PERIODOS_GRAFICA.map(opt => (
                    <Chip key={opt.id} active={periodoGrafica === opt.id} onClick={() => setPeriodoGrafica(opt.id)}>
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </PanelHeader>
              <div style={{ padding: '20px 20px 10px' }}>
                {chartTemporal.length === 0 ? (
                  <EmptyState message="Sin datos" />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartTemporal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}g`} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ background: 'var(--panel2)', border: '1px solid var(--border-soft)', borderRadius: 8, fontSize: 12 }}
                        formatter={value => [`${value} gal`, 'Galones']} />
                      <Bar dataKey="galones" radius={[4, 4, 0, 0]}>
                        {chartTemporal.map((_, i) => (
                          <Cell key={i} fill={i === chartTemporal.length - 1 ? 'var(--gold)' : 'rgba(200,168,75,0.35)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>
          </div>

          {/* Estado de generadores — reactivo al período principal */}
          <Panel>
            <PanelHeader title={`Estado de generadores — ${getLabelPeriodo(periodoActivo)}`} />
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {estadoGeneradores.map(g => (
                <div key={g.id}
                  onClick={() => setDetalleActivo({
                    tipo: `Consumos — ${g.nombre}`,
                    data: consumosFiltrados.filter(c => c.generador_id === g.id),
                  })}
                  style={{ background: 'var(--panel2)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'transform 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-light)', marginBottom: 4 }}>{g.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>{g.ubicacion}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'Space Mono' }}>
                    {g.galones_periodo} <span style={{ fontSize: 11, color: 'var(--text-3)' }}>gal</span>
                  </div>
                  {g.costo_periodo !== null && (
                    <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>${g.costo_periodo.toFixed(2)}</div>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          {/* Historial paginado */}
          <Panel style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <PanelHeader title={`Historial — ${getLabelPeriodo(periodoActivo)}`}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {consumosFiltrados.length} registros
              </span>
            </PanelHeader>
            {loading ? <LoadingSpinner /> : consumosFiltrados.length === 0 ? <EmptyState message="Sin registros en este período" /> : (
              <>
                <div className="table-responsive-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
                    <thead>
                      <tr>
                        {['Fecha', 'Generador', 'Ubicación', 'Responsable', 'Galones', 'Costo', 'Acciones'].map(h => (
                          <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)', background: 'var(--panel2)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {consumosPagina.map(c => (
                        <tr key={c.id}
                          onClick={() => setDetalleActivo({ tipo: 'Detalle de consumo', data: c })}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--panel2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ cursor: 'pointer', transition: 'background 0.15s' }}>
                          <td style={{ padding: '13px 20px', fontSize: 11, fontFamily: 'Space Mono', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                            {new Date(c.fecha).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 600, color: 'var(--gold-light)', borderBottom: '1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                            {c.generador?.nombre}
                          </td>
                          <td style={{ padding: '13px 20px', fontSize: 12, color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                            {c.generador?.ubicacion || '—'}
                          </td>
                          <td style={{ padding: '13px 20px', fontSize: 13, color: 'var(--text-2)', borderBottom: '1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                            {c.personal ? `${c.personal.nombre} ${c.personal.apellido}` : '—'}
                          </td>
                          <td style={{ padding: '13px 20px', fontSize: 14, fontWeight: 700, fontFamily: 'Space Mono', color: 'var(--gold-light)', borderBottom: '1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                            {c.galones.toFixed(2)} gal
                          </td>
                          <td style={{ padding: '13px 20px', fontSize: 13, fontFamily: 'Space Mono', color: 'var(--green)', borderBottom: '1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                            {c.costo_calculado !== null ? `$${c.costo_calculado.toFixed(2)}` : '—'}
                          </td>
                          <td style={{ padding: '13px 20px', borderBottom: '1px solid var(--border-soft)', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={e => { e.stopPropagation(); cargarDatosEdicion(c) }}
                                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(77,156,240,0.1)', color: 'var(--blue)', border: 'none', cursor: 'pointer' }}>✏️</button>
                              <button onClick={e => { e.stopPropagation(); eliminarConsumo(c.id) }}
                                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(224,82,82,0.1)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border-soft)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      Página {pagina} de {totalPaginas} · {consumosFiltrados.length} registros
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setPagina(1)} disabled={pagina === 1}
                        style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, background: 'var(--panel2)', border: '1px solid var(--border-soft)', color: pagina === 1 ? 'var(--text-3)' : 'var(--text-1)', cursor: pagina === 1 ? 'default' : 'pointer' }}>«</button>
                      <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                        style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, background: 'var(--panel2)', border: '1px solid var(--border-soft)', color: pagina === 1 ? 'var(--text-3)' : 'var(--text-1)', cursor: pagina === 1 ? 'default' : 'pointer' }}>‹</button>
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                        .filter(n => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1)
                        .reduce((acc, n, idx, arr) => {
                          if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...')
                          acc.push(n)
                          return acc
                        }, [])
                        .map((item, idx) =>
                          item === '...'
                            ? <span key={`e${idx}`} style={{ fontSize: 12, padding: '5px 4px', color: 'var(--text-3)' }}>…</span>
                            : <button key={item} onClick={() => setPagina(item)}
                                style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-soft)', cursor: 'pointer', background: pagina === item ? 'var(--gold)' : 'var(--panel2)', color: pagina === item ? '#0E1117' : 'var(--text-1)', fontWeight: pagina === item ? 700 : 400 }}>
                                {item}
                              </button>
                        )
                      }
                      <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                        style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, background: 'var(--panel2)', border: '1px solid var(--border-soft)', color: pagina === totalPaginas ? 'var(--text-3)' : 'var(--text-1)', cursor: pagina === totalPaginas ? 'default' : 'pointer' }}>›</button>
                      <button onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas}
                        style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, background: 'var(--panel2)', border: '1px solid var(--border-soft)', color: pagina === totalPaginas ? 'var(--text-3)' : 'var(--text-1)', cursor: pagina === totalPaginas ? 'default' : 'pointer' }}>»</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Panel>
        </>
      )}

      {/* Modal inteligente */}
      {detalleActivo && (
        <div onClick={() => setDetalleActivo(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10,12,17,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: detalleActivo.tipo === 'Precio del diesel' ? '550px' : Array.isArray(detalleActivo.data) ? '700px' : '480px', background: 'var(--panel)', borderRadius: 16, padding: 30, border: '1px solid var(--border-soft)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottom: '1px solid var(--border-soft)' }}>
              <h2 style={{ margin: 0, color: 'var(--gold-light)', fontSize: 18 }}>{detalleActivo.tipo}</h2>
              <button onClick={() => setDetalleActivo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            {/* Vista: gestión de precios */}
            {detalleActivo.tipo === 'Precio del diesel' && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  {!showPrecioForm ? (
                    <Btn variant="primary" onClick={() => setShowPrecioForm(true)}>+ Nuevo precio</Btn>
                  ) : (
                    <form onSubmit={handleSubmitPrecio} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, padding: 16, background: 'var(--panel2)', borderRadius: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Precio por galón ($) *</label>
                          <input type="number" min="0.01" step="any" placeholder="Ej: 1.25"
                            value={precioForm.precio_galon}
                            onChange={e => setPrecioForm(p => ({ ...p, precio_galon: e.target.value }))}
                            onKeyDown={preventInvalidChars} required
                            style={{ width: '100%', background: 'var(--panel)', border: '1px solid var(--gold-dim)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-1)', fontSize: 13, outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Vigente desde *</label>
                          <input type="datetime-local" value={precioForm.fecha_inicio}
                            onChange={e => setPrecioForm(p => ({ ...p, fecha_inicio: e.target.value }))} required
                            style={{ width: '100%', background: 'var(--panel)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-1)', fontSize: 13, outline: 'none' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Observaciones</label>
                        <input type="text" placeholder="Ej: Ajuste por incremento de precio"
                          value={precioForm.observaciones}
                          onChange={e => setPrecioForm(p => ({ ...p, observaciones: e.target.value }))}
                          style={{ width: '100%', background: 'var(--panel)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-1)', fontSize: 13, outline: 'none' }} />
                      </div>
                      {errorPrecio && (
                        <div style={{ color: 'var(--red)', fontSize: 12, background: 'rgba(224,82,82,0.1)', padding: '8px 12px', borderRadius: 6 }}>{errorPrecio}</div>
                      )}
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <Btn variant="ghost" onClick={() => { setShowPrecioForm(false); setErrorPrecio('') }} type="button">Cancelar</Btn>
                        <button type="submit" disabled={savingPrecio}
                          style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--gold)', color: '#0E1117', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                          {savingPrecio ? 'Guardando...' : 'Guardar precio'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)' }}>
                      <th style={{ padding: 10 }}>Vigente desde</th>
                      <th style={{ padding: 10 }}>Precio/gal</th>
                      <th style={{ padding: 10 }}>Observaciones</th>
                      <th style={{ padding: 10 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleActivo.data.length === 0
                      ? <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)' }}>Sin precios registrados</td></tr>
                      : detalleActivo.data.map((p, i) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '12px 10px', fontFamily: 'Space Mono', fontSize: 11 }}>
                            {new Date(p.fecha_inicio).toLocaleString('es-EC')}
                            {i === 0 && (
                              <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(61,200,122,0.15)', color: 'var(--green)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>vigente</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 10px', fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--gold-light)' }}>${p.precio_galon.toFixed(2)}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-3)', fontSize: 12 }}>{p.observaciones || '—'}</td>
                          <td style={{ padding: '12px 10px' }}>
                            {i !== 0 && (
                              <button onClick={() => eliminarPrecio(p.id)}
                                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(224,82,82,0.1)', color: 'var(--red)', border: 'none', cursor: 'pointer' }}>🗑️</button>
                            )}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}

            {/* Vista: lista de consumos */}
            {detalleActivo.tipo !== 'Precio del diesel' && Array.isArray(detalleActivo.data) && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)' }}>
                      <th style={{ padding: 10 }}>Fecha</th>
                      <th style={{ padding: 10 }}>Generador</th>
                      <th style={{ padding: 10 }}>Galones</th>
                      <th style={{ padding: 10 }}>Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleActivo.data.length === 0
                      ? <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)' }}>Sin registros</td></tr>
                      : detalleActivo.data.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '12px 10px', fontFamily: 'Space Mono', fontSize: 11 }}>
                            {new Date(c.fecha).toLocaleDateString('es-EC')}
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--gold-light)', fontWeight: 600 }}>
                            {c.generador?.nombre}
                          </td>
                          <td style={{ padding: '12px 10px', fontFamily: 'Space Mono' }}>{c.galones.toFixed(2)} gal</td>
                          <td style={{ padding: '12px 10px', color: 'var(--green)', fontFamily: 'Space Mono' }}>
                            {c.costo_calculado !== null ? `$${c.costo_calculado.toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}

            {/* Vista: detalle de un solo consumo */}
            {detalleActivo.tipo !== 'Precio del diesel' && !Array.isArray(detalleActivo.data) && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 25, paddingBottom: 20, borderBottom: '1px dashed var(--border-soft)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Galones consumidos</div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--gold-light)', fontFamily: 'Space Mono', margin: '10px 0' }}>
                    {detalleActivo.data.galones.toFixed(2)}
                    <span style={{ fontSize: 18, color: 'var(--text-3)', marginLeft: 8 }}>gal</span>
                  </div>
                  {detalleActivo.data.costo_calculado !== null && (
                    <div style={{ fontSize: 20, color: 'var(--green)', fontFamily: 'Space Mono' }}>
                      ${detalleActivo.data.costo_calculado.toFixed(2)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-2)', padding: 15, background: 'var(--panel2)', borderRadius: 8 }}>
                  <div><strong style={{ color: '#fff' }}>Generador:</strong><span style={{ float: 'right', color: 'var(--gold-light)', fontWeight: 600 }}>{detalleActivo.data.generador?.nombre}</span></div>
                  <div><strong style={{ color: '#fff' }}>Ubicación:</strong><span style={{ float: 'right' }}>{detalleActivo.data.generador?.ubicacion || '—'}</span></div>
                  <div><strong style={{ color: '#fff' }}>Fecha:</strong><span style={{ float: 'right', fontFamily: 'Space Mono', fontSize: 12 }}>{new Date(detalleActivo.data.fecha).toLocaleString('es-EC')}</span></div>
                  <div><strong style={{ color: '#fff' }}>Responsable:</strong><span style={{ float: 'right' }}>{detalleActivo.data.personal ? `${detalleActivo.data.personal.nombre} ${detalleActivo.data.personal.apellido}` : '—'}</span></div>
                  {detalleActivo.data.observaciones && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
                      <strong style={{ color: '#fff', display: 'block', marginBottom: 5 }}>Observaciones:</strong>
                      <div style={{ fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6 }}>
                        {detalleActivo.data.observaciones}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInModal { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
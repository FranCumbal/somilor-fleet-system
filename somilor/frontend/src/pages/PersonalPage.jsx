import { useEffect, useState } from 'react'
import { personalAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState } from '../components/layout/UI'

const idUnico = () => Math.random().toString(36).substr(2, 9)
const estadoInicial = { nombre:'', apellido:'', codigo_trabajador:'', cargo:'', area:'' }

export default function PersonalPage() {
  const [personal, setPersonal]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editandoId, setEditandoId]   = useState(null)
  const [formularios, setFormularios] = useState([{ idRef: idUnico(), ...estadoInicial }])
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [detalleActivo, setDetalleActivo] = useState(null)
  const [busqueda, setBusqueda]       = useState('')
  const [pagina, setPagina]           = useState(1)
  const POR_PAGINA                    = 15

  const cargar = () => {
    setLoading(true)
    personalAPI.list().then(r => setPersonal(r.data)).catch(() => {}).finally(() => setLoading(false))
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
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editandoId) {
        const payload = { ...formularios[0] }
        delete payload.idRef
        await personalAPI.update(editandoId, payload)
      } else {
        await Promise.all(formularios.map(f => {
          const payload = { ...f }
          delete payload.idRef
          return personalAPI.create(payload)
        }))
      }
      cerrarFormulario(); cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const cargarDatosEdicion = (p) => {
    setEditandoId(p.id)
    setFormularios([{
      idRef:             idUnico(),
      nombre:            p.nombre            || '',
      apellido:          p.apellido          || '',
      codigo_trabajador: p.codigo_trabajador || '',
      cargo:             p.cargo             || '',
      area:              p.area              || '',
    }])
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cerrarFormulario = () => {
    setShowForm(false); setEditandoId(null)
    setFormularios([{ idRef: idUnico(), ...estadoInicial }]); setError('')
  }

  const eliminarPersona = async (id, nombre, apellido) => {
    if (window.confirm(`¿Eliminar a ${nombre} ${apellido}?`)) {
      try { await personalAPI.delete(id); cargar() }
      catch { alert('Error al eliminar') }
    }
  }

  const iniciales = (p) => `${p.nombre[0]}${p.apellido[0]}`

  const personalFiltrado = personal.filter(p => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      (p.nombre            || '').toLowerCase().includes(q) ||
      (p.apellido          || '').toLowerCase().includes(q) ||
      (p.cargo             || '').toLowerCase().includes(q) ||
      (p.area              || '').toLowerCase().includes(q) ||
      (p.codigo_trabajador || '').toLowerCase().includes(q)
    )
  })

  const totalPaginas   = Math.max(1, Math.ceil(personalFiltrado.length / POR_PAGINA))
  const personalPagina = personalFiltrado.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const areas = [...new Set(personal.map(p => p.area).filter(Boolean))]
  const stats = { total: personal.length }

  const Paginacion = () => totalPaginas > 1 ? (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 4px', marginTop:8 }}>
      <span style={{ fontSize:12, color:'var(--text-3)' }}>
        Página {pagina} de {totalPaginas} · {personalFiltrado.length} personas
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
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth:0, width:'100%' }}>
      <PageHeader title="Directorio de Personal" subtitle={`${stats.total} personas registradas`}>
        {!showForm && (
          <input type="text" placeholder="Buscar..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'5px 12px', color:'var(--text-1)', fontSize:12, outline:'none', width:160, fontFamily:'DM Sans' }}
          />
        )}
        <Btn variant={showForm ? 'ghost' : 'primary'} onClick={() => { cerrarFormulario(); setShowForm(!showForm) }}>
          {showForm ? 'Volver al directorio' : '+ Nuevo registro'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {formularios.map((f, index) => (
            <Panel key={f.idRef}>
              <PanelHeader title={editandoId ? 'Editar persona' : `Persona #${index + 1}`}>
                {!editandoId && formularios.length > 1 && (
                  <button type="button" onClick={() => removerFormulario(f.idRef)}
                    style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                    🗑️ Quitar
                  </button>
                )}
              </PanelHeader>
              <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
                {[
                  { key:'nombre',            label:'Nombres *',          ph:'Ej: Juan Carlos' },
                  { key:'apellido',          label:'Apellidos *',         ph:'Ej: Pérez' },
                  { key:'codigo_trabajador', label:'Código de trabajo',   ph:'Ej: 1234' },
                  { key:'cargo',             label:'Cargo',               ph:'Ej: Operador de planta' },
                  { key:'area',              label:'Área',                ph:'Ej: Generación' },
                ].map(campo => (
                  <div key={campo.key}>
                    <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{campo.label}</label>
                    <input type="text" placeholder={campo.ph} value={f[campo.key]}
                      onChange={e => updateField(f.idRef, campo.key, e.target.value)}
                      required={campo.label.includes('*')}
                      style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}
                    />
                  </div>
                ))}
              </div>
            </Panel>
          ))}

          {!editandoId && (
            <div onClick={agregarFormulario}
              style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)', transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
              ➕ Agregar otra persona
            </div>
          )}

          {error && (
            <div style={{ color:'var(--red)', fontSize:13, background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8, fontWeight:500 }}>
              {error}
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving}
              style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
              {saving ? 'Guardando...' : editandoId ? 'Actualizar' : `Guardar ${formularios.length} persona(s)`}
            </button>
          </div>
        </form>
      ) : (
        loading ? <LoadingSpinner /> : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14 }}>
              <div onClick={() => setDetalleActivo({ tipo:'Todo el personal', data:personal })}
                style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden', cursor:'pointer', transition:'transform 0.2s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'var(--gold)', opacity:0.7 }} />
                <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Total personal</div>
                <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono' }}>{stats.total}</div>
              </div>
              {areas.map(area => {
                const data = personal.filter(p => p.area === area)
                return (
                  <div key={area} onClick={() => setDetalleActivo({ tipo:area, data })}
                    style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden', cursor:'pointer', transition:'transform 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'var(--blue)', opacity:0.7 }} />
                    <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{area}</div>
                    <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono' }}>{data.length}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
              {personalFiltrado.length === 0
                ? <EmptyState message="No hay personal registrado" />
                : personalPagina.map(p => (
                  <div key={p.id}
                    onClick={() => setDetalleActivo({ tipo:'Ficha de personal', data:p })}
                    style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'20px', cursor:'pointer', transition:'transform 0.15s, background 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.background='var(--panel2)' }}
                    onMouseOut={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.background='var(--panel)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(77,156,240,0.15)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Space Mono', fontSize:14, fontWeight:700, color:'var(--blue)', flexShrink:0 }}>
                        {iniciales(p)}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{p.nombre} {p.apellido}</div>
                        <div style={{ fontSize:11, color:'var(--text-3)' }}>{p.cargo || '—'}</div>
                      </div>
                    </div>
                    <div style={{ borderTop:'1px solid var(--border-soft)', paddingTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                      {[
                        { label:'Código de trabajo', val:p.codigo_trabajador || '—' },
                        { label:'Área',               val:p.area              || '—' },
                      ].map(row => (
                        <div key={row.label} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                          <span style={{ color:'var(--text-3)' }}>{row.label}</span>
                          <span style={{ color:'var(--text-2)', fontFamily:'Space Mono' }}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end', gap:8 }}>
                      <button onClick={e => { e.stopPropagation(); cargarDatosEdicion(p) }}
                        style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer' }}>✏️</button>
                      <button onClick={e => { e.stopPropagation(); eliminarPersona(p.id, p.nombre, p.apellido) }}
                        style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer' }}>🗑️</button>
                    </div>
                  </div>
                ))
              }
            </div>

            <Paginacion />
          </>
        )
      )}

      {detalleActivo && (
        <div onClick={() => setDetalleActivo(null)}
          style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(10,12,17,0.85)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, padding:20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:'100%', maxWidth:Array.isArray(detalleActivo.data) ? '600px' : '420px', background:'var(--panel)', borderRadius:16, padding:'30px', border:'1px solid var(--border-soft)', boxShadow:'0 20px 50px rgba(0,0,0,0.5)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:15, borderBottom:'1px solid var(--border-soft)' }}>
              <h2 style={{ margin:0, color:'var(--gold-light)', fontSize:18 }}>{detalleActivo.tipo}</h2>
              <button onClick={() => setDetalleActivo(null)} style={{ background:'transparent', border:'none', color:'var(--text-3)', fontSize:24, cursor:'pointer' }}>×</button>
            </div>

            {Array.isArray(detalleActivo.data) ? (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ textAlign:'left', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)' }}>
                    <th style={{ padding:10 }}>Nombre</th>
                    <th style={{ padding:10 }}>Cargo</th>
                    <th style={{ padding:10 }}>Área</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleActivo.data.length === 0
                    ? <tr><td colSpan="3" style={{ padding:20, textAlign:'center', color:'var(--text-3)' }}>Sin registros</td></tr>
                    : detalleActivo.data.map((p, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border-soft)' }}>
                        <td style={{ padding:'12px 10px', color:'#fff', fontWeight:600 }}>{p.nombre} {p.apellido}</td>
                        <td style={{ padding:'12px 10px' }}>{p.cargo || '—'}</td>
                        <td style={{ padding:'12px 10px', color:'var(--blue)' }}>{p.area || '—'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            ) : (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:15, marginBottom:25 }}>
                  <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(77,156,240,0.15)', border:'2px solid var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'var(--blue)', flexShrink:0 }}>
                    {iniciales(detalleActivo.data)}
                  </div>
                  <div>
                    <div style={{ fontSize:22, fontWeight:'bold', color:'#fff' }}>{detalleActivo.data.nombre} {detalleActivo.data.apellido}</div>
                    <div style={{ fontSize:13, color:'var(--text-3)', marginTop:4 }}>Registrado el {new Date(detalleActivo.data.creado_en).toLocaleDateString('es-EC')}</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:13, color:'var(--text-2)', padding:'15px', background:'var(--panel2)', borderRadius:8 }}>
                  <div><strong style={{ color:'#fff' }}>Código de trabajo:</strong><span style={{ float:'right', fontFamily:'Space Mono', color:'var(--gold-light)' }}>{detalleActivo.data.codigo_trabajador || 'No registrado'}</span></div>
                  <div><strong style={{ color:'#fff' }}>Cargo:</strong><span style={{ float:'right' }}>{detalleActivo.data.cargo || 'No registrado'}</span></div>
                  <div><strong style={{ color:'#fff' }}>Área:</strong><span style={{ float:'right', color:'var(--blue)' }}>{detalleActivo.data.area || 'No registrado'}</span></div>
                  <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border-soft)' }}>
                    <strong style={{ color:'#fff' }}>Estado:</strong>
                    <span style={{ float:'right', color:'var(--green)', fontWeight:600 }}>ACTIVO</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInModal { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  )
}
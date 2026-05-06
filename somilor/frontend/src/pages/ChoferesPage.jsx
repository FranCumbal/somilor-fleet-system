import { useEffect, useState } from 'react'
import { choferesAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState } from '../components/layout/UI'

const idUnico = () => Math.random().toString(36).substr(2, 9)
const estadoInicial = { nombre:'', apellido:'', cedula:'', codigo_trabajador:'', categoria_licencia:'', telefono:'' }
const CATEGORIAS_LICENCIA = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Otra']

export default function ChoferesPage() {
  const [choferes, setChoferes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  
  const [formularios, setFormularios] = useState([{ idRef: idUnico(), ...estadoInicial }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ESTADO PARA EL MODAL INTERACTIVO
  const [detalleActivo, setDetalleActivo] = useState(null)

  const cargar = () => {
    setLoading(true)
    choferesAPI.list().then(r => setChoferes(r.data)).catch(() => {}).finally(() => setLoading(false))
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
    
    // Validaciones estrictas antes de enviar al backend
    for (const f of formularios) {
      if (f.licencia && f.licencia.length !== 4) {
        setError(`El Código de Trabajo de ${f.nombre} debe tener exactamente 4 dígitos.`)
        setSaving(false)
        return
      }
      if (f.cedula && f.cedula.length < 10) {
        setError(`Verifica la cédula de ${f.nombre}, debe tener 10 dígitos.`)
        setSaving(false)
        return
      }
      if (f.codigo_trabajador && f.codigo_trabajador.length !== 4) {
        setError(`El Código de Trabajo de ${f.nombre} debe tener exactamente 4 dígitos.`)
        setSaving(false)
        return
}
    }

    try {
      if (editandoId) {
        const payload = { ...formularios[0] }
        delete payload.idRef
        await choferesAPI.update(editandoId, payload)
      } else {
        const promesas = formularios.map(f => {
          const payload = { ...f }
          delete payload.idRef
          return choferesAPI.create(payload)
        })
        await Promise.all(promesas)
      }
      cerrarFormulario()
      cargar()
    } catch (err) { setError(err.response?.data?.detail || 'Error al guardar. Verifica que las cédulas no estén repetidas.') }
    finally { setSaving(false) }
  }

  const cargarDatosEdicion = (c) => {
    setEditandoId(c.id)
    setFormularios([{
      idRef: idUnico(),
      nombre: c.nombre || '',
      apellido: c.apellido || '',
      cedula: c.cedula || '',
      licencia: c.licencia || '',
      categoria_licencia: c.categoria_licencia || '',
      telefono: c.telefono || ''
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

  const eliminarChofer = async (id, nombre, apellido) => {
    if (window.confirm(`¿Estás seguro de eliminar al chofer ${nombre} ${apellido}?`)) {
      try {
        await choferesAPI.delete(id)
        cargar()
      } catch (err) {
        alert('Error al eliminar el chofer')
      }
    }
  }

  const iniciales = (c) => `${c.nombre[0]}${c.apellido[0]}`

  // ESTADÍSTICAS PARA LOS KPIs SUPERIORES
  const stats = {
    total: choferes.length,
    tipoE: choferes.filter(c => c.categoria_licencia === 'E').length,
    tipoC: choferes.filter(c => c.categoria_licencia === 'C').length,
    otros: choferes.filter(c => c.categoria_licencia !== 'E' && c.categoria_licencia !== 'C').length
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth: 0, width: '100%', position: 'relative' }}>
      <PageHeader title="Directorio de Choferes" subtitle={`${stats.total} choferes registrados en la nómina`}>
        <Btn variant={showForm ? "ghost" : "primary"} onClick={() => { cerrarFormulario(); setShowForm(!showForm); }}>
          {showForm ? 'Volver al directorio' : '+ Nuevo chofer'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formularios.map((f, index) => (
            <Panel key={f.idRef}>
              <PanelHeader title={editandoId ? "Editar chofer" : `Chofer #${index + 1}`}>
                {!editandoId && formularios.length > 1 && (
                  <button type="button" onClick={() => removerFormulario(f.idRef)} style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                    🗑️ Quitar
                  </button>
                )}
              </PanelHeader>
              
              <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
                {[
                  { key:'nombre', label:'Nombres *', ph:'Ej: Carlos Andrés' },
                  { key:'apellido', label:'Apellidos *', ph:'Ej: Mendoza' },
                  { key:'cedula', label:'Número de Cédula *', ph:'Ej: 0912345678', isNumeric: true, maxLen: 10 },
                  { key:'codigo_trabajador', label:'Cód. de Trabajo * (4 dígitos)', ph:'Ej: 1234', isNumeric: true, maxLen: 4 },
                  { key:'categoria_licencia', label:'Categoría de Licencia', type:'select', options: CATEGORIAS_LICENCIA },
                  { key:'telefono', label:'Teléfono de Contacto', ph:'Ej: 0991234567', isNumeric: true, maxLen: 10 },
                ].map(campo => (
                  <div key={campo.key}>
                    <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{campo.label}</label>
                    {campo.type === 'select' ? (
                      <select 
                        value={f[campo.key]} 
                        onChange={e => updateField(f.idRef, campo.key, e.target.value)}
                        required={campo.label.includes('*')}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}
                      >
                        <option value="">Seleccione...</option>
                        {campo.options.map(opt => <option key={opt} value={opt}>Tipo {opt}</option>)}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        placeholder={campo.ph} 
                        value={f[campo.key]}
                        onChange={e => {
                          // MAGIA: Si es numérico, borra letras instantáneamente y recorta al tamaño máximo
                          if (campo.isNumeric) {
                            const valLimpio = e.target.value.replace(/\D/g, '').slice(0, campo.maxLen)
                            updateField(f.idRef, campo.key, valLimpio)
                          } else {
                            updateField(f.idRef, campo.key, e.target.value)
                          }
                        }}
                        required={campo.label.includes('*')}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          ))}

          {!editandoId && (
            <div onClick={agregarFormulario} style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)', transition:'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
              ➕ Agregar otro chofer a la lista
            </div>
          )}

          {error && <div style={{ color:'var(--red)', fontSize:13, background:'rgba(224,82,82,0.1)', padding:'12px 16px', borderRadius:8, fontWeight:500 }}>{error}</div>}
          
          <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
            <Btn variant="ghost" onClick={cerrarFormulario} type="button">Cancelar</Btn>
            <button type="submit" disabled={saving} style={{ padding:'10px 24px', borderRadius:8, background:'var(--gold)', color:'#0E1117', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
              {saving ? 'Guardando...' : (editandoId ? 'Actualizar chofer' : `Guardar ${formularios.length} chofer(es)`)}
            </button>
          </div>
        </form>
      ) : (
        loading ? <LoadingSpinner /> : (
          <>
            {/* INDICADORES INTERACTIVOS */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
              {[
                { label:'Total Choferes', value: stats.total, accent:'var(--gold)', data: choferes },
                { label:'Licencia Tipo E', value: stats.tipoE, accent:'var(--green)', data: choferes.filter(c => c.categoria_licencia === 'E') },
                { label:'Licencia Tipo C', value: stats.tipoC, accent:'var(--blue)', data: choferes.filter(c => c.categoria_licencia === 'C') },
                { label:'Otras Categorías', value: stats.otros, accent:'var(--amber)', data: choferes.filter(c => c.categoria_licencia !== 'E' && c.categoria_licencia !== 'C') },
              ].map(k => (
                <div key={k.label} 
                     onClick={() => setDetalleActivo({ tipo: k.label, data: k.data })}
                     style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                     onMouseOver={e => e.currentTarget.style.transform='translateY(-3px)'} 
                     onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accent, opacity:0.7 }} />
                  <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.label}</div>
                  <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono' }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* GRILLA DE TARJETAS DE CHOFERES */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
              {choferes.length === 0 ? <EmptyState message="No hay choferes registrados" /> : choferes.map(c => (
                <div key={c.id} 
                     onClick={() => setDetalleActivo({ tipo: 'Ficha del Chofer', data: c })}
                     style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'20px', cursor:'pointer', transition:'transform 0.15s, background 0.15s' }}
                     onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.background='var(--panel2)' }}
                     onMouseOut={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.background='var(--panel)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(200,168,75,0.15)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Space Mono', fontSize:14, fontWeight:700, color:'var(--gold-light)', flexShrink:0 }}>
                      {iniciales(c)}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{c.nombre} {c.apellido}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'Space Mono' }}>CI: {c.cedula}</div>
                    </div>
                  </div>
                  <div style={{ borderTop:'1px solid var(--border-soft)', paddingTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                    {[
                      { label:'Código de Trabajo', val: c.codigo_trabajador || '—' },
                      { label:'Categoría', val: c.categoria_licencia ? `Tipo ${c.categoria_licencia}` : '—' },
                      { label:'Teléfono', val: c.telefono || '—' },
                    ].map(row => (
                      <div key={row.label} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                        <span style={{ color:'var(--text-3)' }}>{row.label}</span>
                        <span style={{ color:'var(--text-2)', fontFamily:'Space Mono' }}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:500, color:'var(--green)', background:'rgba(61,200,122,0.1)' }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
                      Activo
                    </span>
                    
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={(e) => { e.stopPropagation(); cargarDatosEdicion(c); }} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); eliminarChofer(c.id, c.nombre, c.apellido); }} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* ========================================================= */}
      {/* MODAL INTELIGENTE (CHOFERES)             */}
      {/* ========================================================= */}
      {detalleActivo && (
        <div onClick={() => setDetalleActivo(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10, 12, 17, 0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeInModal 0.2s ease-out', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: Array.isArray(detalleActivo.data) ? '700px' : '450px', background: 'var(--panel)', borderRadius: 16, padding: '30px', border: '1px solid var(--border-soft)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottom: '1px solid var(--border-soft)' }}>
              <h2 style={{ margin: 0, color: 'var(--gold-light)', fontSize: 18 }}>{detalleActivo.tipo}</h2>
              <button onClick={() => setDetalleActivo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ color: 'var(--text-2)' }}>
              
              {/* VISTA 1: Lista filtrada desde los KPIs (Array) */}
              {Array.isArray(detalleActivo.data) && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '450px', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)' }}>
                        <th style={{ padding: '10px' }}>Chofer</th>
                        <th style={{ padding: '10px' }}>Categoría</th>
                        <th style={{ padding: '10px' }}>Contacto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleActivo.data.length === 0 ? <tr><td colSpan="3" style={{padding:20, textAlign:'center'}}>No hay choferes en esta categoría</td></tr> : null}
                      {detalleActivo.data.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{c.nombre} {c.apellido}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'Space Mono' }}>CI: {c.cedula}</div>
                          </td>
                          <td style={{ padding: '12px 10px', fontFamily: 'Space Mono', color: 'var(--gold-light)' }}>{c.categoria_licencia ? `Tipo ${c.categoria_licencia}` : 'S/E'}</td>
                          <td style={{ padding: '12px 10px', fontFamily: 'Space Mono' }}>{c.telefono || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA 2: Ficha Técnica (1 solo chofer) */}
              {!Array.isArray(detalleActivo.data) && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                    <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--panel2)', border:'2px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'var(--gold-light)', flexShrink:0 }}>
                      {iniciales(detalleActivo.data)}
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>{detalleActivo.data.nombre} {detalleActivo.data.apellido}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>ID: {detalleActivo.data.id} • Ingreso: {new Date(detalleActivo.data.creado_en).toLocaleDateString('es-EC')}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginBottom: 20 }}>
                    <div style={{ background: 'var(--panel2)', padding: '15px', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Documento de Identidad</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 5, fontFamily: 'Space Mono' }}>{detalleActivo.data.cedula}</div>
                    </div>
                    <div style={{ background: 'var(--panel2)', padding: '15px', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Licencia de Conducir</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 5, fontFamily: 'Space Mono' }}>{detalleActivo.data.categoria_licencia ? `Tipo ${detalleActivo.data.categoria_licencia}` : '—'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-2)', padding: '15px', background: 'var(--panel2)', borderRadius: 8 }}>
                    <div><strong style={{ color: '#fff' }}>Código de Trabajo:</strong> <span style={{ fontFamily: 'Space Mono', float: 'right', color: 'var(--gold-light)' }}>{detalleActivo.data.licencia || 'No registrado'}</span></div>
                    <div><strong style={{ color: '#fff' }}>Teléfono Móvil:</strong> <span style={{ fontFamily: 'Space Mono', float: 'right' }}>{detalleActivo.data.telefono || 'No registrado'}</span></div>
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
                      <strong style={{ color: '#fff' }}>Estado del Personal:</strong> 
                      <span style={{ float: 'right', color: 'var(--green)', fontWeight: 600 }}>ACTIVO Y AUTORIZADO</span>
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
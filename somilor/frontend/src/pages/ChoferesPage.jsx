import { useEffect, useState } from 'react'
import { choferesAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState } from '../components/layout/UI'

const idUnico = () => Math.random().toString(36).substr(2, 9)
const estadoInicial = { nombre:'', apellido:'', cedula:'', licencia:'', categoria_licencia:'', telefono:'' }

export default function ChoferesPage() {
  const [choferes, setChoferes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  
  const [formularios, setFormularios] = useState([{ idRef: idUnico(), ...estadoInicial }])
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <PageHeader title="Directorio de Choferes" subtitle={`${choferes.length} choferes registrados`}>
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
              <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                {[
                  { key:'nombre', label:'Nombre *', ph:'Carlos' },
                  { key:'apellido', label:'Apellido *', ph:'Mendoza' },
                  { key:'cedula', label:'Cédula *', ph:'0912345678' },
                  { key:'licencia', label:'Código de Trabajo', ph:'CT-00123' },
                  { key:'categoria_licencia', label:'Categoría', ph:'E' },
                  { key:'telefono', label:'Teléfono', ph:'0991234567' },
                ].map(campo => (
                  <div key={campo.key}>
                    <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{campo.label}</label>
                    <input placeholder={campo.ph} value={f[campo.key]}
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
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
            {choferes.length === 0 ? <EmptyState message="No hay choferes registrados" /> : choferes.map(c => (
              <div key={c.id} style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'20px' }}>
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
                    { label:'Código de Trabajo', val: c.licencia || '—' },
                    { label:'Categoría', val: c.categoria_licencia || '—' },
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
                    <button onClick={() => cargarDatosEdicion(c)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">✏️</button>
                    <button onClick={() => eliminarChofer(c.id, c.nombre, c.apellido)} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
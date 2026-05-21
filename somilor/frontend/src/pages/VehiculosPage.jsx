import { useEffect, useState } from 'react'
import { vehiculosAPI } from '../services/api'
import { Panel, PanelHeader, PageHeader, Btn, LoadingSpinner, EmptyState, StatusPill } from '../components/layout/UI'
import { generarPDF } from '../utils/exportPdf'

const idUnico = () => Math.random().toString(36).substr(2, 9)
// 1. Añadimos fecha_expiracion_matricula al estado inicial
const estadoInicial = { placa:'', marca:'', modelo:'', anio:'', color:'', tipo:'liviano', kilometraje_actual:'', fecha_expiracion_matricula:'' }
const TIPOS_VEHICULO = ['liviano', 'pesado', 'maquinaria']

export default function VehiculosPage() {
  const [vehiculos, setVehiculos]     = useState([])
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
    vehiculosAPI.list().then(r => setVehiculos(r.data)).catch(() => {}).finally(() => setLoading(false))
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
    for (const f of formularios) {
      if (!f.placa) {
        setError(`La placa o código es obligatoria.`)
        setSaving(false); return
      }
    }
    try {
      if (editandoId) {
        const payload = { ...formularios[0] }
        delete payload.idRef
        if(!payload.fecha_expiracion_matricula) payload.fecha_expiracion_matricula = null
        payload.kilometraje_actual = payload.kilometraje_actual ? parseFloat(payload.kilometraje_actual) : 0
        await vehiculosAPI.update(editandoId, payload)
      } else {
        const promesas = formularios.map(f => {
          const payload = { ...f }
          delete payload.idRef
          if(!payload.fecha_expiracion_matricula) payload.fecha_expiracion_matricula = null
          payload.kilometraje_actual = payload.kilometraje_actual ? parseFloat(payload.kilometraje_actual) : 0
          return vehiculosAPI.create(payload)
        })
        await Promise.all(promesas)
      }
      cerrarFormulario(); cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar. Verifica que las placas no estén repetidas.')
    } finally { setSaving(false) }
  }

  const cargarDatosEdicion = (v) => {
    setEditandoId(v.id)
    setFormularios([{
      idRef:                      idUnico(),
      placa:                      v.placa  || '',
      marca:                      v.marca  || '',
      modelo:                     v.modelo || '',
      anio:                       v.anio   || '',
      color:                      v.color  || '',
      tipo:                       v.tipo   || 'liviano',
      kilometraje_actual:         v.kilometraje_actual || '',
      fecha_expiracion_matricula: v.fecha_expiracion_matricula || '' 
    }])
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cerrarFormulario = () => {
    setShowForm(false); setEditandoId(null)
    setFormularios([{ idRef: idUnico(), ...estadoInicial }]); setError('')
  }

  const eliminarVehiculo = async (id, placa) => {
    if (window.confirm(`¿Estás seguro de eliminar el vehículo ${placa}?`)) {
      try { await vehiculosAPI.delete(id); cargar() }
      catch { alert('Error al eliminar el vehículo') }
    }
  }

  // 2. FUNCIÓN PARA MANEJAR LA SUBIDA DE FOTOS Y MATRÍCULAS
  const handleUploadDocumento = async (e, tipo, id) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await vehiculosAPI.uploadDocumento(id, tipo, file);
      setDetalleActivo({ ...detalleActivo, data: res.data });
      cargar();
    } catch (error) {
      alert("Error subiendo el archivo. Asegúrate de tener conexión.");
    }
  };

  const vehiculosFiltrados = vehiculos.filter(v => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      (v.placa  || '').toLowerCase().includes(q) ||
      (v.marca  || '').toLowerCase().includes(q) ||
      (v.modelo || '').toLowerCase().includes(q) ||
      (v.tipo   || '').toLowerCase().includes(q) ||
      (v.estado || '').toLowerCase().includes(q)
    )
  })

  const totalPaginas     = Math.max(1, Math.ceil(vehiculosFiltrados.length / POR_PAGINA))
  const vehiculosPagina  = vehiculosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const stats = {
    total: vehiculos.length,
    operativos: vehiculos.filter(v => v.estado === 'operativo').length,
    taller: vehiculos.filter(v => v.estado === 'taller').length,
    libres: vehiculos.filter(v => v.estado === 'libre').length
  }

  const Paginacion = () => totalPaginas > 1 ? (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 4px', marginTop:8 }}>
      <span style={{ fontSize:12, color:'var(--text-3)' }}>
        Página {pagina} de {totalPaginas} · {vehiculosFiltrados.length} unidades
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

  const handleExportarPDF = () => {
    const columnas = [
      { header: 'Placa/Código', dataKey: 'placa' },
      { header: 'Marca', dataKey: 'marca' },
      { header: 'Modelo', dataKey: 'modelo' },
      { header: 'Tipo', render: (fila) => fila.tipo ? fila.tipo.toUpperCase() : '—' },
      { header: 'Estado', render: (fila) => fila.estado ? fila.estado.toUpperCase() : '—' },
      { header: 'Kilometraje', render: (fila) => `${fila.kilometraje_actual || 0} km` }
    ];
    generarPDF('Inventario de Flota', columnas, vehiculosFiltrados, 'Flota_SOMILOR');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth:0, width:'100%', position:'relative' }}>
      {/* REEMPLAZA DESDE <PageHeader> HASTA </PageHeader> POR ESTO: */}
      <PageHeader title="Inventario de Flota" subtitle="Gestión de unidades y maquinaria">
        {!showForm && (
          <input type="text" placeholder="Buscar..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'5px 12px', color:'var(--text-1)', fontSize:12, outline:'none', width:160, fontFamily:'DM Sans' }}
          />
        )}
        
        {/* Nuevo botón de exportar */}
        {!showForm && (
          <Btn variant="ghost" onClick={handleExportarPDF} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            📄 Exportar PDF
          </Btn>
        )}

        <Btn variant={showForm ? 'ghost' : 'primary'} onClick={() => { cerrarFormulario(); setShowForm(!showForm) }}>
          {showForm ? 'Volver al inventario' : '+ Nuevo vehículo'}
        </Btn>
      </PageHeader>

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {formularios.map((f, index) => (
            <Panel key={f.idRef}>
              <PanelHeader title={editandoId ? 'Editar unidad' : `Unidad #${index + 1}`}>
                {!editandoId && formularios.length > 1 && (
                  <button type="button" onClick={() => removerFormulario(f.idRef)}
                    style={{ fontSize:12, padding:'4px 12px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans' }}>
                    🗑️ Quitar
                  </button>
                )}
              </PanelHeader>
              <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
                {[
                  { key:'placa',   label:'Placa / Código *', ph:'Ej: PCV-1234' },
                  { key:'marca',   label:'Marca',            ph:'Ej: Toyota' },
                  { key:'modelo',  label:'Modelo',           ph:'Ej: Hilux' },
                  { key:'anio',    label:'Año',              ph:'Ej: 2023', isNumeric:true, maxLen:4 },
                  { key:'color',   label:'Color',            ph:'Ej: Blanco' },
                  { key:'tipo',    label:'Tipo de Vehículo', type:'select', options:TIPOS_VEHICULO },
                  { key:'kilometraje_actual', label:'Uso Actual (Km/Hrs)', ph:'Ej: 15000', isNumeric:true },
                  { key:'fecha_expiracion_matricula', label:'Vencimiento Matrícula', type:'date' }, // 3. AÑADIDO
                ].map(campo => (
                  <div key={campo.key}>
                    <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>{campo.label}</label>
                    {campo.type === 'select' ? (
                      <select value={f[campo.key]} onChange={e => updateField(f.idRef, campo.key, e.target.value)}
                        required={campo.label.includes('*')}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans', textTransform:'capitalize' }}>
                        {campo.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : campo.type === 'date' ? (
                      <input type="date" value={f[campo.key] || ''}
                        onChange={e => updateField(f.idRef, campo.key, e.target.value)}
                        required={campo.label.includes('*')}
                        style={{ width:'100%', background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'9px 12px', color:'var(--text-1)', fontSize:13, outline:'none', fontFamily:'DM Sans' }}
                      />
                    ) : (
                      <input type="text" placeholder={campo.ph} value={f[campo.key]}
                        onChange={e => {
                          if (campo.isNumeric) {
                            const val = e.target.value.replace(/[^\d.]/g, '').slice(0, campo.maxLen || 20)
                            updateField(f.idRef, campo.key, val)
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
            <div onClick={agregarFormulario}
              style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', color:'var(--gold-dim)', fontWeight:600, fontSize:14, background:'rgba(200,168,75,0.03)', transition:'all 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,75,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,75,0.03)'}>
              ➕ Agregar otra unidad a la lista
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
              {saving ? 'Guardando...' : editandoId ? 'Actualizar unidad' : `Guardar ${formularios.length} unidad(es)`}
            </button>
          </div>
        </form>
      ) : (
        loading ? <LoadingSpinner /> : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
              {[
                { label:'Total Unidades',  value:stats.total,      accent:'var(--gold)',  data:vehiculos },
                { label:'Operativos',      value:stats.operativos, accent:'var(--green)', data:vehiculos.filter(v => v.estado === 'operativo') },
                { label:'Libres en Patio', value:stats.libres,     accent:'var(--blue)',  data:vehiculos.filter(v => v.estado === 'libre') },
                { label:'En Taller',       value:stats.taller,     accent:'var(--red)',   data:vehiculos.filter(v => v.estado === 'taller') },
              ].map(k => (
                <div key={k.label}
                  onClick={() => setDetalleActivo({ tipo:k.label, data:k.data })}
                  style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'18px 20px', position:'relative', overflow:'hidden', cursor:'pointer', transition:'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accent, opacity:0.7 }} />
                  <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.label}</div>
                  <div style={{ fontSize:28, fontWeight:600, fontFamily:'Space Mono' }}>{k.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
              {vehiculosFiltrados.length === 0
                ? <EmptyState message="No hay unidades registradas" />
                : vehiculosPagina.map(v => (
                  <div key={v.id}
                    onClick={() => setDetalleActivo({ tipo:'Ficha de la Unidad', data:v })}
                    style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius:12, padding:'20px', cursor:'pointer', transition:'transform 0.15s, background 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.background='var(--panel2)' }}
                    onMouseOut={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.background='var(--panel)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                      {/* 4. VISUALIZACIÓN DE FOTO DE VEHÍCULO */}
                      {v.foto_url ? (
                        <img src={`http://${window.location.hostname}:8000${v.foto_url}`} alt="Foto" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      ) : (
                        <div style={{ width:50, height:50, borderRadius:'8px', background:'rgba(200,168,75,0.15)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                          {v.tipo === 'maquinaria' ? '🚜' : '🚛'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, fontFamily:'Space Mono', color:'var(--gold-light)' }}>{v.placa}</div>
                        <div style={{ fontSize:11, color:'var(--text-3)' }}>{v.marca} {v.modelo}</div>
                      </div>
                    </div>
                    <div style={{ borderTop:'1px solid var(--border-soft)', paddingTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                      {[
                        { label:'Uso Registrado', val:`${v.kilometraje_actual || 0} ${v.tipo === 'maquinaria' ? 'hrs' : 'km'}` },
                        { label:'Categoría',      val:v.tipo, isCap:true },
                        { label:'Año',            val:v.anio || '—' },
                      ].map(row => (
                        <div key={row.label} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                          <span style={{ color:'var(--text-3)' }}>{row.label}</span>
                          <span style={{ color:'var(--text-2)', fontFamily:'Space Mono', textTransform: row.isCap ? 'capitalize' : 'none' }}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <StatusPill status={v.estado} />
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={e => { e.stopPropagation(); cargarDatosEdicion(v) }}
                          style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(77,156,240,0.1)', color:'var(--blue)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Editar">✏️</button>
                        <button onClick={e => { e.stopPropagation(); eliminarVehiculo(v.id, v.placa) }}
                          style={{ fontSize:11, padding:'4px 10px', borderRadius:6, background:'rgba(224,82,82,0.1)', color:'var(--red)', border:'none', cursor:'pointer', fontFamily:'DM Sans' }} title="Eliminar">🗑️</button>
                      </div>
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
          style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(10,12,17,0.85)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, animation:'fadeInModal 0.2s ease-out', padding:'20px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:'100%', maxWidth:Array.isArray(detalleActivo.data) ? '700px' : '450px', background:'var(--panel)', borderRadius:16, padding:'30px', border:'1px solid var(--border-soft)', boxShadow:'0 20px 50px rgba(0,0,0,0.5)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:15, borderBottom:'1px solid var(--border-soft)' }}>
              <h2 style={{ margin:0, color:'var(--gold-light)', fontSize:18 }}>{detalleActivo.tipo}</h2>
              <button onClick={() => setDetalleActivo(null)} style={{ background:'transparent', border:'none', color:'var(--text-3)', fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ color:'var(--text-2)' }}>
              {Array.isArray(detalleActivo.data) ? (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', minWidth:'450px', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ textAlign:'left', color:'var(--text-3)', borderBottom:'1px solid var(--border-soft)' }}>
                        <th style={{ padding:10 }}>Unidad</th>
                        <th style={{ padding:10 }}>Categoría</th>
                        <th style={{ padding:10 }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleActivo.data.length === 0
                        ? <tr><td colSpan="3" style={{ padding:20, textAlign:'center' }}>No hay unidades en esta categoría</td></tr>
                        : detalleActivo.data.map((v, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid var(--border-soft)' }}>
                            <td style={{ padding:'12px 10px' }}>
                              <div style={{ color:'#fff', fontWeight:600, fontFamily:'Space Mono' }}>{v.placa}</div>
                              <div style={{ fontSize:11, color:'var(--text-3)' }}>{v.marca} {v.modelo}</div>
                            </td>
                            <td style={{ padding:'12px 10px', textTransform:'capitalize' }}>{v.tipo}</td>
                            <td style={{ padding:'12px 10px' }}><StatusPill status={v.estado} /></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  {/* 5. MODAL DE FICHA INDIVIDUAL CON UPLOAD */}
                  <div style={{ display:'flex', alignItems:'center', gap:15, marginBottom:25 }}>
                    <div style={{ position: 'relative' }}>
                      {detalleActivo.data.foto_url ? (
                        <img src={`http://${window.location.hostname}:8000${detalleActivo.data.foto_url}`} alt="Foto" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--gold)' }} />
                      ) : (
                        <div style={{ width:70, height:70, borderRadius:'8px', background:'var(--panel2)', border:'2px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>
                          {detalleActivo.data.tipo === 'maquinaria' ? '🚜' : '🚛'}
                        </div>
                      )}
                      <label style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--panel3)', cursor: 'pointer', padding: '4px', borderRadius: '50%', border: '1px solid var(--border)', fontSize: 12 }} title="Cambiar foto">
                        📷
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleUploadDocumento(e, 'foto', detalleActivo.data.id)} />
                      </label>
                    </div>
                    <div>
                      <div style={{ fontSize:24, fontWeight:'bold', color:'#fff', fontFamily:'Space Mono' }}>{detalleActivo.data.placa}</div>
                      <div style={{ fontSize:13, color:'var(--gold-light)', marginTop:4 }}>{detalleActivo.data.marca} {detalleActivo.data.modelo} ({detalleActivo.data.anio || 'N/A'})</div>
                    </div>
                  </div>
                  
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:15, marginBottom:20 }}>
                    <div style={{ background:'var(--panel2)', padding:'15px', borderRadius:8, border:'1px solid var(--border-soft)' }}>
                      <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Uso Registrado</div>
                      <div style={{ fontSize:16, fontWeight:600, color:'#fff', marginTop:5, fontFamily:'Space Mono' }}>{detalleActivo.data.kilometraje_actual || 0} {detalleActivo.data.tipo === 'maquinaria' ? 'hrs' : 'km'}</div>
                    </div>
                    <div style={{ background:'var(--panel2)', padding:'15px', borderRadius:8, border:'1px solid var(--border-soft)' }}>
                      <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Estado Actual</div>
                      <div style={{ marginTop:5 }}><StatusPill status={detalleActivo.data.estado} /></div>
                    </div>
                    <div style={{ background:'var(--panel2)', padding:'15px', borderRadius:8, border:'1px solid var(--border-soft)' }}>
                      <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Vencimiento Matrícula</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginTop:5, fontFamily:'Space Mono' }}>
                        {detalleActivo.data.fecha_expiracion_matricula ? new Date(detalleActivo.data.fecha_expiracion_matricula).toLocaleDateString('es-EC') : 'No registrado'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:13, color:'var(--text-2)', padding:'15px', background:'var(--panel2)', borderRadius:8 }}>
                    <div><strong style={{ color:'#fff' }}>Categoría:</strong><span style={{ float:'right', color:'var(--gold-light)', textTransform:'capitalize' }}>{detalleActivo.data.tipo}</span></div>
                    <div><strong style={{ color:'#fff' }}>Color:</strong><span style={{ float:'right' }}>{detalleActivo.data.color || 'No especificado'}</span></div>
                    <div><strong style={{ color:'#fff' }}>Ingreso al sistema:</strong><span style={{ float:'right' }}>{new Date(detalleActivo.data.creado_en).toLocaleDateString('es-EC')}</span></div>

                    {/* ZONA PARA SUBIR ARCHIVO PDF / IMAGEN DE MATRÍCULA */}
                    <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border-soft)' }}>
                      <strong style={{ color:'#fff', display: 'block', marginBottom: 10 }}>Documento de Matrícula:</strong>
                      {detalleActivo.data.matricula_url ? (
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <a href={`http://${window.location.hostname}:8000${detalleActivo.data.matricula_url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--gold-light)', fontSize: 13, textDecoration: 'none', background: 'rgba(200,168,75,0.1)', padding: '6px 12px', borderRadius: 6, fontWeight: 600 }}>📄 Ver Documento</a>
                              <label style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-3)' }}>
                                  (Reemplazar)
                                  <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={(e) => handleUploadDocumento(e, 'matricula', detalleActivo.data.id)} />
                              </label>
                          </div>
                      ) : (
                          <label style={{ display: 'inline-block', background: 'var(--panel3)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '1px solid var(--border-soft)', color: 'var(--text-2)' }}>
                              + Subir PDF o Imagen
                              <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={(e) => handleUploadDocumento(e, 'matricula', detalleActivo.data.id)} />
                          </label>
                      )}
                    </div>
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
import { useEffect, useState } from 'react'
import { dashboardAPI, mantenimientoAPI, checklistAPI } from '../services/api'
import { KpiCard, Panel, PanelHeader, PageHeader, StatusPill, LoadingSpinner } from '../components/layout/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const fuelWeek = [
  { dia:'Lun', litros:185 }, { dia:'Mar', litros:210 }, { dia:'Mié', litros:165 },
  { dia:'Jue', litros:230 }, { dia:'Vie', litros:195 }, { dia:'Sáb', litros:120 }, { dia:'Hoy', litros:90 },
]

const alertas = [
  { tipo:'red',   titulo:'Checklist reprobado — VH-009', desc:'Extintor vencido · Salida bloqueada', tiempo:'hace 12 min' },
  { tipo:'amber', titulo:'Mantenimiento próximo — VH-003', desc:'Cambio de aceite en 320 km', tiempo:'hace 1 h' },
  { tipo:'amber', titulo:'Consumo atípico — VH-012', desc:'+34% sobre promedio diario', tiempo:'hace 3 h' },
  { tipo:'blue',  titulo:'Maquinaria sin asignar', desc:'EX-201 disponible sin chofer', tiempo:'hace 6 h' },
]

const dotColor = { red:'var(--red)', amber:'var(--amber)', blue:'var(--blue)' }

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.kpis()
      .then(r => setKpis(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const k = kpis || {}

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <PageHeader title="Panel de Control" subtitle={new Date().toLocaleDateString('es-EC', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}>
        <button style={{ padding:'8px 16px', borderRadius:8, fontSize:13, background:'var(--panel2)', color:'var(--text-2)', border:'1px solid var(--border-soft)', cursor:'pointer' }}>Exportar</button>
        <button style={{ padding:'8px 16px', borderRadius:8, fontSize:13, background:'var(--gold)', color:'#0E1117', border:'none', cursor:'pointer', fontWeight:600 }}>+ Registrar</button>
      </PageHeader>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        <KpiCard label="Vehículos operativos" value={loading ? '...' : k.vehiculos_operativos ?? 14} delta="▲ 2 vs ayer" deltaType="up" accent="var(--green)" />
        <KpiCard label="En taller" value={loading ? '...' : k.vehiculos_taller ?? 3} delta="▼ 1 vs ayer" deltaType="down" accent="var(--red)" />
        <KpiCard label="Combustible hoy" value={loading ? '...' : `${k.combustible_hoy_litros ?? 847} L`} delta="▲ +12% vs prom." deltaType="warn" accent="var(--gold)" />
        <KpiCard label="Choferes activos" value={loading ? '...' : k.choferes_activos ?? 11} delta="▲ 1 hoy" deltaType="up" accent="var(--blue)" />
      </div>

      {/* Grid principal */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>

        {/* Gráfico combustible */}
        <Panel>
          <PanelHeader title="Consumo combustible — semana (litros)" />
          <div style={{ padding:'20px 20px 10px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fuelWeek} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                <XAxis dataKey="dia" tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text-3)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background:'var(--panel2)', border:'1px solid var(--border-soft)', borderRadius:8, fontSize:12 }}
                  labelStyle={{ color:'var(--text-2)' }}
                  itemStyle={{ color:'var(--gold-light)' }}
                />
                <Bar dataKey="litros" radius={[4,4,0,0]}>
                  {fuelWeek.map((entry, i) => (
                    <Cell key={i} fill={entry.dia === 'Hoy' ? 'var(--gold)' : 'rgba(200,168,75,0.35)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Alertas */}
        <Panel>
          <PanelHeader title="Alertas activas">
            <span style={{ fontSize:10, background:'var(--red)', color:'#fff', borderRadius:8, padding:'1px 6px', fontWeight:600 }}>
              {alertas.length}
            </span>
          </PanelHeader>
          {alertas.map((a, i) => (
            <div key={i} style={{
              display:'flex', gap:12, padding:'12px 18px',
              borderBottom: i < alertas.length - 1 ? '1px solid var(--border-soft)' : 'none',
              cursor:'pointer',
            }}>
              <div style={{
                width:8, height:8, borderRadius:'50%', marginTop:4, flexShrink:0,
                background: dotColor[a.tipo],
                boxShadow: a.tipo === 'red' ? '0 0 5px var(--red)' : 'none',
              }} />
              <div>
                <div style={{ fontSize:12, fontWeight:500, marginBottom:2 }}>{a.titulo}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>{a.desc}</div>
                <div style={{ fontSize:10, color:'var(--text-3)', fontFamily:'Space Mono', marginTop:2 }}>{a.tiempo}</div>
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* Bottom */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Disponibilidad por tipo */}
        <Panel>
          <PanelHeader title="Disponibilidad de flota" />
          <div style={{ padding:'20px' }}>
            {[
              { label:'Operativos', val: k.vehiculos_operativos ?? 14, total:17, color:'var(--green)' },
              { label:'En taller',  val: k.vehiculos_taller ?? 3,  total:17, color:'var(--red)' },
              { label:'Libres',     val: k.vehiculos_libres ?? 0,  total:17, color:'var(--amber)' },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ fontSize:12, color:'var(--text-2)', width:90 }}>{row.label}</div>
                <div style={{ flex:1, height:6, background:'var(--panel2)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:row.color, borderRadius:3, width:`${(row.val/row.total)*100}%`, transition:'width 0.6s' }} />
                </div>
                <div style={{ fontSize:12, fontFamily:'Space Mono', color:'var(--text-2)', minWidth:30, textAlign:'right' }}>{row.val}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Mantenimientos próximos */}
        <Panel>
          <PanelHeader title="Mantenimientos próximos" />
          {[
            { v:'VH-009', desc:'Cambio frenos', estado:'vencido',   info:'En taller' },
            { v:'VH-003', desc:'Cambio aceite', estado:'programado', info:'Vence en 3 días' },
            { v:'EX-201', desc:'Revisión hidráulica', estado:'programado', info:'Vence en 7 días' },
          ].map((m, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 20px',
              borderBottom: i < 2 ? '1px solid var(--border-soft)' : 'none',
            }}>
              <div style={{ fontFamily:'Space Mono', fontSize:12, color:'var(--gold-light)', fontWeight:700, minWidth:54 }}>{m.v}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{m.desc}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>{m.info}</div>
              </div>
              <StatusPill status={m.estado} />
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}

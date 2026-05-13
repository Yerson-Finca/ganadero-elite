import React, { useState, useEffect } from 'react'
import { db } from './db'
import { fm, getDietaCompleta, getGMD, getRendimiento, getEtapaCompleta, getCostoDiario, predecirPeso, getEficiencia, getAlertasLote, getSemaforo, ALIMENTOS, IC_ALIMENTOS, NM_ALIMENTOS } from './calculos'
import Icono from './iconos'

interface Props {
  animales: any[]
  preciosAlimento: Record<string, number>
  stockAlimento: Record<string, number>
  precioKG: number
  litroLeche: number
  verPerfil: (id: number) => void
  cambiarPagina: (p: string) => void
  recargar: () => void
  soloAnimales?: boolean
}

const Dashboard: React.FC<Props> = ({ animales, preciosAlimento, stockAlimento, precioKG, verPerfil, cambiarPagina, recargar, soloAnimales }) => {
  const [precio, setPrecio] = useState(precioKG)
  const [apps, setApps] = useState<any[]>([])
  useEffect(() => { db.aplicaciones.toArray().then(setApps) }, [])

  const actualizarPrecio = async (v: number) => { setPrecio(v); const { setConfig } = await import('./db'); await setConfig('precioKG', v); recargar() }

  if (animales.length === 0) return <div className="card text-center" style={{ padding: 40 }}>No hay animales</div>

  let totalKg = 0, costoTotal = 0, pesoProy30 = 0, gmdTotal = 0, cg = 0
  const mez: Record<string, number> = {}; ALIMENTOS.forEach(a => mez[a] = 0)
  let mejorA: any = null, peorA: any = null

  animales.forEach(a => {
    const cp = a.historial[a.historial.length - 1].peso; totalKg += cp
    const d = getDietaCompleta(cp, a.tipo, (a as any).estadoRepro); ALIMENTOS.forEach(k => mez[k] = (mez[k] || 0) + ((d as any)[k] || 0))
    costoTotal += getCostoDiario(cp, a.tipo, (a as any).estadoRepro, preciosAlimento)
    const g = getGMD(a.historial); if (a.historial.length >= 2) { gmdTotal += g; cg++ }
    if (!mejorA || g > mejorA.gmd) mejorA = { nombre: a.nombre, gmd: g, id: a.id }
    if (!peorA || g < peorA.gmd) peorA = { nombre: a.nombre, gmd: g, id: a.id }
    const p30 = predecirPeso(a.historial, 30); if (p30) pesoProy30 += p30
  })

  const gmdL = cg > 0 ? gmdTotal / cg : 0
  const gan30 = pesoProy30 * precio - totalKg * precio
  const gan = gmdL * 30 * precio * animales.length - costoTotal * 30
  const ef = animales.length > 0 ? Math.round(animales.reduce((s, a) => s + getRendimiento(a.historial).pct, 0) / animales.length) : 0
  const alertas = getAlertasLote(animales, stockAlimento, preciosAlimento, apps)
  const ranking = [...animales].sort((a, b) => getGMD(b.historial) - getGMD(a.historial))

  if (soloAnimales) {
    return (
      <div className="grid">
        {animales.map(a => {
          const cp = a.historial[a.historial.length - 1].peso
          const etapa = getEtapaCompleta(cp, a.tipo, (a as any).estadoRepro)
          const r = getRendimiento(a.historial)
          const led = { verde: 'ml-g', azul: 'ml-b', naranja: 'ml-o', rojo: 'ml-r', gris: 'ml-x' }
          return (
            <div key={a.id} className={`animal-card ${etapa.cardClass}`} onClick={() => verPerfil(a.id!)}>
              <div className={`mini-led ${led[r.nivel]}`} />
              <span style={{ fontSize: '1.5rem' }}>{etapa.icono}</span>
              <div className="name">{a.nombre}</div>
              <span className={`etapa-tag ${etapa.clase}`}>{etapa.rango}</span>
              <div className="weight">{fm(cp)} kg</div>
              <div className="cm" style={{ color: r.cm >= 0 ? '#22c55e' : '#ef4444' }}>{r.cm >= 0 ? '+' : ''}{r.cm.toFixed(1)}%</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <div className="row-label mb6" style={{ fontWeight: 600 }}>💰 PRECIO KG EN PIE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>$</span>
          <input type="number" value={precio} onChange={e => actualizarPrecio(parseFloat(e.target.value) || 0)} style={{ fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }} />
          <span style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>COP</span>
        </div>
      </div>

      <div className="card">
        <div className="capital-value">$ {fm(totalKg * precio)}</div>
        <div className="stats-grid">
          <div className="stat-item"><div className="row-label">🐄 Cabezas</div><div className="row-val">{animales.length}</div></div>
          <div className="stat-item"><div className="row-label">⚖️ Peso Total</div><div className="row-val">{fm(totalKg)} kg</div></div>
        </div>
      </div>

      <div className="card card-ia">
        <div className="section-title"><Icono nombre="sparkles" /> IA DEL SISTEMA</div>
        <div className="proyeccion-grid">
          <div className="proyeccion-item"><div className="dias">EFICIENCIA</div><div className="peso" style={{ color: ef >= 70 ? '#22c55e' : ef >= 50 ? '#f59e0b' : '#ef4444' }}>{ef}%</div></div>
          <div className="proyeccion-item"><div className="dias">30 DÍAS</div><div className="peso">{fm(pesoProy30)} kg</div><div className="ganancia" style={{ color: gan30 >= 0 ? '#22c55e' : '#ef4444' }}>{gan30 >= 0 ? '+' : ''}$ {fm(Math.abs(gan30))}</div></div>
        </div>
        {mejorA && <div className="ranking-item" onClick={() => verPerfil(mejorA.id)}>🏆 Mejor: <b>{mejorA.nombre}</b> +{mejorA.gmd.toFixed(2)}</div>}
      </div>

      {alertas.length > 0 && (
        <div className="card">
          <div className="section-title">🔔 ALERTAS</div>
          {alertas.slice(0, 3).map((a, i) => (
            <div key={i} className={`alert-item alert-${a.t === 'r' ? 'danger' : a.t === 'purple' ? 'purple' : 'warning'}`}>{a.icon} <span dangerouslySetInnerHTML={{ __html: a.m }} /></div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="section-title"><Icono nombre="leaf" /> CONSUMO DIARIO</div>
        {ALIMENTOS.map(a => (
          <div key={a} className="row">
            <span className="row-label">{IC_ALIMENTOS[a]} {NM_ALIMENTOS[a]}</span>
            <span className="row-val">{a === 'pasto' || a === 'salvado' ? (mez[a] || 0).toFixed(1) + ' kg' : Math.round(mez[a] || 0) + ' g'}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title"><Icono nombre="star" /> RANKING</div>
        {ranking.slice(0, 3).map((a, i) => (
          <div key={a.id} className="ranking-item" onClick={() => verPerfil(a.id!)}>
            <span>{['1º','2º','3º'][i]}</span><b>{a.nombre}</b><span style={{ color: '#22c55e' }}>+{getGMD(a.historial).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title"><Icono nombre="dollar" /> FINANZAS</div>
        <div className="row"><span className="row-label">Alimentación/día</span><span className="row-val">$ {fm(costoTotal)}</span></div>
        <div className="row"><span className="row-label">Ganancia/mes</span><span className="row-val" style={{ color: gan >= 0 ? '#22c55e' : '#ef4444' }}>$ {fm(gan)}</span></div>
      </div>
    </div>
  )
}

export default Dashboard
export default Dashboard

import React, { useState, useEffect } from 'react'
import { db } from './db'
import { Animal, fm, getGMD, getDietaCompleta, getCostoDiario, getRendimiento, predecirPeso, getEficiencia, getAlertasLote, getEtapaCompleta, getSemaforo, ALIMENTOS, IC_ALIMENTOS, NM_ALIMENTOS } from './calculos'

const Icono = ({ nombre, size = 16 }: { nombre: string; size?: number }) => {
  const paths: Record<string, string> = {
    dollar: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    scale: 'M3 3v18h18M7 16V8l-4 4M17 16V8l4 4',
    sparkles: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0Z M20 3v4M22 5h-4M4 17v2M5 18H3',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
    leaf: 'M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {(paths[nombre] || '').split(' ').map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

interface Props {
  animales: Animal[]
  preciosAlimento: Record<string, number>
  stockAlimento: Record<string, number>
  precioKG: number
  verPerfil: (id: number) => void
  cambiarPagina: (p: string) => void
  recargar: () => void
  soloAnimales?: boolean
}

const Dashboard: React.FC<Props> = ({ animales, preciosAlimento, stockAlimento, precioKG, verPerfil, cambiarPagina, recargar, soloAnimales }) => {
  const [precio, setPrecio] = useState(precioKG)
  const [apps, setApps] = useState<any[]>([])
  useEffect(() => { db.aplicaciones.toArray().then(setApps) }, [])

  const actualizarPrecio = async (v: number) => {
    setPrecio(v)
    const { setConfig } = await import('./db')
    await setConfig('precioKG', v)
    recargar()
  }

  if (animales.length === 0) {
    return (
      <div className="card text-center" style={{ padding: 40 }}>
        <p className="text-muted">No hay animales registrados</p>
      </div>
    )
  }

  let totalKg = 0, costoTotal = 0, pesoProy30 = 0, gmdTotal = 0, cg = 0
  const mez: Record<string, number> = {}
  ALIMENTOS.forEach(a => mez[a] = 0)
  let mejorA: any = null, peorA: any = null

  animales.forEach(a => {
    const cp = a.historial[a.historial.length - 1].peso; totalKg += cp
    const d = getDietaCompleta(cp, a.tipo, a.estadoRepo || a.estadoRepro)
    ALIMENTOS.forEach(k => mez[k] = (mez[k] || 0) + ((d as any)[k] || 0))
    costoTotal += getCostoDiario(cp, a.tipo, a.estadoRepro || (a as any).estadoRepro, preciosAlimento)
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
      <div className="animal-grid">
        {animales.map(a => {
          const cp = a.historial[a.historial.length - 1].peso
          const etapa = getEtapaCompleta(cp, a.tipo, (a as any).estadoRepro)
          const r = getRendimiento(a.historial)
          const hist = a.historial.slice(-7).map(h => h.peso)
          const max = Math.max(...hist)
          return (
            <div key={a.id} className={`animal-card ${etapa.cardClass}`} onClick={() => verPerfil(a.id!)}>
              <div className={`led led-${r.nivel === 'verde' ? 'green' : r.nivel === 'rojo' ? 'red' : r.nivel === 'naranja' ? 'orange' : 'blue'}`} />
              <div className="avatar">{a.foto ? <img src={a.foto} alt={a.nombre} /> : etapa.icono}</div>
              <div className="name">{a.nombre}</div>
              <span className={`tag tag-${etapa.nombre === 'Cría' || etapa.nombre === 'Novilla' ? 'inicio' : etapa.nombre === 'Levante' || etapa.nombre === 'Seca' ? 'desarrollo' : etapa.nombre === 'Ceba' || etapa.nombre === 'Parida' ? 'ceba' : 'madurez'}`}>{etapa.rango}</span>
              <div className="weight">{fm(cp)} kg</div>
              <div className="sparkline" style={{ marginTop: 6 }}>
                {hist.map((h, i) => <div key={i} className={`sparkline-bar ${h > cp * 0.95 ? 'high' : ''}`} style={{ height: `${(h / max) * 100}%` }} />)}
              </div>
              <div className="cm mt-4" style={{ color: r.cm >= 0 ? '#5A9E6F' : '#C77D7D' }}>{r.cm >= 0 ? '+' : ''}{r.cm.toFixed(1)}%</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="gap-16" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Precio KG */}
      <div className="card-sm">
        <div className="section-title"><Icono nombre="dollar" /> PRECIO KG EN PIE <span className="live-dot" /></div>
        <div className="row">
          <span className="row-label">Valor actual</span>
          <input type="number" value={precio} onChange={e => actualizarPrecio(parseFloat(e.target.value) || 0)} style={{ width: 130, textAlign: 'right', fontWeight: 600 }} />
        </div>
      </div>

      {/* Métricas */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label"><Icono nombre="scale" size={12} /> Peso Total</div>
          <div className="metric-value">{fm(totalKg)} kg</div>
          <div className="metric-sub">{animales.length} animales</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Icono nombre="dollar" size={12} /> Valor Est.</div>
          <div className="metric-value">$ {fm(totalKg * precio)}</div>
          <div className="metric-sub">GMD {gmdL.toFixed(2)} kg/d</div>
        </div>
      </div>

      {/* IA */}
      <div className="card card-ia">
        <div className="section-title"><Icono nombre="sparkles" /> IA DEL SISTEMA</div>
        <div className="proyeccion-grid">
          <div className="proyeccion-item">
            <div className="proyeccion-dias">EFICIENCIA</div>
            <div className="proyeccion-peso" style={{ color: ef >= 70 ? '#5A9E6F' : ef >= 50 ? '#C4A86C' : '#C77D7D' }}>{ef}%</div>
          </div>
          <div className="proyeccion-item">
            <div className="proyeccion-dias">30 DÍAS</div>
            <div className="proyeccion-peso">{fm(pesoProy30)} kg</div>
            <div className="proyeccion-ganancia" style={{ color: gan30 >= 0 ? '#5A9E6F' : '#C77D7D', fontSize: 9 }}>
              {gan30 >= 0 ? '+' : ''}$ {fm(Math.abs(gan30))}
            </div>
          </div>
        </div>
        {mejorA && <div className="ranking-item" onClick={() => verPerfil(mejorA.id)}><Icono nombre="star" size={12} /> Mejor: <b>{mejorA.nombre}</b> <span style={{ color: '#5A9E6F' }}>+{mejorA.gmd.toFixed(2)}</span></div>}
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="card-sm">
          <div className="section-title"><Icono nombre="bell" /> ALERTAS</div>
          {alertas.slice(0, 3).map((a, i) => (
            <div key={i} className={`alert-item ${a.t === 'r' ? 'alert-danger' : a.t === 'purple' ? 'alert-purple' : 'alert-warning'}`}>
              {a.icon} <span dangerouslySetInnerHTML={{ __html: a.m }} />
            </div>
          ))}
        </div>
      )}

      {/* Consumo */}
      <div className="card-sm">
        <div className="section-title"><Icono nombre="leaf" /> CONSUMO DIARIO</div>
        {ALIMENTOS.map(alim => (
          <div key={alim} className="row">
            <span className="row-label">{IC_ALIMENTOS[alim]} {NM_ALIMENTOS[alim]}</span>
            <span className="row-val">{alim === 'pasto' || alim === 'salvado' ? (mez[alim] || 0).toFixed(1) + ' kg' : Math.round(mez[alim] || 0) + ' g'}</span>
          </div>
        ))}
      </div>

      {/* Ranking */}
      <div className="card-sm">
        <div className="section-title"><Icono nombre="star" /> RANKING</div>
        {ranking.slice(0, 3).map((a, i) => (
          <div key={a.id} className="ranking-item" onClick={() => verPerfil(a.id!)}>
            <span>{['1º','2º','3º'][i]}</span>
            <span><b>{a.nombre}</b></span>
            <span style={{ color: '#5A9E6F' }}>+{getGMD(a.historial).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Finanzas */}
      <div className="card-sm">
        <div className="section-title"><Icono nombre="dollar" /> FINANZAS</div>
        <div className="row"><span className="row-label">Alimentación/día</span><span className="row-val">$ {fm(costoTotal)}</span></div>
        <div className="row"><span className="row-label">Ganancia/mes</span><span className="row-val" style={{ color: gan >= 0 ? '#5A9E6F' : '#C77D7D' }}>$ {fm(gan)}</span></div>
      </div>
    </div>
  )
}

export default Dashboard

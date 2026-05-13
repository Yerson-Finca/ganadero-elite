import React, { useState, useEffect } from 'react'
import { db } from './db'
import {
  Animal, fm, getGMD, getDietaCompleta, getCostoDiario, getRendimiento,
  predecirPeso, getEficiencia, getAlertasLote, getEtapaCompleta, getSemaforo,
  ALIMENTOS, IC_ALIMENTOS, NM_ALIMENTOS
} from './calculos'
import Icono from './iconos'

interface Props {
  animales: Animal[]
  preciosAlimento: Record<string, number>
  stockAlimento: Record<string, number>
  precioKG: number
  litroLeche: number
  verPerfil: (id: number) => void
  cambiarPagina: (p: string) => void
  recargar: () => void
  soloAnimales?: boolean
}

const Dashboard: React.FC<Props> = ({
  animales, preciosAlimento, stockAlimento, precioKG, litroLeche,
  verPerfil, cambiarPagina, recargar, soloAnimales
}) => {
  const [precioKGInput, setPrecioKGInput] = useState(precioKG)
  const [aplicaciones, setAplicaciones] = useState<any[]>([])

  useEffect(() => { db.aplicaciones.toArray().then(setAplicaciones) }, [])

  const actualizarPrecio = async (val: number) => {
    setPrecioKGInput(val)
    const { setConfig } = await import('./db')
    await setConfig('precioKG', val)
    recargar()
  }

  if (animales.length === 0) {
    return (
      <div className="card text-center" style={{ padding: 40 }}>
        <Icono nombre="cow" tamaño={40} className="text-muted" />
        <p className="text-secondary mt-8">No hay animales registrados</p>
      </div>
    )
  }

  let totalKg = 0, costoTotal = 0, pesoProy30 = 0, gmdTotal = 0, countGMD = 0
  const mez: Record<string, number> = {}
  ALIMENTOS.forEach(a => mez[a] = 0)
  let mejorA: any = null, peorA: any = null

  animales.forEach(a => {
    const cp = a.historial[a.historial.length - 1].peso
    totalKg += cp
    const d = getDietaCompleta(cp, a.tipo, a.estadoRepro)
    ALIMENTOS.forEach(k => mez[k] = (mez[k] || 0) + (d[k as keyof typeof d] as number || 0))
    costoTotal += getCostoDiario(cp, a.tipo, a.estadoRepro, preciosAlimento)
    const gmd = getGMD(a.historial)
    if (a.historial.length >= 2) { gmdTotal += gmd; countGMD++ }
    if (!mejorA || gmd > mejorA.gmd) mejorA = { nombre: a.nombre, gmd, id: a.id }
    if (!peorA || gmd < peorA.gmd) peorA = { nombre: a.nombre, gmd, id: a.id }
    const p30 = predecirPeso(a.historial, 30)
    if (p30) pesoProy30 += p30
  })

  const ta = animales.length
  const gmdL = countGMD > 0 ? gmdTotal / countGMD : 0
  const ingM = gmdL * 30 * precioKG * ta
  const cosM = costoTotal * 30
  const gan = ingM - cosM
  const valorProy30 = pesoProy30 * precioKG
  const gan30 = valorProy30 - (totalKg * precioKG)
  const eficienciaGlobal = ta > 0 ? Math.round(animales.reduce((s, a) => {
    const r = getRendimiento(a.historial); return s + r.pct
  }, 0) / ta) : 0
  const efData = getEficiencia(eficienciaGlobal)
  const alertasL = getAlertasLote(animales, stockAlimento, preciosAlimento, aplicaciones)
  const ranking = [...animales].sort((a, b) => getGMD(b.historial) - getGMD(a.historial))

  if (soloAnimales) {
    return (
      <div className="animal-grid">
        {animales.map(a => {
          const cp = a.historial[a.historial.length - 1].peso
          const etapa = getEtapaCompleta(cp, a.tipo, a.estadoRepro)
          const r = getRendimiento(a.historial)
          const sem = getSemaforo(a)
          const ledMap: Record<string, string> = { verde: 'led-green', azul: 'led-blue', naranja: 'led-orange', rojo: 'led-red', gris: 'led-gray' }
          return (
            <div key={a.id} className={`animal-card ${etapa.cardClass}`} onClick={() => verPerfil(a.id!)}>
              <div className={`led ${ledMap[r.nivel] || 'led-gray'}`} />
              <div className="avatar">{a.foto ? <img src={a.foto} alt={a.nombre} /> : etapa.icono}</div>
              <div className="name">{a.nombre}</div>
              <span className={`tag ${etapa.clase}`}>{etapa.rango}</span>
              <div className="weight">{fm(cp)} kg</div>
              <div className="cm" style={{ color: r.cm >= 0 ? '#4CAF50' : '#E0554A' }}>
                {r.cm >= 0 ? '+' : ''}{r.cm.toFixed(1)}%
              </div>
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
        <div className="section-title">
          <Icono nombre="dollar" tamaño={16} />
          PRECIO KG EN PIE
        </div>
        <div className="row">
          <span className="row-label">Valor actual</span>
          <input
            type="number"
            value={precioKGInput}
            onChange={e => actualizarPrecio(parseFloat(e.target.value) || 0)}
            style={{ width: 120, textAlign: 'right', fontWeight: 600 }}
          />
        </div>
      </div>

      {/* Métricas */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label"><Icono nombre="scale" tamaño={14} /> Peso Total</div>
          <div className="metric-value">{fm(totalKg)} kg</div>
          <div className="metric-sub">{ta} animales</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Icono nombre="dollar" tamaño={14} /> Valor Est.</div>
          <div className="metric-value">$ {fm(totalKg * precioKG)}</div>
          <div className="metric-sub">GMD {gmdL.toFixed(2)} kg/d</div>
        </div>
      </div>

      {/* IA */}
      <div className="card-ia">
        <div className="section-title">
          <Icono nombre="sparkles" tamaño={16} />
          IA DEL SISTEMA
        </div>
        <div className="proyeccion-grid">
          <div className="proyeccion-item">
            <div className="proyeccion-dias">EFICIENCIA</div>
            <div className="proyeccion-peso" style={{ color: efData.color }}>{eficienciaGlobal}%</div>
            <div className="proyeccion-ganancia">{efData.texto}</div>
          </div>
          <div className="proyeccion-item">
            <div className="proyeccion-dias">30 DÍAS</div>
            <div className="proyeccion-peso">{fm(pesoProy30)} kg</div>
            <div className="proyeccion-ganancia" style={{ color: gan30 >= 0 ? '#4CAF50' : '#E0554A' }}>
              {gan30 >= 0 ? '+' : ''}$ {fm(Math.abs(gan30))}
            </div>
          </div>
        </div>
        {mejorA && (
          <div className="ranking-item" onClick={() => verPerfil(mejorA.id)}>
            <Icono nombre="star" tamaño={14} />
            <span>Mejor: <b>{mejorA.nombre}</b></span>
            <span style={{ color: '#4CAF50' }}>+{mejorA.gmd.toFixed(2)} kg/d</span>
          </div>
        )}
      </div>

      {/* Alertas */}
      {alertasL.length > 0 && (
        <div className="card-sm">
          <div className="section-title">
            <Icono nombre="bell" tamaño={14} />
            ALERTAS
          </div>
          {alertasL.slice(0, 3).map((al, i) => (
            <div key={i} className={`alert-item ${al.t === 'r' ? 'alert-danger' : al.t === 'purple' ? 'alert-purple' : 'alert-warning'}`}>
              {al.icon} <span dangerouslySetInnerHTML={{ __html: al.m }} />
            </div>
          ))}
        </div>
      )}

      {/* Consumo diario */}
      <div className="card-sm">
        <div className="section-title">
          <Icono nombre="leaf" tamaño={14} />
          CONSUMO DIARIO
        </div>
        {ALIMENTOS.map(alim => (
          <div key={alim} className="row">
            <span className="row-label">{IC_ALIMENTOS[alim]} {NM_ALIMENTOS[alim]}</span>
            <span className="row-val">
              {alim === 'pasto' || alim === 'salvado'
                ? (mez[alim] || 0).toFixed(1) + ' kg'
                : Math.round(mez[alim] || 0) + ' g'}
            </span>
          </div>
        ))}
      </div>

      {/* Ranking */}
      <div className="card-sm">
        <div className="section-title">
          <Icono nombre="star" tamaño={14} />
          RANKING GMD
        </div>
        {ranking.slice(0, 3).map((a, i) => (
          <div key={a.id} className="ranking-item" onClick={() => verPerfil(a.id!)}>
            <span>{['1º', '2º', '3º'][i]}</span>
            <span><b>{a.nombre}</b></span>
            <span style={{ color: '#4CAF50' }}>+{getGMD(a.historial).toFixed(2)} kg/d</span>
          </div>
        ))}
      </div>

      {/* Finanzas */}
      <div className="card-sm">
        <div className="section-title">
          <Icono nombre="dollar" tamaño={14} />
          FINANZAS
        </div>
        <div className="row">
          <span className="row-label">Alimentación/día</span>
          <span className="row-val">$ {fm(costoTotal)}</span>
        </div>
        <div className="row">
          <span className="row-label">Ganancia/mes</span>
          <span className="row-val" style={{ color: gan >= 0 ? '#4CAF50' : '#E0554A' }}>$ {fm(gan)}</span>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

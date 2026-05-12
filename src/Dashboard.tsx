import React, { useState, useEffect } from 'react'
import { db } from './db'
import {
  Animal, fm, getGMD, getRendimiento, getEtapaCompleta, getSemaforo,
  getEficiencia, predecirPeso
} from './calculos'
import Icono from './iconos'

interface Props {
  animales: Animal[]
  precioKG: number
  verPerfil: (id: number) => void
  cambiarPagina: (p: string) => void
  recargar: () => void
  soloAnimales?: boolean
}

const Dashboard: React.FC<Props> = ({ animales, precioKG, verPerfil, cambiarPagina, soloAnimales }) => {
  const [precioKGInput, setPrecioKGInput] = useState(precioKG)

  if (animales.length === 0) {
    return (
      <div className="card text-center py-10">
        <div className="text-5xl mb-4">🐄</div>
        <p className="text-text-secondary">No hay animales</p>
        <p className="text-text-muted text-xs mt-2">Toca ➕ para agregar</p>
      </div>
    )
  }

  // Cálculos
  let totalKg = 0, gmdTotal = 0, countGMD = 0, pesoProy30 = 0
  animales.forEach(a => {
    totalKg += a.historial[a.historial.length-1].peso
    const g = getGMD(a.historial)
    if (a.historial.length >= 2) { gmdTotal += g; countGMD++ }
    const p30 = predecirPeso(a.historial, 30)
    if (p30) pesoProy30 += p30
  })
  const gmdProm = countGMD > 0 ? gmdTotal / countGMD : 0
  const valorTotal = totalKg * precioKG
  const gan30 = pesoProy30 * precioKG - valorTotal
  const ranking = [...animales].sort((a,b) => getGMD(b.historial) - getGMD(a.historial))

  const actualizarPrecio = async () => {
    const { setConfig } = await import('./db')
    await setConfig('precioKG', precioKGInput)
    recargar()
  }

  if (soloAnimales) {
    return (
      <div>
        <div className="grid grid-cols-2 gap-2.5">
          {animales.map(a => {
            const cp = a.historial[a.historial.length-1].peso
            const etapa = getEtapaCompleta(cp, a.tipo, a.estadoRepro)
            const r = getRendimiento(a.historial)
            return (
              <div key={a.id} className={`animal-card ${etapa.cardClass}`} onClick={() => verPerfil(a.id!)}>
                <div className="text-2xl mb-1">{etapa.icono}</div>
                <div className="name">{a.nombre}</div>
                <div className="weight">{fm(cp)} kg</div>
                <div className="cm" style={{color: r.cm >= 0 ? '#22C55E' : '#EF4444'}}>
                  {r.cm >= 0 ? '+' : ''}{r.cm.toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Dashboard principal estilo crypto
  return (
    <div>
      {/* HEADER ESTILO EXCHANGE */}
      <div className="card-sm mb-3 border-accent/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-text-muted uppercase tracking-wider">Precio KG</span>
          <span className="text-xs text-success">● Live</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-text-primary">$</span>
          <input
            className="bg-transparent text-2xl font-black text-text-primary w-24 outline-none"
            type="number"
            value={precioKGInput}
            onChange={e => setPrecioKGInput(parseFloat(e.target.value)||0)}
          />
          <span className="text-xs text-text-muted">COP</span>
          <button onClick={actualizarPrecio} className="btn btn-sm bg-accent/10 text-accent border border-accent/20 ml-auto">
            ACTUALIZAR
          </button>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPALES - ESTILO BINANCE */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="card-sm">
          <div className="text-xs text-text-muted mb-1">Peso Total</div>
          <div className="text-xl font-black text-text-primary">{fm(totalKg)} kg</div>
          <div className="text-xs text-text-muted mt-1">{animales.length} animales</div>
        </div>
        <div className="card-sm">
          <div className="text-xs text-text-muted mb-1">Valor Estimado</div>
          <div className="text-xl font-black text-text-primary">$ {fm(valorTotal)}</div>
          <div className="text-xs text-success mt-1">● GMD {gmdProm.toFixed(2)}</div>
        </div>
      </div>

      {/* PROYECCIÓN 30 DÍAS */}
      <div className="card-sm mb-3 border-accent/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-muted">📈 Proyección 30 días</span>
          <span className="text-xs text-text-muted">+{fm(pesoProy30 - totalKg)} kg</span>
        </div>
        <div className="text-lg font-bold" style={{color: gan30 >= 0 ? '#22C55E' : '#EF4444'}}>
          {gan30 >= 0 ? '+' : ''}$ {fm(Math.abs(gan30))}
        </div>
      </div>

      {/* RANKING */}
      <div className="card-sm mb-3">
        <div className="text-xs text-text-muted mb-2">🏆 RANKING GMD</div>
        {ranking.slice(0, 3).map((a, i) => (
          <div key={a.id} className="flex items-center justify-between py-1.5 cursor-pointer" onClick={() => verPerfil(a.id!)}>
            <div className="flex items-center gap-2">
              <span className="text-sm">{['🥇','🥈','🥉'][i]}</span>
              <span className="text-sm text-text-primary">{a.nombre}</span>
            </div>
            <span className="text-sm text-success">+{getGMD(a.historial).toFixed(2)} kg/d</span>
          </div>
        ))}
        <button className="btn btn-sm bg-transparent text-text-muted border border-border w-full mt-2" onClick={() => cambiarPagina('animales')}>
          Ver todos →
        </button>
      </div>
    </div>
  )
}

export default Dashboard

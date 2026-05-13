import React, { useState } from 'react'
import { Animal, fm, getGMD, getRendimiento, getEtapaCompleta, getSemaforo } from './calculos'

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
        <p className="text-text-secondary">No hay animales registrados</p>
        <p className="text-text-muted text-xs mt-2">Toca el botón ➕ para agregar el primero</p>
      </div>
    )
  }

  let totalKg = 0
  animales.forEach(a => { totalKg += a.historial[a.historial.length - 1].peso })

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
            const cp = a.historial[a.historial.length - 1].peso
            const etapa = getEtapaCompleta(cp, a.tipo, a.estadoRepro)
            const r = getRendimiento(a.historial)
            const sem = getSemaforo(a)
            return (
              <div key={a.id} className={`animal-card ${etapa.cardClass}`} onClick={() => verPerfil(a.id!)}>
                <div className="text-2xl mb-1">{etapa.icono}</div>
                <div className="name">{a.nombre}{sem && <span className={`semaforo semaforo-${sem.color} ml-1`} />}</div>
                <span className={`etapa-tag ${etapa.clase}`}>{etapa.rango}</span>
                <div className="weight">{fm(cp)} kg</div>
                <div className="cm" style={{ color: r.cm >= 0 ? '#22C55E' : '#EF4444' }}>
                  {r.cm >= 0 ? '+' : ''}{r.cm.toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="card-sm mb-3">
        <div className="font-semibold text-sm mb-2">💰 PRECIO KG EN PIE</div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold">$</span>
          <input className="input flex-1 text-center font-bold text-lg" type="number" value={precioKGInput} onChange={e => setPrecioKGInput(parseFloat(e.target.value) || 0)} />
          <span className="text-xs text-text-muted">COP</span>
          <button className="btn btn-green btn-sm" onClick={actualizarPrecio}>ACTUALIZAR</button>
        </div>
      </div>

      <div className="card-sm mb-3">
        <div className="capital-value">$ {fm(totalKg * precioKG)}</div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-bg rounded-xl p-2.5 border border-border">
            <div className="row-label">🐄 Cabezas</div>
            <div className="row-val">{animales.length}</div>
          </div>
          <div className="bg-bg rounded-xl p-2.5 border border-border">
            <div className="row-label">⚖️ Peso</div>
            <div className="row-val">{fm(totalKg)} kg</div>
          </div>
        </div>
      </div>

      <button className="btn btn-gray w-full" onClick={() => cambiarPagina('animales')}>
        🐄 VER TODOS LOS ANIMALES →
      </button>
    </div>
  )
}
{/* Consumo total del sistema */}
<div className="card-sm mb-3">
  <div className="font-bold text-xs text-white mb-2">🍽️ CONSUMO DIARIO TOTAL</div>
  <div className="grid grid-cols-2 gap-2">
    <div className="row"><span className="row-label">🌱 Pasto</span><span className="row-val">{mez.pasto.toFixed(1)} kg</span></div>
    <div className="row"><span className="row-label">🌾 Salvado</span><span className="row-val">{mez.salvado.toFixed(2)} kg</span></div>
    <div className="row"><span className="row-label">💧 Melaza</span><span className="row-val">{Math.round(mez.melaza)} g</span></div>
    <div className="row"><span className="row-label">⚗️ UREA</span><span className="row-val">{Math.round(mez.urea)} g</span></div>
    <div className="row"><span className="row-label">🧊 Bicarbonato</span><span className="row-val">{Math.round(mez.bicarb)} g</span></div>
    <div className="row"><span className="row-label">🧂 Sal</span><span className="row-val">{Math.round(mez.sal)} g</span></div>
  </div>
</div>

export default Dashboard

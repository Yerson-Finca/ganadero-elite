import React, { useState, useEffect } from 'react'
import { db, getConfig, setConfig, SuplementoAlimento, SuplementoSanidad } from './db'
import {
  Animal, getDietaCompleta, ALIMENTOS, IC_ALIMENTOS, NM_ALIMENTOS, CATALOGO_SANIDAD, fm
} from './calculos'
import Icono from './iconos'

interface Props {
  preciosAlimento: Record<string, number>
  stockAlimento: Record<string, number>
  animales: Animal[]
  recargar: () => void
}

const Insumos: React.FC<Props> = ({ preciosAlimento, stockAlimento, animales, recargar }) => {
  const [precios, setPrecios] = useState(preciosAlimento)
  const [stock, setStock] = useState(stockAlimento)
  const [suplementos, setSuplementos] = useState<SuplementoAlimento[]>([])
  const [sanidad, setSanidad] = useState<any[]>(CATALOGO_SANIDAD)
  const [stockSanidad, setStockSanidad] = useState<Record<string, number>>({})
  const [preciosSanidad, setPreciosSanidad] = useState<Record<string, number>>({})

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const sups = await db.suplementosAlimento.toArray()
    const supsSan = await db.suplementosSanidad.toArray()
    setSuplementos(sups)
    setSanidad([...CATALOGO_SANIDAD, ...supsSan])
    setStockSanidad(await getConfig('stockSanidad', {}))
    setPreciosSanidad(await getConfig('preciosSanidad', {}))
  }

  // Consumo diario
  const mez: Record<string, number> = {}
  ALIMENTOS.forEach(a => mez[a] = 0)
  animales.forEach(a => {
    const d = getDietaCompleta(a.historial[a.historial.length - 1].peso, a.tipo, a.estadoRepro)
    ALIMENTOS.forEach(k => mez[k] = (mez[k] || 0) + (d[k as keyof typeof d] as number || 0))
  })

  const guardarAlimentos = async () => {
    await setConfig('preciosAlimento', precios)
    await setConfig('stockAlimento', stock)
    recargar()
    if ((window as any).haptic) (window as any).haptic()
  }

  const agregarSuplemento = async () => {
    const nombre = prompt('Nombre del suplemento:')
    if (!nombre) return
    const gramos = parseInt(prompt('g/kg de peso vivo:') || '50')
    const precio = parseFloat(prompt('Precio por kg ($):') || '0')
    await db.suplementosAlimento.add({
      id: 'sup_' + Date.now(),
      nombre,
      gramosPorKg: gramos || 50,
      precioPorKg: precio || 0,
      stock: 0
    })
    cargarDatos()
    if ((window as any).haptic) (window as any).haptic()
  }

  const eliminarSuplemento = async (id: string) => {
    if (!confirm('¿Eliminar suplemento?')) return
    await db.suplementosAlimento.delete(id)
    cargarDatos()
    if ((window as any).haptic) (window as any).haptic()
  }

  const comprarSuplemento = async (sup: SuplementoAlimento) => {
    const kg = parseFloat(prompt('kg comprados:') || '0')
    const costo = parseFloat(prompt('Costo total ($):') || '0')
    if (isNaN(kg) || kg <= 0 || isNaN(costo) || costo <= 0) { alert('⚠️ Datos válidos'); return }
    await db.suplementosAlimento.update(sup.id, {
      stock: (sup.stock || 0) + kg,
      precioPorKg: sup.precioPorKg || (costo / kg)
    })
    cargarDatos()
    if ((window as any).haptic) (window as any).haptic()
  }

  const comprarSanidad = async (prodId: string) => {
    const ml = parseFloat(prompt('ml comprados:') || '0')
    const costo = parseFloat(prompt('Costo total ($):') || '0')
    if (isNaN(ml) || ml <= 0 || isNaN(costo) || costo <= 0) { alert('⚠️ Datos válidos'); return }
    const nuevoStock = { ...stockSanidad, [prodId]: (stockSanidad[prodId] || 0) + ml }
    const nuevoPrecio = { ...preciosSanidad, [prodId]: costo / ml }
    await setConfig('stockSanidad', nuevoStock)
    await setConfig('preciosSanidad', nuevoPrecio)
    setStockSanidad(nuevoStock)
    setPreciosSanidad(nuevoPrecio)
    if ((window as any).haptic) (window as any).haptic()
  }

  const agregarSanidad = async () => {
    const nombre = prompt('Nombre del producto:')
    if (!nombre) return
    const dosis = parseInt(prompt('Dosis (ml/kg):') || '50')
    const diasEfecto = parseInt(prompt('Días de efecto:') || '30')
    const retiro = parseInt(prompt('Días de retiro:') || '0')
    await db.suplementosSanidad.add({
      id: 'supSan_' + Date.now(),
      nombre,
      dosis: dosis || 50,
      diasEfecto: diasEfecto || 30,
      retiro: retiro || 0,
      stock: 0,
      precioML: 0,
      icono: '💉',
      color: '#A78BFA',
      tipo: 'personalizado'
    })
    cargarDatos()
    if ((window as any).haptic) (window as any).haptic()
  }

  return (
    <div>
      {/* ALIMENTOS */}
      <div className="card mb-3">
        <div className="font-bold text-sm text-accent mb-3">🍽️ ALIMENTOS</div>
        {ALIMENTOS.map(alim => {
          const st = stock[alim] || 0
          const co = mez[alim] || 0
          const cr = (alim === 'pasto' || alim === 'salvado') ? co : co / 1000
          const dias = cr > 0 && st > 0 ? st / cr : 999
          const dCol = dias < 3 ? '#EF4444' : dias < 7 ? '#F59E0B' : '#22C55E'
          return (
            <div key={alim} className="insumo-row">
              <span className="text-lg">{IC_ALIMENTOS[alim]}</span>
              <div className="insumo-info">
                <span className="text-sm font-medium block">{NM_ALIMENTOS[alim]}</span>
                <span className="text-[0.6rem] text-text-muted">
                  $ {fm(precios[alim] || 0)}/kg · <b style={{ color: dCol }}>
                    {dias === 999 ? '--' : Math.round(dias) + 'd'}
                  </b>
                </span>
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-[0.55rem] text-text-muted">$</span>
                <input
                  className="input !w-[60px] !py-2 !text-xs text-right"
                  type="number"
                  value={precios[alim] || 0}
                  onChange={e => setPrecios({ ...precios, [alim]: parseFloat(e.target.value) || 0 })}
                  inputMode="decimal"
                />
                <span className="text-[0.55rem] text-text-muted">kg</span>
                <input
                  className="input !w-[55px] !py-2 !text-xs text-right"
                  type="number"
                  value={Math.round(st)}
                  onChange={e => setStock({ ...stock, [alim]: parseFloat(e.target.value) || 0 })}
                  inputMode="decimal"
                />
              </div>
            </div>
          )
        })}
        <button className="btn btn-green w-full mt-3" onClick={guardarAlimentos}>
          <Icono nombre="check-circle" tamaño={16} variante="solid" /> GUARDAR
        </button>
      </div>

      {/* SUPLEMENTOS */}
      <div className="card mb-3">
        <div className="font-bold text-sm text-accent mb-3">🧪 SUPLEMENTOS</div>
        {suplementos.length === 0 && (
          <div className="text-text-muted text-xs text-center py-2">No hay suplementos</div>
        )}
        {suplementos.map(sup => (
          <div key={sup.id} className="sup-card">
            <div className="sup-card-header">
              <span>🧪 {sup.nombre}</span>
              <button onClick={() => eliminarSuplemento(sup.id)} className="text-danger">
                <Icono nombre="trash" tamaño={14} />
              </button>
            </div>
            <div className="sup-card-body">
              <span>{sup.gramosPorKg} g/kg</span>
              <span>$ {fm(sup.precioPorKg || 0)}/kg</span>
              <span>Stock: {fm(sup.stock || 0)} kg</span>
            </div>
            <button className="btn btn-purple btn-sm w-full mt-2" onClick={() => comprarSuplemento(sup)}>
              🛒 COMPRAR
            </button>
          </div>
        ))}
        <button className="btn btn-purple w-full mt-2" onClick={agregarSuplemento}>
          <Icono nombre="plus" tamaño={14} /> AGREGAR SUPLEMENTO
        </button>
      </div>

      {/* SANIDAD */}
      <div className="card mb-3">
        <div className="font-bold text-sm text-accent mb-3">💉 SANIDAD</div>
        {sanidad.map(prod => {
          const st = prod.tipo === 'fijo' ? (stockSanidad[prod.id] || 0) : (prod.stock || 0)
          const pr = prod.tipo === 'fijo' ? (preciosSanidad[prod.id] || 0) : (prod.precioML || 0)
          return (
            <div key={prod.id} className="py-2.5 border-b border-border last:border-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{prod.icono}</span>
                <div className="flex-1">
                  <span className="text-sm font-semibold">{prod.nombre}</span>
                  <span className="text-[0.58rem] text-text-muted block">
                    Stock: <b>{fm(st)} ml</b> · $ <b>{fm(pr)}/ml</b>
                  </span>
                </div>
              </div>
              <button className="btn btn-purple btn-sm w-full" onClick={() => comprarSanidad(prod.id)}>
                🛒 COMPRAR
              </button>
            </div>
          )
        })}
        <button className="btn btn-purple w-full mt-2" onClick={agregarSanidad}>
          <Icono nombre="plus" tamaño={14} /> AGREGAR INYECTABLE
        </button>
      </div>
    </div>
  )
}

export default Insumos

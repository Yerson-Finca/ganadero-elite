import React, { useState, useEffect } from 'react'
import { db, getConfig, setConfig, SuplementoAlimento } from './db'
import { Animal, getDietaCompleta, ALIMENTOS, IC_ALIMENTOS, NM_ALIMENTOS, CATALOGO_SANIDAD, fm } from './calculos'
import Icono from './iconos'
import ModalInput from './ModalInput'
import ModalForm from './ModalForm'

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
  const [showSup, setShowSup] = useState(false)
  const [showSan, setShowSan] = useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setSuplementos(await db.suplementosAlimento.toArray())
    setSanidad([...CATALOGO_SANIDAD, ...(await db.suplementosSanidad.toArray())])
    setStockSanidad(await getConfig('stockSanidad', {}))
  }

  const mez: Record<string, number> = {}
  ALIMENTOS.forEach(a => mez[a] = 0)
  animales.forEach(a => {
    const d = getDietaCompleta(a.historial[a.historial.length - 1].peso, a.tipo, a.estadoRepro)
    ALIMENTOS.forEach(k => mez[k] = (mez[k] || 0) + (d[k as keyof typeof d] as number || 0))
  })

  const updatePrecio = async (alim: string, val: number) => {
    const np = { ...precios, [alim]: val }
    setPrecios(np)
    await setConfig('preciosAlimento', np)
  }

  const updateStock = async (alim: string, val: number) => {
    const ns = { ...stock, [alim]: val }
    setStock(ns)
    await setConfig('stockAlimento', ns)
  }

  const addSuplemento = async (datos: Record<string, string>) => {
    await db.suplementosAlimento.add({
      id: 'sup_' + Date.now(),
      nombre: datos.nombre,
      gramosPorKg: parseInt(datos.gramos) || 50,
      precioPorKg: parseFloat(datos.precio) || 0,
      stock: 0
    })
    setShowSup(false)
    cargar()
  }

  const addSanidad = async (datos: Record<string, string>) => {
    await db.suplementosSanidad.add({
      id: 'san_' + Date.now(),
      nombre: datos.nombre,
      dosis: parseInt(datos.dosis) || 50,
      diasEfecto: parseInt(datos.efecto) || 30,
      retiro: parseInt(datos.retiro) || 0,
      stock: 0, precioML: 0,
      icono: 'flask', color: '#9B8EC4', tipo: 'personalizado'
    })
    setShowSan(false)
    cargar()
  }

  const eliminarSup = async (id: string) => {
    await db.suplementosAlimento.delete(id)
    cargar()
  }

  return (
    <div className="gap-16" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Alimentos */}
      <div className="card">
        <div className="section-title"><Icono nombre="leaf" tamaño={14} /> ALIMENTOS</div>
        {ALIMENTOS.map(alim => {
          const st = stock[alim] || 0
          const co = mez[alim] || 0
          const cr = (alim === 'pasto' || alim === 'salvado') ? co : co / 1000
          const dias = cr > 0 && st > 0 ? st / cr : 999
          return (
            <div key={alim} className="insumo-row">
              <div className="insumo-icon">{IC_ALIMENTOS[alim]}</div>
              <div className="insumo-info">
                <div className="insumo-name">{NM_ALIMENTOS[alim]}</div>
                <div className="insumo-detail">Stock: {fm(st)} kg · {dias === 999 ? '--' : Math.round(dias) + 'd'}</div>
              </div>
              <div className="insumo-inputs">
                <span className="text-muted" style={{ fontSize: 10 }}>$</span>
                <input type="number" value={precios[alim] || 0} onChange={e => updatePrecio(alim, parseFloat(e.target.value) || 0)} />
                <span className="text-muted" style={{ fontSize: 10 }}>kg</span>
                <input type="number" value={Math.round(st)} onChange={e => updateStock(alim, parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Suplementos */}
      <div className="card">
        <div className="section-title"><Icono nombre="flask" tamaño={14} /> SUPLEMENTOS</div>
        {suplementos.map(sup => (
          <div key={sup.id} className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="insumo-name">{sup.nombre}</div>
              <div className="insumo-detail">{sup.gramosPorKg} g/kg · $ {fm(sup.precioPorKg || 0)}/kg · Stock: {fm(sup.stock || 0)} kg</div>
            </div>
            <button className="btn-icon btn-icon-danger" onClick={() => eliminarSup(sup.id)}>
              <Icono nombre="trash" tamaño={14} />
            </button>
          </div>
        ))}
        <button className="btn btn-sm w-full mt-8" onClick={() => setShowSup(true)}>
          <Icono nombre="plus" tamaño={14} /> Agregar
        </button>
      </div>

      {/* Sanidad */}
      <div className="card">
        <div className="section-title"><Icono nombre="syringe" tamaño={14} /> SANIDAD</div>
        {sanidad.map(prod => (
          <div key={prod.id} className="row" key={prod.id}>
            <span className="row-label">{prod.nombre}</span>
            <span className="row-val">{fm(prod.tipo === 'fijo' ? (stockSanidad[prod.id] || 0) : (prod.stock || 0))} ml</span>
          </div>
        ))}
        <button className="btn btn-sm w-full mt-8" onClick={() => setShowSan(true)}>
          <Icono nombre="plus" tamaño={14} /> Agregar
        </button>
      </div>

      {/* Modales */}
      {showSup && (
        <ModalForm
          titulo="Nuevo suplemento"
          campos={[
            { nombre: 'nombre', label: 'Nombre', tipo: 'text', placeholder: 'Ej: Levadura' },
            { nombre: 'gramos', label: 'Gramos por kg', tipo: 'number', placeholder: '50' },
            { nombre: 'precio', label: 'Precio por kg ($)', tipo: 'number', placeholder: '0' },
          ]}
          onConfirm={addSuplemento}
          onCancel={() => setShowSup(false)}
        />
      )}
      {showSan && (
        <ModalForm
          titulo="Nuevo inyectable"
          campos={[
            { nombre: 'nombre', label: 'Nombre', tipo: 'text', placeholder: 'Ej: Antibiótico' },
            { nombre: 'dosis', label: 'Dosis (ml/kg)', tipo: 'number', placeholder: '50' },
            { nombre: 'efecto', label: 'Días de efecto', tipo: 'number', placeholder: '30' },
            { nombre: 'retiro', label: 'Días de retiro', tipo: 'number', placeholder: '0' },
          ]}
          onConfirm={addSanidad}
          onCancel={() => setShowSan(false)}
        />
      )}
    </div>
  )
}

export default Insumos

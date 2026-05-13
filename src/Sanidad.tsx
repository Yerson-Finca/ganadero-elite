import React, { useState, useEffect } from 'react'
import { db } from './db'
import { fm, CATALOGO_SANIDAD } from './calculos'

const Sanidad: React.FC<{ showToast: (m: string) => void }> = ({ showToast }) => {
  const [stockS, setStockS] = useState<Record<string, number>>({})
  const [preciosS, setPreciosS] = useState<Record<string, number>>({})
  const [compras, setCompras] = useState<Record<string, { ml: string; costo: string }>>({})

  useEffect(() => { cargar() }, [])
  const cargar = async () => {
    const cfg = await db.appData.toArray()
    const ss = cfg.find(c => c.key === 'stockSanidad')
    const ps = cfg.find(c => c.key === 'preciosSanidad')
    if (ss) setStockS(ss.value)
    if (ps) setPreciosS(ps.value)
  }

  const comprar = async (prodId: string) => {
    const c = compras[prodId]; if (!c) return
    const ml = parseFloat(c.ml), costo = parseFloat(c.costo)
    if (isNaN(ml) || isNaN(costo) || ml <= 0 || costo <= 0) return
    const ns = { ...stockS, [prodId]: (stockS[prodId] || 0) + ml }
    const np = { ...preciosS, [prodId]: costo / ml }
    setStockS(ns); setPreciosS(np); setCompras({ ...compras, [prodId]: { ml: '', costo: '' } })
    await db.appData.put({ key: 'stockSanidad', value: ns })
    await db.appData.put({ key: 'preciosSanidad', value: np })
    const prod = CATALOGO_SANIDAD.find(p => p.id === prodId)
    showToast(`✅ ${fm(ml)} ml de ${prod?.nombre} comprados`)
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 12, color: '#fbbf24' }}>💉 INVENTARIO SANIDAD</div>
        {CATALOGO_SANIDAD.map(prod => {
          const st = stockS[prod.id] || 0, pr = preciosS[prod.id] || 0
          const c = compras[prod.id] || { ml: '', costo: '' }
          return (
            <div key={prod.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <i className={`fa-solid ${prod.icono}`} style={{ color: prod.color, fontSize: '1.2rem', width: 22 }} />
                <div style={{ flex: 1 }}><span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{prod.nombre}</span><span style={{ fontSize: '0.6rem', color: '#a1a1aa', display: 'block' }}>Stock: <b>{fm(st)} ml</b> · $<b>{fm(pr)}/ml</b></span></div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" placeholder="ml" value={c.ml} onChange={e => setCompras({ ...compras, [prod.id]: { ...c, ml: e.target.value } })} style={{ flex: 1, padding: '8px 10px', fontSize: '0.7rem' }} />
                <input type="number" placeholder="Costo $" value={c.costo} onChange={e => setCompras({ ...compras, [prod.id]: { ...c, costo: e.target.value } })} style={{ flex: 1, padding: '8px 10px', fontSize: '0.7rem' }} />
                <button className="btn btn-green" onClick={() => comprar(prod.id)} style={{ width: 'auto', padding: '8px 12px', fontSize: '0.65rem' }}>➕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Sanidad

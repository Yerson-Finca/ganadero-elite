import React, { useState, useEffect } from 'react'
import { db } from './db'
import { fm, getDiet, getGMD, getCostoDiario, getCostoSanidadTotal, AL, IC, NM } from './calculos'

const Precios: React.FC<{ showToast: (m: string) => void }> = ({ showToast }) => {
  const [precios, setPrecios] = useState<Record<string, number>>({})
  const [animales, setAnimales] = useState<any[]>([])
  const [apps, setApps] = useState<any[]>([])
  const [precioKG, setPrecioKG] = useState(9800)

  useEffect(() => { cargar() }, [])
  const cargar = async () => {
    const a = await db.animales.toArray(); setAnimales(a)
    const ap = await db.aplicaciones.toArray(); setApps(ap)
    const cfg = await db.appData.toArray()
    const pr = cfg.find(c => c.key === 'precios')
    const pkg = cfg.find(c => c.key === 'precioKG')
    if (pr) setPrecios(pr.value)
    if (pkg) setPrecioKG(pkg.value)
  }

  const guardar = async () => { await db.appData.put({ key: 'precios', value: precios }); showToast('✅ Precios actualizados') }

  let totalKg = 0, costoTotal = 0
  animales.forEach(a => { const cp = a.historial[a.historial.length - 1].peso; totalKg += cp; costoTotal += getCostoDiario(cp) })
  const csTotal = animales.reduce((s, a) => s + getCostoSanidadTotal(a.id, apps), 0)
  const gmdL = animales.length > 0 ? animales.reduce((s, a) => s + getGMD(a.historial), 0) / animales.length : 0
  const gan = gmdL * 30 * precioKG * animales.length - costoTotal * 30 - csTotal / 12

  return (
    <div className="page">
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 14, color: '#fbbf24' }}>🏷️ PRECIOS ALIMENTOS (COP/kg)</div>
        {AL.map(a => (
          <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <i className={`fa-solid ${IC[a]}`} style={{ width: 18 }} />
            <span style={{ flex: 1, fontSize: '0.78rem' }}>{NM[a]}</span>
            <span style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>$</span>
            <input type="number" value={precios[a] || 0} onChange={e => setPrecios({ ...precios, [a]: parseFloat(e.target.value) || 0 })} style={{ width: 85, textAlign: 'right', padding: '8px 10px' }} />
          </div>
        ))}
        <button className="btn btn-gold mt12" onClick={guardar}>✅ GUARDAR</button>
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10, color: '#a1a1aa' }}>📊 RENTABILIDAD</div>
        <div className="row"><span className="row-label">💰 Valor del lote</span><span className="row-val">$ {fm(totalKg * precioKG)}</span></div>
        <div className="row"><span className="row-label">💉 Sanidad total</span><span className="row-val">$ {fm(csTotal)}</span></div>
        <div className="row"><span className="row-label">📈 Ganancia/mes</span><span className="row-val" style={{ color: gan >= 0 ? '#22c55e' : '#ef4444' }}>$ {fm(gan)}</span></div>
      </div>
    </div>
  )
}

export default Precios

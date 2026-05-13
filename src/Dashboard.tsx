import React, { useState, useEffect } from 'react'
import { db } from './db'
import { fm, getDiet, getGMD, getRendimiento, getEtapa, getCostoDiario, getCostoSanidadTotal, getAlertasSanidad, AL, IC, NM, CATALOGO_SANIDAD } from './calculos'

const Dashboard: React.FC<{ showToast: (m: string) => void; verPerfil: (id: number) => void }> = ({ showToast, verPerfil }) => {
  const [animales, setAnimales] = useState<any[]>([])
  const [precioKG, setPrecioKG] = useState(9800)
  const [precios, setPrecios] = useState<Record<string, number>>({})
  const [apps, setApps] = useState<any[]>([])
  const [newN, setNewN] = useState('')
  const [newW, setNewW] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const a = await db.animales.toArray()
    const ap = await db.aplicaciones.toArray()
    const cfg = await db.appData.toArray()
    setAnimales(a); setApps(ap)
    const pkg = cfg.find(c => c.key === 'precioKG')
    const pr = cfg.find(c => c.key === 'precios')
    if (pkg) setPrecioKG(pkg.value)
    if (pr) setPrecios(pr.value)
  }

  const guardarPrecioKG = async (v: number) => {
    setPrecioKG(v)
    await db.appData.put({ key: 'precioKG', value: v })
  }

  const agregarAnimal = async () => {
    if (!newN || newN.length < 2) return
    const p = parseFloat(newW)
    if (isNaN(p) || p < 20 || p > 2000) return
    await db.animales.add({ nombre: newN, historial: [{ fecha: new Date().toLocaleDateString(), peso: p }] })
    setNewN(''); setNewW(''); setShowAdd(false); cargar()
    showToast(`✅ ${newN} registrado`)
  }

  let totalKg = 0, costoTotal = 0
  const mez: Record<string, number> = {}
  AL.forEach(a => mez[a] = 0)
  const est: Record<string, number> = { verde: 0, azul: 0, naranja: 0, rojo: 0, gris: 0 }
  const alertas: any[] = []

  animales.forEach(a => {
    const cp = a.historial[a.historial.length - 1].peso; totalKg += cp
    const d = getDiet(cp); AL.forEach(k => mez[k] += d[k as keyof typeof d] || 0)
    costoTotal += getCostoDiario(cp)
    const r = getRendimiento(a.historial); est[r.nivel] = (est[r.nivel] || 0) + 1
    getAlertasSanidad(a, apps, CATALOGO_SANIDAD).forEach((al: any) => alertas.push({ nombre: a.nombre, ...al }))
  })

  const csTotal = animales.reduce((s, a) => s + getCostoSanidadTotal(a.id, apps), 0)
  const ta = animales.length
  const gmdL = ta > 0 ? animales.reduce((s, a) => s + getGMD(a.historial), 0) / ta : 0
  const gan = gmdL * 30 * precioKG * ta - costoTotal * 30 - csTotal / 12
  const pctB = ta > 0 ? ((est.verde + est.azul) / ta) * 100 : 0

  return (
    <div className="page">
      <div className="card">
        <div className="row-label mb6" style={{ fontWeight: 600 }}>💰 PRECIO KG EN PIE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>$</span>
          <input type="number" value={precioKG} onChange={e => guardarPrecioKG(parseFloat(e.target.value) || 0)} style={{ fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }} />
          <span style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>COP</span>
        </div>
      </div>

      <button className="btn btn-gold" onClick={() => setShowAdd(!showAdd)}>
        {showAdd ? '✕ CANCELAR' : '➕ NUEVO REGISTRO'}
      </button>

      {showAdd && (
        <div className="card">
          <div className="flex-col gap10">
            <input type="text" placeholder="Nombre del Animal" value={newN} onChange={e => setNewN(e.target.value)} />
            <input type="number" placeholder="Peso Inicial (kg)" value={newW} onChange={e => setNewW(e.target.value)} />
            <button className="btn btn-gold" onClick={agregarAnimal}>✅ GUARDAR</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="row-label mb6" style={{ fontWeight: 600 }}>📊 CAPITAL</div>
        <div className="capital-value">$ {fm(totalKg * precioKG)}</div>
        <div className="stats-grid">
          <div className="stat-item"><div className="row-label">🐄 Cabezas</div><div className="row-val">{ta}</div></div>
          <div className="stat-item"><div className="row-label">⚖️ Peso Total</div><div className="row-val">{fm(totalKg)} kg</div></div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '0.7rem', marginBottom: 10, color: '#a1a1aa' }}>📈 ESTADO</div>
        <div className="estado-simple">
          {['verde', 'azul', 'naranja', 'rojo'].map((n, i) => (
            <div key={n} className={`estado-pildora ${['e','b','r','m'][i]}`}>
              <div className="num">{est[n] || 0}</div>
              <div className="lbl">{['Excelente','Bueno','Regular','Bajo'][i]}</div>
            </div>
          ))}
        </div>
        <div className="progress"><div className="progress-fill" style={{ width: `${pctB}%`, background: '#3b82f6' }} /></div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '0.7rem', marginBottom: 10, color: '#a1a1aa' }}>💰 FINANZAS</div>
        <div className="row"><span className="row-label">Alimentación/día</span><span className="row-val">$ {fm(costoTotal)}</span></div>
        <div className="row"><span className="row-label">Sanidad total</span><span className="row-val">$ {fm(csTotal)}</span></div>
        <div className="row"><span className="row-label">Ganancia neta/mes</span><span className="row-val" style={{ color: gan >= 0 ? '#22c55e' : '#ef4444' }}>$ {fm(gan)}</span></div>
      </div>

      {alertas.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.7rem', marginBottom: 8, color: '#a1a1aa' }}>🔔 ALERTAS</div>
          {alertas.map((al, i) => (
            <div key={i} className={`alert-item alert-${al.t === 'r' ? 'danger' : 'purple'}`}>
              <i className={`fa-solid ${al.icon}`} /><div><b>{al.nombre}:</b> {al.m}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '0.7rem', marginBottom: 10, color: '#fbbf24' }}>🍽️ CONSUMO DIARIO</div>
        {AL.map(a => (
          <div key={a} className="row">
            <span className="row-label"><i className={`fa-solid ${IC[a]}`} /> {NM[a]}</span>
            <span className="row-val">{a === 'pasto' || a === 'salvado' ? (mez[a] || 0).toFixed(1) + ' kg' : Math.round(mez[a] || 0) + ' g'}</span>
          </div>
        ))}
      </div>

      <div className="section-title">📋 INVENTARIO</div>
      <div className="grid">
        {animales.map(a => {
          const cp = a.historial[a.historial.length - 1].peso
          const etapa = getEtapa(cp)
          const r = getRendimiento(a.historial)
          const led = { verde: 'ml-g', azul: 'ml-b', naranja: 'ml-o', rojo: 'ml-r', gris: 'ml-x' }
          return (
            <div key={a.id} className="animal-card" onClick={() => verPerfil(a.id!)}>
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
    </div>
  )
}

export default Dashboard

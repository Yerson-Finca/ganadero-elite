import React, { useState, useEffect } from 'react'
import { db } from './db'
import { fm, getDietaCompleta, getGMD, getRendimiento, getEtapaCompleta, getCostoDiario, predecirPeso, getConfianzaPrediccion, getSemaforo, getDiasDesde, getProgresoEtapa, ALIMENTOS, IC_ALIMENTOS, NM_ALIMENTOS } from './calculos'
import ModalConfirm from './ModalConfirm'
import ModalInput from './ModalInput'
import Icono from './iconos'

interface Props { animalId: number; precioKG: number; preciosAlimento: Record<string, number>; volver: () => void; recargar: () => void }

const Perfil: React.FC<Props> = ({ animalId, precioKG, preciosAlimento, volver, recargar }) => {
  const [a, setA] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [crias, setCrias] = useState<any[]>([])
  const [showDel, setShowDel] = useState(false)
  const [showPesaje, setShowPesaje] = useState(false)
  const [showSup, setShowSup] = useState(false)

  useEffect(() => { cargar() }, [animalId])

  const cargar = async () => {
    const anim = await db.animales.get(animalId)
    const aps = await db.aplicaciones.where('animalId').equals(animalId).toArray()
    setA(anim || null); setApps(aps)
    if (anim?.tipo === 'leche') {
      const crs = await db.animales.filter(x => x.madre === anim.nombre || x.madre === String(anim.id)).toArray()
      setCrias(crs)
    }
  }

  if (!a) return <div className="card">Cargando...</div>

  const p = a.historial[a.historial.length - 1].peso
  const etapa = getEtapaCompleta(p, a.tipo, (a as any).estadoRepro)
  const r = getRendimiento(a.historial)
  const gmd = getGMD(a.historial)
  const dieta = getDietaCompleta(p, a.tipo, (a as any).estadoRepro)
  const cd = getCostoDiario(p, a.tipo, (a as any).estadoRepro, preciosAlimento)
  const valor = p * precioKG
  const gan = gmd * 30 * precioKG - cd * 30
  const pred30 = predecirPeso(a.historial, 30)
  const pred60 = predecirPeso(a.historial, 60)
  const pred90 = predecirPeso(a.historial, 90)
  const conf = getConfianzaPrediccion(a.historial)
  const hayIA = pred30 !== null && pred30 > 0
  const sem = getSemaforo(a)

  const handlePesaje = async (v: string) => { const peso = parseFloat(v); if (isNaN(peso)) return; await db.animales.update(animalId, { historial: [...a.historial, { fecha: new Date().toLocaleDateString(), peso }] }); setShowPesaje(false); cargar() }
  const handleSup = async (v: string) => { const [n, c] = v.split(',').map(x => x.trim()); const cant = parseFloat(c); if (!n || isNaN(cant)) return; await db.aplicaciones.add({ animalId, productoId: 'sup', producto: n, cantidad: cant, unidad: 'g', costo: 0, fecha: new Date().toLocaleDateString(), tipo: 'suplemento' }); setShowSup(false); cargar() }
  const handleDelete = async () => { await db.animales.delete(animalId); setShowDel(false); volver() }

  return (
    <div className="page">
      <div className="card">
        <div className="profile-header">
          <div>
            <div className="profile-name">{a.nombre} {etapa.icono}</div>
            <div className="profile-sub">{etapa.rango} · {a.tipo === 'engorde' ? 'Engorde' : 'Leche'}</div>
          </div>
          <button className="btn btn-sm" style={{ background: 'rgba(255,0,0,0.06)', color: '#ef4444', width: 'auto' }} onClick={() => setShowDel(true)}>🗑️</button>
        </div>

        <div className="profile-stats">
          <div className="profile-stat"><div className="profile-stat-val">{fm(p)} kg</div><div className="profile-stat-lbl">Peso</div></div>
          <div className="profile-stat"><div className="profile-stat-val">{gmd.toFixed(2)}</div><div className="profile-stat-lbl">GMD</div></div>
          <div className="profile-stat"><div className="profile-stat-val">$ {fm(valor)}</div><div className="profile-stat-lbl">Valor</div></div>
        </div>

        {etapa.min !== undefined && (
          <div className="progress"><div className="progress-fill" style={{ width: `${getProgresoEtapa(p, etapa)}%`, background: etapa.color }} /></div>
        )}

        <div className={`alerta-card ${r.color}`}>
          <div className={`alerta-led ${r.color}`}>📊</div>
          <div><div className="alerta-titulo">{r.texto}</div><div className="alerta-met">GMD: {gmd.toFixed(2)} kg/d | +{r.cm.toFixed(1)}%</div></div>
        </div>

        {hayIA && (
          <div className="card card-ia" style={{ marginBottom: 14 }}>
            <div className="section-title"><Icono nombre="sparkles" /> PREDICCIÓN · {conf}</div>
            <div className="proyeccion-grid">
              {[30, 60, 90].map(d => { const proy = p + gmd * d; return <div key={d} className="proyeccion-item"><div className="dias">{d} DÍAS</div><div className="peso">{fm(proy)} kg</div></div> })}
            </div>
          </div>
        )}

        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', marginBottom: 14 }}>
          <div className="section-title">🧪 DIETA DIARIA</div>
          {ALIMENTOS.map(al => {
            const bl = (al === 'urea') && etapa.ureaBloqueada
            return <div key={al} className="row"><span className="row-label">{IC_ALIMENTOS[al]} {NM_ALIMENTOS[al]}</span><span className="row-val" style={bl ? { color: '#6b7280', textDecoration: 'line-through' } : {}}>{bl ? '0 g (🔒)' : al === 'pasto' || al === 'salvado' ? (dieta as any)[al]?.toFixed(1) + ' kg' : Math.round((dieta as any)[al] || 0) + ' g'}</span></div>
          })}
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', marginBottom: 14 }}>
          <div className="section-title">💰 RENTABILIDAD</div>
          <div className="row"><span className="row-label">Costo/día</span><span className="row-val">$ {fm(cd)}</span></div>
          <div className="row"><span className="row-label">Ganancia/mes</span><span className="row-val" style={{ color: gan >= 0 ? '#22c55e' : '#ef4444' }}>$ {fm(gan)}</span></div>
        </div>

        <div className="section-title">🕐 HISTORIAL</div>
        {[...a.historial].reverse().slice(0, 10).map((h: any, i: number) => {
          const idx = a.historial.length - 1 - i
          const cambio = idx > 0 ? ((h.peso - a.historial[idx - 1].peso) / a.historial[idx - 1].peso * 100) : 0
          return <div key={i} className="hist-item"><span>📅 {h.fecha}</span><div>{fm(h.peso)} kg {idx > 0 && <span className={`badge ${cambio >= 0 ? 'badge-up' : 'badge-down'}`}>{cambio >= 0 ? '+' : ''}{cambio.toFixed(1)}%</span>}</div></div>
        })}

        <div className="flex gap8 mt20" style={{ display: 'flex' }}>
          <button className="btn btn-gold flex-1" onClick={() => setShowPesaje(true)}>⚖️ PESAJE</button>
          <button className="btn btn-purple flex-1" onClick={() => setShowSup(true)}>🧪 SUPLEMENTO</button>
        </div>
        <button className="btn btn-gray mt8" onClick={volver}>← VOLVER</button>
      </div>

      <ModalConfirm titulo="Eliminar animal" mensaje={`¿Eliminar a ${a.nombre}?`} onConfirm={handleDelete} onCancel={() => setShowDel(false)} />
      <ModalInput titulo="Nuevo pesaje" placeholder="Peso en kg" tipo="number" onConfirm={handlePesaje} onCancel={() => setShowPesaje(false)} />
      <ModalInput titulo="Agregar suplemento" placeholder="Nombre, cantidad (g)" onConfirm={handleSup} onCancel={() => setShowSup(false)} />
    </div>
  )
}

export default Perfil

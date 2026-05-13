import React, { useState, useEffect } from 'react'
import { db } from './db'
import { fm, getDiet, getGMD, getRendimiento, getEtapa, getCostoDiario, getCostoSanidadDiario, getCostoSanidadTotal, getCkp, getAlertasSanidad, AL, IC, NM, CATALOGO_SANIDAD } from './calculos'

const Perfil: React.FC<{ id: number; showToast: (m: string) => void; onBack: () => void }> = ({ id, showToast, onBack }) => {
  const [a, setA] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    const anim = await db.animales.get(id)
    const aps = await db.aplicaciones.where('animalId').equals(id).toArray()
    setA(anim || null); setApps(aps)
  }

  if (!a) return <div className="card">Cargando...</div>

  const p = a.historial[a.historial.length - 1].peso
  const etapa = getEtapa(p)
  const d = getDiet(p)
  const r = getRendimiento(a.historial)
  const gmd = getGMD(a.historial)
  const cd = getCostoDiario(p)
  const csd = getCostoSanidadDiario(id, apps, CATALOGO_SANIDAD)
  const cst = getCostoSanidadTotal(id, apps)
  const ckp = getCkp(id, apps, CATALOGO_SANIDAD)
  const valor = p * 9800
  const gan = gmd * 30 * 9800 - cd * 30 - cst / 12
  const alertas = getAlertasSanidad(a, apps, CATALOGO_SANIDAD)

  const handlePesaje = async () => {
    const v = prompt('⚖️ Nuevo pesaje (kg):')
    if (!v) return
    const peso = parseFloat(v)
    if (isNaN(peso)) return
    await db.animales.update(id, { historial: [...a.historial, { fecha: new Date().toLocaleDateString(), peso }] })
    cargar(); showToast('✅ Pesaje guardado')
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este animal?')) return
    await db.animales.delete(id); onBack()
  }

  return (
    <div className="page">
      <div className="card">
        <div className="profile-header">
          <div>
            <div className="profile-name">{a.nombre} {etapa.icono}</div>
            <div className="profile-sub">{etapa.rango} · {etapa.nombre}</div>
          </div>
          <button className="btn btn-sm" style={{ background: 'rgba(255,0,0,0.06)', color: '#ef4444' }} onClick={handleDelete}>🗑️</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#a1a1aa', marginBottom: 4 }}>
            <span>Progreso</span><span>Faltan {fm(etapa.max - p)} kg para {etapa.siguienteEtapa}</span>
          </div>
          <div className="progress"><div className="progress-fill" style={{ width: `${((p - etapa.min) / (etapa.max - etapa.min)) * 100}%`, background: etapa.color }} /></div>
        </div>

        <div className={`alerta-card ${r.color}`}>
          <div className={`alerta-led ${r.color}`}>📊</div>
          <div><div className="alerta-titulo">{r.texto}</div><div className="alerta-met">GMD: {gmd.toFixed(2)} kg/d | +{r.cm.toFixed(1)}% | ${fm(ckp)}/kg</div></div>
        </div>

        {alertas.map((al: any, i: number) => (
          <div key={i} className={`alert-item alert-${al.t === 'r' ? 'danger' : 'purple'}`}><i className={`fa-solid ${al.icon}`} /> {al.m}</div>
        ))}

        <div className="mb14">
          <div className="row"><span className="row-label">⚖️ Peso</span><span className="row-val">{fm(p)} kg</span></div>
          <div className="row"><span className="row-label">💰 Valor</span><span className="row-val" style={{ color: '#fbbf24' }}>$ {fm(valor)}</span></div>
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#a1a1aa', marginBottom: 10 }}>📈 PROYECCIÓN</div>
          <div className="proyeccion-grid">
            {[30, 60, 90].map(d => { const proy = p + gmd * d; return <div key={d} className="proyeccion-item"><div className="dias">{d} DÍAS</div><div className="peso">{fm(proy)} kg</div></div> })}
          </div>
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#a1a1aa', marginBottom: 8 }}>RENTABILIDAD</div>
          <div className="row"><span className="row-label">Costo alim./día</span><span className="row-val">$ {fm(cd)}</span></div>
          <div className="row"><span className="row-label">Costo san./día</span><span className="row-val">$ {fm(csd)}</span></div>
          <div className="row"><span className="row-label">Costo/kg</span><span className="row-val">$ {fm(ckp)}</span></div>
          <div className="row"><span className="row-label">Ganancia/mes</span><span className="row-val" style={{ color: gan >= 0 ? '#22c55e' : '#ef4444' }}>$ {fm(gan)}</span></div>
        </div>

        <div className="section-title">🕐 HISTORIAL</div>
        {[...a.historial].reverse().map((h: any, i: number) => {
          const idx = a.historial.length - 1 - i
          const cambio = idx > 0 ? ((h.peso - a.historial[idx - 1].peso) / a.historial[idx - 1].peso * 100) : 0
          return <div key={i} className="hist-item"><span>📅 {h.fecha}</span><div>{fm(h.peso)} kg {idx > 0 && <span className={`badge ${cambio >= 0 ? 'badge-up' : 'badge-down'}`}>{cambio >= 0 ? '+' : ''}{cambio.toFixed(1)}%</span>}</div></div>
        })}

        <div className="section-title">🧪 DIETA</div>
        {AL.map(al => {
          const bl = (al === 'urea' || al === 'melaza') && etapa.ureaBloqueada
          return <div key={al} className="row"><span className="row-label"><i className={`fa-solid ${IC[al]}`} /> {NM[al]}</span><span className="row-val" style={bl ? { color: '#6b7280', textDecoration: 'line-through' } : {}}>{bl ? '0 g (🔒)' : al === 'pasto' || al === 'salvado' ? d[al as keyof typeof d].toFixed(1) + ' kg' : Math.round(d[al as keyof typeof d] || 0) + ' g'}</span></div>
        })}

        <button className="btn btn-gold mt20" onClick={handlePesaje}>⚖️ REGISTRAR PESAJE</button>
      </div>
    </div>
  )
}

export default Perfil

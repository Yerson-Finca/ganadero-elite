import React, { useState, useEffect } from 'react'
import { db } from './db'
import { Animal, fm, getGMD, getDietaCompleta, getCostoDiario, getRendimiento, predecirPeso, getConfianzaPrediccion, getEtapaCompleta, getSemaforo, getDiasDesde, getProgresoEtapa } from './calculos'
import ModalConfirm from './ModalConfirm'
import ModalInput from './ModalInput'

const Icono = ({ nombre, size = 14 }: { nombre: string; size?: number }) => {
  const paths: Record<string, string> = {
    milk: 'M8 2h8M9 2v2.79a4 4 0 0 1-.85 2.54L4.79 12.5A4 4 0 0 0 4 15v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a4 4 0 0 0-.79-2.5l-3.36-5.17A4 4 0 0 1 15 4.79V2',
    sparkles: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0Z',
    leaf: 'M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
    clock: 'M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    scale: 'M3 3v18h18M7 16V8l-4 4M17 16V8l4 4',
    trash: 'M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
    arrowLeft: 'm12 19-7-7 7-7M19 12H5',
    plus: 'M12 5v14M5 12h14',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {(paths[nombre] || '').split(' ').map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

interface Props { animalId: number; precioKG: number; preciosAlimento: Record<string, number>; volver: () => void; recargar: () => void }

const Perfil: React.FC<Props> = ({ animalId, precioKG, preciosAlimento, volver, recargar }) => {
  const [a, setA] = useState<Animal | null>(null)
  const [apps, setApps] = useState<any[]>([])
  const [crias, setCrias] = useState<Animal[]>([])
  const [showDel, setShowDel] = useState(false)
  const [showPesaje, setShowPesaje] = useState(false)
  const [showLeche, setShowLeche] = useState(false)
  const [showSup, setShowSup] = useState(false)

  useEffect(() => { cargar() }, [animalId])

  const cargar = async () => {
    const anim = await db.animales.get(animalId)
    const aps = await db.aplicaciones.where('animalId').equals(animalId).toArray()
    setA(anim || null)
    setApps(aps)
    if (anim?.tipo === 'leche') {
      const crs = await db.animales.filter(x => x.madre === anim.nombre || x.madre === String(anim.id)).toArray()
      setCrias(crs)
    }
  }

  if (!a) return <div className="card text-center" style={{ padding: 40 }}>Cargando...</div>

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
  const litrosHoy = (a as any).produccionLeche?.length > 0 ? (a as any).produccionLeche.slice(-1)[0].litros : 0

  const handlePesaje = async (v: string) => { const peso = parseFloat(v); if (isNaN(peso)) return; await db.animales.update(animalId, { historial: [...a.historial, { fecha: new Date().toLocaleDateString(), peso }] }); setShowPesaje(false); cargar() }
  const handleLeche = async (v: string) => { const l = parseFloat(v); if (isNaN(l)) return; await db.animales.update(animalId, { produccionLeche: [...((a as any).produccionLeche || []), { fecha: new Date().toLocaleDateString(), litros: l }] }); setShowLeche(false); cargar() }
  const handleSup = async (v: string) => { const [n, c] = v.split(',').map(x => x.trim()); const cant = parseFloat(c); if (!n || isNaN(cant)) return; await db.aplicaciones.add({ animalId, productoId: 'sup', producto: n, cantidad: cant, unidad: 'g', costo: 0, fecha: new Date().toLocaleDateString(), tipo: 'suplemento' }); setShowSup(false); cargar() }
  const handleDelete = async () => { await db.animales.delete(animalId); setShowDel(false); volver() }

  return (
    <div className="gap-16" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card">
        <div className="profile-header">
          <div className="avatar avatar-lg" style={{ margin: '0 auto' }}>{a.foto ? <img src={a.foto} alt={a.nombre} /> : etapa.icono}</div>
          <div className="profile-name">{a.nombre}</div>
          <div className="profile-sub">{etapa.rango} · {a.tipo === 'engorde' ? 'Engorde' : 'Leche'}</div>
          <div className="profile-stats">
            <div className="profile-stat"><div className="profile-stat-val">{fm(p)} kg</div><div className="profile-stat-lbl">Peso</div></div>
            <div className="profile-stat"><div className="profile-stat-val">{gmd.toFixed(2)}</div><div className="profile-stat-lbl">GMD</div></div>
            <div className="profile-stat"><div className="profile-stat-val">$ {fm(valor)}</div><div className="profile-stat-lbl">Valor</div></div>
          </div>
          {etapa.min !== undefined && <div className="progress mt-8"><div className="progress-fill" style={{ width: `${getProgresoEtapa(p, etapa)}%`, background: etapa.color }} /></div>}
        </div>
      </div>

      {a.tipo === 'leche' && (a as any).estadoRepro === 'parida' && (
        <div className="card-sm">
          <div className="row"><span className="row-label"><Icono nombre="milk" /> Leche hoy</span><span className="row-val">{litrosHoy} L</span></div>
          <button className="btn btn-success btn-sm w-full mt-8" onClick={() => setShowLeche(true)}><Icono nombre="plus" /> Registrar</button>
        </div>
      )}

      {hayIA && (
        <div className="card card-ia">
          <div className="section-title"><Icono nombre="sparkles" /> PREDICCIÓN · {conf}</div>
          <div className="proyeccion-grid">
            {[{ d: '30', p: pred30 }, { d: '60', p: pred60 }, { d: '90', p: pred90 }].map(({ d, p: pred }) => (
              <div key={d} className="proyeccion-item"><div className="proyeccion-dias">{d} DÍAS</div><div className="proyeccion-peso">{pred ? fm(pred) : '--'} kg</div></div>
            ))}
          </div>
        </div>
      )}

      <div className="card-sm">
        <div className="section-title"><Icono nombre="leaf" /> DIETA DIARIA</div>
        {[
          ['Pasto', (dieta as any).pasto?.toFixed(1) + ' kg'],
          ['Salvado', (dieta as any).salvado?.toFixed(2) + ' kg'],
          ['Melaza', Math.round((dieta as any).melaza || 0) + ' g'],
          ['UREA', Math.round((dieta as any).urea || 0) + ' g' + (etapa.ureaBloqueada ? ' 🔒' : '')],
          ['Bicarbonato', Math.round((dieta as any).bicarb || 0) + ' g'],
          ['Sal Mineral', Math.round((dieta as any).sal || 0) + ' g'],
        ].map(([n, v]) => <div key={n} className="row"><span className="row-label">{n}</span><span className="row-val">{v}</span></div>)}
      </div>

      <div className="card-sm">
        <div className="section-title"><Icono nombre="clock" /> HISTORIAL</div>
        {[...a.historial].reverse().slice(0, 10).map((h, i) => {
          const idx = a.historial.length - 1 - i
          const cambio = idx > 0 ? ((h.peso - a.historial[idx - 1].peso) / a.historial[idx - 1].peso * 100) : 0
          return <div key={i} className="hist-item"><span>{h.fecha}</span><div>{fm(h.peso)} kg {idx > 0 && <span className={`badge ml-4 ${cambio >= 0 ? 'badge-up' : 'badge-down'}`}>{cambio >= 0 ? '+' : ''}{cambio.toFixed(1)}%</span>}</div></div>
        })}
      </div>

      <div className="gap-8" style={{ display: 'flex' }}>
        <button className="btn btn-success flex-1" onClick={() => setShowPesaje(true)}><Icono nombre="scale" /> Pesaje</button>
        <button className="btn btn-sm w-full" onClick={() => setShowSup(true)}><Icono nombre="plus" /> Suplemento</button>
        <button className="btn-icon btn-icon-danger" onClick={() => setShowDel(true)}><Icono nombre="trash" size={16} /></button>
      </div>

      <button className="btn btn-sm w-full" onClick={volver}><Icono nombre="arrowLeft" /> Volver</button>

      <ModalConfirm open={showDel} titulo="Eliminar animal" mensaje={`¿Eliminar a ${a.nombre}?`} onConfirm={handleDelete} onCancel={() => setShowDel(false)} />
      <ModalInput open={showPesaje} titulo="Nuevo pesaje" placeholder="Peso en kg" tipo="number" onConfirm={handlePesaje} onCancel={() => setShowPesaje(false)} />
      <ModalInput open={showLeche} titulo="Registrar leche" placeholder="Litros" tipo="number" onConfirm={handleLeche} onCancel={() => setShowLeche(false)} />
      <ModalInput open={showSup} titulo="Agregar suplemento" placeholder="Nombre, cantidad (g)" onConfirm={handleSup} onCancel={() => setShowSup(false)} />
    </div>
  )
}

export default Perfil

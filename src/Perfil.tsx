import React, { useState, useEffect } from 'react'
import { db } from './db'
import {
  Animal, fm, getGMD, getDietaCompleta, getCostoDiario, getRendimiento,
  predecirPeso, getConfianzaPrediccion, getTendenciaTexto, getEtapaCompleta,
  getSemaforo, getDiasDesde, getProgresoEtapa, detectarAnomalia, CATALOGO_SANIDAD
} from './calculos'
import Icono from './iconos'
import ModalConfirm from './ModalConfirm'
import ModalInput from './ModalInput'

interface Props {
  animalId: number
  precioKG: number
  litroLeche: number
  preciosAlimento: Record<string, number>
  volver: () => void
  recargar: () => void
}

const Perfil: React.FC<Props> = ({ animalId, precioKG, litroLeche, preciosAlimento, volver, recargar }) => {
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [aplicaciones, setAplicaciones] = useState<any[]>([])
  const [suplementosAnimal, setSuplementosAnimal] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [crias, setCrias] = useState<Animal[]>([])
  const [showDelete, setShowDelete] = useState(false)
  const [showPesaje, setShowPesaje] = useState(false)
  const [showLeche, setShowLeche] = useState(false)
  const [showSuplemento, setShowSuplemento] = useState(false)

  useEffect(() => { cargarDatos() }, [animalId])

  const cargarDatos = async () => {
    const a = await db.animales.get(animalId)
    const apps = await db.aplicaciones.where('animalId').equals(animalId).toArray()
    const lts = await db.lotes.toArray()
    setAnimal(a || null)
    setAplicaciones(apps.filter(x => x.tipo === 'sanidad').reverse().slice(0, 5))
    setSuplementosAnimal(apps.filter(x => x.tipo === 'suplemento').reverse())
    setLotes(lts)
    setCargando(false)
    if (a && a.tipo === 'leche') {
      const c = await db.animales.filter(x => x.madre === a.nombre || x.madre === String(a.id)).toArray()
      setCrias(c)
    }
  }

  if (cargando || !animal) return <div className="card text-center" style={{ padding: 40 }}>Cargando...</div>

  const p = animal.historial[animal.historial.length - 1].peso
  const etapa = getEtapaCompleta(p, animal.tipo, animal.estadoRepro)
  const r = getRendimento(animal.historial)
  const gmd = getGMD(animal.historial)
  const dieta = getDietaCompleta(p, animal.tipo, animal.estadoRepro)
  const cd = getCostoDiario(p, animal.tipo, animal.estadoRepro, preciosAlimento)
  const cst = aplicaciones.reduce((s: number, app: any) => s + (app.costo || 0), 0)
  const gan = gmd * 30 * precioKG - (cd * 30) - (cst / 12)
  const valorActual = p * precioKG
  const pred30 = predecirPeso(animal.historial, 30)
  const pred60 = predecirPeso(animal.historial, 60)
  const pred90 = predecirPeso(animal.historial, 90)
  const confianza = getConfianzaPrediccion(animal.historial)
  const hayIA = pred30 !== null && pred30 > 0
  const semaforo: any = getSemaforo(animal) || null
  const loteActual = lotes.find(l => l.id === animal.lote)
  const litrosHoy = animal.produccionLeche && animal.produccionLeche.length > 0
    ? animal.produccionLeche[animal.produccionLeche.length - 1].litros : 0

  const handlePesaje = async (valor: string) => {
    const peso = parseFloat(valor)
    if (isNaN(peso) || peso < 20 || peso > 2000) return
    await db.animales.update(animalId, { historial: [...animal.historial, { fecha: new Date().toLocaleDateString(), peso }] })
    setShowPesaje(false)
    cargarDatos()
  }

  const handleLeche = async (valor: string) => {
    const litros = parseFloat(valor)
    if (isNaN(litros) || litros < 0) return
    await db.animales.update(animalId, { produccionLeche: [...(animal.produccionLeche || []), { fecha: new Date().toLocaleDateString(), litros }] })
    setShowLeche(false)
    cargarDatos()
  }

  const handleSuplemento = async (valor: string) => {
    if (!valor.trim()) return
    const partes = valor.split(',')
    const nombre = partes[0]?.trim()
    const cantidad = parseFloat(partes[1]?.trim() || '0')
    if (!nombre || isNaN(cantidad) || cantidad <= 0) return
    await db.aplicaciones.add({
      animalId, productoId: 'suplemento', producto: nombre,
      cantidad, unidad: 'g', costo: 0,
      fecha: new Date().toLocaleDateString(), tipo: 'suplemento'
    })
    setShowSuplemento(false)
    cargarDatos()
  }

  const handleDelete = async () => {
    await db.animales.delete(animalId)
    setShowDelete(false)
    volver()
  }

  return (
    <div className="gap-16" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="card">
        <div className="profile-header">
          <div className="avatar avatar-lg" style={{ margin: '0 auto' }}>
            {animal.foto ? <img src={animal.foto} alt={animal.nombre} /> : etapa.icono}
          </div>
          <div className="profile-name">{animal.nombre}</div>
          <div className="profile-sub">{etapa.rango} · {animal.tipo === 'engorde' ? 'Engorde' : 'Leche'}</div>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-val">{fm(p)} kg</div>
              <div className="profile-stat-lbl">Peso</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-val">{gmd.toFixed(2)}</div>
              <div className="profile-stat-lbl">GMD</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-val">$ {fm(valorActual)}</div>
              <div className="profile-stat-lbl">Valor</div>
            </div>
          </div>
          {etapa.min !== undefined && (
            <div className="progress mt-12">
              <div className="progress-fill" style={{ width: `${getProgresoEtapa(p, etapa)}%`, background: etapa.color }} />
            </div>
          )}
        </div>
      </div>

      {/* Leche */}
      {animal.tipo === 'leche' && animal.estadoRepro === 'parida' && (
        <div className="card-sm">
          <div className="row">
            <span className="row-label"><Icono nombre="milk" tamaño={14} /> Leche hoy</span>
            <span className="row-val">{litrosHoy} L</span>
          </div>
          <button className="btn btn-success btn-sm w-full mt-8" onClick={() => setShowLeche(true)}>
            <Icono nombre="plus" tamaño={14} /> Registrar litros
          </button>
        </div>
      )}

      {/* IA */}
      {hayIA && (
        <div className="card-ia">
          <div className="section-title"><Icono nombre="sparkles" tamaño={14} /> PREDICCIÓN · {confianza}</div>
          <div className="proyeccion-grid">
            {[{ d: '30', p: pred30 }, { d: '60', p: pred60 }, { d: '90', p: pred90 }].map(({ d, p: pred }) => (
              <div key={d} className="proyeccion-item">
                <div className="proyeccion-dias">{d} DÍAS</div>
                <div className="proyeccion-peso">{pred ? fm(pred) : '--'} kg</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dieta */}
      <div className="card-sm">
        <div className="section-title"><Icono nombre="leaf" tamaño={14} /> DIETA DIARIA</div>
        {[
          { icon: 'leaf', name: 'Pasto', val: dieta.pasto.toFixed(1) + ' kg' },
          { icon: 'wheat', name: 'Salvado', val: dieta.salvado.toFixed(2) + ' kg' },
          { icon: 'droplet', name: 'Melaza', val: Math.round(dieta.melaza) + ' g' },
          { icon: 'flask', name: 'UREA', val: Math.round(dieta.urea) + ' g' + (etapa.ureaBloqueada ? ' 🔒' : '') },
          { icon: 'cube-solid', name: 'Bicarbonato', val: Math.round(dieta.bicarb) + ' g' },
          { icon: 'diamond', name: 'Sal Mineral', val: Math.round(dieta.sal) + ' g' },
        ].map(({ icon, name, val }) => (
          <div key={name} className="row">
            <span className="row-label"><Icono nombre={icon} tamaño={14} /> {name}</span>
            <span className="row-val">{val}</span>
          </div>
        ))}
      </div>

      {/* Suplementos */}
      <div className="card-sm">
        <div className="section-title"><Icono nombre="flask" tamaño={14} /> SUPLEMENTOS</div>
        {suplementosAnimal.length > 0 && suplementosAnimal.map((s: any, i: number) => (
          <div key={i} className="row">
            <span className="row-label">{s.producto}</span>
            <span className="row-val">{s.cantidad}g</span>
          </div>
        ))}
        <button className="btn btn-sm w-full mt-8" onClick={() => setShowSuplemento(true)}>
          <Icono nombre="plus" tamaño={14} /> Agregar
        </button>
      </div>

      {/* Historial */}
      <div className="card-sm">
        <div className="section-title"><Icono nombre="clock" tamaño={14} /> HISTORIAL</div>
        {[...animal.historial].reverse().slice(0, 10).map((h, i) => {
          const idx = animal.historial.length - 1 - i
          const cambio = idx > 0 ? ((h.peso - animal.historial[idx - 1].peso) / animal.historial[idx - 1].peso * 100) : 0
          return (
            <div key={i} className="hist-item">
              <span>{h.fecha}</span>
              <div>
                <span>{fm(h.peso)} kg</span>
                {idx > 0 && <span className={`badge ml-4 ${cambio >= 0 ? 'badge-up' : 'badge-down'}`}>{cambio >= 0 ? '+' : ''}{cambio.toFixed(1)}%</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Acciones */}
      <div className="gap-8" style={{ display: 'flex' }}>
        <button className="btn btn-success flex-1" onClick={() => setShowPesaje(true)}>
          <Icono nombre="scale" tamaño={16} /> Pesaje
        </button>
        <button className="btn btn-icon btn-icon-danger" onClick={() => setShowDelete(true)}>
          <Icono nombre="trash" tamaño={18} />
        </button>
      </div>

      <button className="btn btn-sm w-full" onClick={volver}>
        <Icono nombre="arrow-left" tamaño={16} /> Volver
      </button>

      {/* Modales */}
      {showDelete && (
        <ModalConfirm
          titulo="Eliminar animal"
          mensaje={`¿Eliminar a ${animal.nombre}? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
      {showPesaje && (
        <ModalInput
          titulo="Nuevo pesaje"
          placeholder="Peso en kg"
          tipo="number"
          onConfirm={handlePesaje}
          onCancel={() => setShowPesaje(false)}
        />
      )}
      {showLeche && (
        <ModalInput
          titulo="Registrar leche"
          placeholder="Litros"
          tipo="number"
          onConfirm={handleLeche}
          onCancel={() => setShowLeche(false)}
        />
      )}
      {showSuplemento && (
        <ModalInput
          titulo="Agregar suplemento"
          placeholder="Nombre, cantidad (g)"
          onConfirm={handleSuplemento}
          onCancel={() => setShowSuplemento(false)}
        />
      )}
    </div>
  )
}

export default Perfil

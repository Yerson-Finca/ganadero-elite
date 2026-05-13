import React, { useState, useEffect } from 'react'
import { db } from './db'
import {
  Animal, fm, getGMD, getDietaCompleta, getCostoDiario, getRendimiento,
  predecirPeso, getConfianzaPrediccion, getTendenciaTexto, getEtapaCompleta,
  getSemaforo, getDiasDesde, getProgresoEtapa, detectarAnomalia, CATALOGO_SANIDAD
} from './calculos'
import Icono from './iconos'

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

  useEffect(() => {
    cargarDatos()
  }, [animalId])

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

  if (cargando || !animal) {
    return (
      <div className="card text-center py-10">
        <div className="text-text-muted">Cargando...</div>
      </div>
    )
  }

  const p = animal.historial[animal.historial.length - 1].peso
  const etapa = getEtapaCompleta(p, animal.tipo, animal.estadoRepro)
  const r = getRendimiento(animal.historial)
  const gmd = getGMD(animal.historial)
  const dieta = getDietaCompleta(p, animal.tipo, animal.estadoRepro)
  const cd = getCostoDiario(p, animal.tipo, animal.estadoRepro, preciosAlimento)
  const cst = aplicaciones.reduce((s: number, app: any) => s + (app.costo || 0), 0)
  const ckp = gmd > 0 ? cd / gmd : 999999
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

  // Edad y origen
  const edadHTML = () => {
    const parts: React.ReactNode[] = []
    if (animal.origen === 'nacimiento' && animal.fechaNacimiento) {
      const diasEdad = getDiasDesde(animal.fechaNacimiento)
      parts.push(
        <div className="row" key="edad">
          <span className="row-label">🎂 Edad</span>
          <span className="row-val">{Math.floor(diasEdad / 30)} meses ({diasEdad} d)</span>
        </div>
      )
    }
    if (animal.origen === 'comprado' && animal.precioCompra) {
      const roi = ((valorActual - animal.precioCompra - cst) / animal.precioCompra * 100).toFixed(1)
      parts.push(
        <div className="row" key="roi">
          <span className="row-label">💰 ROI</span>
          <span className="row-val" style={{ color: parseFloat(roi) >= 0 ? '#22C55E' : '#EF4444' }}>{roi}%</span>
        </div>
      )
    }
    return parts
  }

  // Registrar pesaje
  const registrarPesaje = async () => {
    const pesoStr = prompt('⚖️ Nuevo pesaje (kg):')
    if (!pesoStr) return
    const peso = parseFloat(pesoStr)
    if (isNaN(peso) || peso < 20 || peso > 2000) { alert('⚠️ Peso 20-2000 kg'); return }
    const nuevoHistorial = [...animal.historial, { fecha: new Date().toLocaleDateString(), peso }]
    await db.animales.update(animalId, { historial: nuevoHistorial })
    if ((window as any).haptic) (window as any).haptic()
    cargarDatos()
  }

  // Eliminar
  const eliminarAnimal = async () => {
    if (!confirm('⚠️ ¿Eliminar este animal?')) return
    await db.animales.delete(animalId)
    if ((window as any).haptic) (window as any).haptic()
    volver()
  }

  // Cambiar lote
  const cambiarLote = async (loteId: string | null) => {
    await db.animales.update(animalId, { lote: loteId })
    cargarDatos()
    if ((window as any).haptic) (window as any).haptic()
  }

  // Aplicar sanidad
  const aplicarSanidad = async () => {
    const cat = [...CATALOGO_SANIDAD]
    const productoId = prompt('💉 Producto:\n' + cat.map(p => `${p.id}: ${p.nombre}`).join('\n'))
    if (!productoId) return
    const prod = cat.find(p => p.id === productoId)
    if (!prod) { alert('Producto no encontrado'); return }
    const mlStr = prompt(`ml a aplicar de ${prod.nombre}:`)
    if (!mlStr) return
    const ml = parseFloat(mlStr)
    if (isNaN(ml) || ml <= 0) { alert('⚠️ ml válidos'); return }
    await db.aplicaciones.add({
      animalId, productoId: prod.id, producto: prod.nombre,
      cantidad: ml, unidad: 'ml', costo: 0,
      fecha: new Date().toLocaleDateString(), tipo: 'sanidad'
    })
    if ((window as any).haptic) (window as any).haptic()
    cargarDatos()
  }

  // Agregar suplemento manual
  const agregarSuplemento = async () => {
    const nombre = prompt('🧪 Nombre del suplemento:')
    if (!nombre) return
    const cantidad = parseFloat(prompt('📏 Cantidad (g):') || '0')
    if (isNaN(cantidad) || cantidad <= 0) return
    await db.aplicaciones.add({
      animalId, productoId: 'suplemento', producto: nombre,
      cantidad, unidad: 'g', costo: 0,
      fecha: new Date().toLocaleDateString(), tipo: 'suplemento'
    })
    if ((window as any).haptic) (window as any).haptic()
    cargarDatos()
  }

  // Foto
  const abrirFoto = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (ev) => {
        await db.animales.update(animalId, { foto: ev.target?.result as string })
        cargarDatos()
        if ((window as any).haptic) (window as any).haptic()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  // Leche
  const registrarLeche = async () => {
    const litrosStr = prompt('🥛 Litros producidos hoy:')
    if (!litrosStr) return
    const litros = parseFloat(litrosStr)
    if (isNaN(litros) || litros < 0) { alert('⚠️ Litros válidos'); return }
    const nuevaProd = [...(animal.produccionLeche || []), { fecha: new Date().toLocaleDateString(), litros }]
    await db.animales.update(animalId, { produccionLeche: nuevaProd })
    if ((window as any).haptic) (window as any).haptic()
    cargarDatos()
  }

  // Reproductivas
  const quedoPrenada = async () => {
    if (!confirm('🤰 ¿Confirmar preñez?')) return
    const hoy = new Date()
    const parto = new Date(hoy.getTime() + 285 * 86400000)
    const secado = new Date(parto.getTime() - 60 * 86400000)
    await db.animales.update(animalId, {
      fechaPrenez: hoy.toLocaleDateString(),
      fechaPartoEstimada: parto.toLocaleDateString(),
      fechaSecado: secado.toLocaleDateString()
    })
    if ((window as any).haptic) (window as any).haptic()
    cargarDatos()
  }

  const yaPario = async () => {
    if (!confirm('✅ ¿Confirmar parto?')) return
    await db.animales.update(animalId, {
      estadoRepro: 'parida',
      fechaParto: new Date().toLocaleDateString(),
      fechaPrenez: null, fechaPartoEstimada: null, fechaSecado: null
    })
    if (confirm('🐮 ¿Registrar cría?')) {
      const pesoCria = parseFloat(prompt('⚖️ Peso al nacer (kg):') || '0')
      if (!isNaN(pesoCria) && pesoCria > 10) {
        const nombreCria = prompt('📝 Nombre:') || ('Cría de ' + animal.nombre)
        await db.animales.add({
          nombre: nombreCria || 'Cría', tipo: 'leche', origen: 'nacimiento',
          madre: animal.nombre, fechaNacimiento: new Date().toLocaleDateString(),
          historial: [{ fecha: new Date().toLocaleDateString(), peso: pesoCria }],
          estadoRepro: 'novilla', lote: animal.lote, produccionLeche: [], foto: null
        })
      }
    }
    if ((window as any).haptic) (window as any).haptic()
    cargarDatos()
  }

  return (
    <div>
      {/* Header perfil - CENTRADO */}
      <div className="card">
        <div className="profile-cover">
          <div className="profile-avatar cursor-pointer" onClick={abrirFoto}>
            {animal.foto ? <img src={animal.foto} alt={animal.nombre} className="w-full h-full object-cover" /> : <span className="text-3xl">{etapa.icono}</span>}
          </div>
          <div className="profile-name text-center">{animal.nombre}</div>
          <div className="profile-sub text-center">
            {animal.tipo === 'engorde' ? '🥩 Engorde' : '🥛 Leche'} · {etapa.rango}
            {semaforo && (
              <>
                <span className={`semaforo semaforo-${semaforo.color} ml-2`} />
                <span className="text-xs ml-1">{semaforo.texto}</span>
              </>
            )}
          </div>
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
            <>
              <div className="progress">
                <div className="progress-fill" style={{ width: `${getProgresoEtapa(p, etapa)}%`, background: etapa.color }} />
              </div>
              <div className="text-[0.6rem] text-text-muted text-center mt-1">
                Faltan {fm((etapa.max || 9999) - p)} kg para {etapa.siguienteEtapa}
              </div>
            </>
          )}
        </div>
        {edadHTML()}
        <div className="row">
          <span className="row-label">📊 Lote</span>
          <span className="row-val">{loteActual ? loteActual.nombre : 'Sin lote'}</span>
        </div>
      </div>

      {/* Leche */}
      {animal.tipo === 'leche' && animal.estadoRepro === 'parida' && (
        <div className="card-sm mb-3" style={{ background: 'rgba(184,148,106,0.05)', borderColor: 'rgba(184,148,106,0.2)' }}>
          <div className="font-bold text-xs text-text-primary mb-2">🥛 PRODUCCIÓN LECHE</div>
          <div className="row">
            <span className="row-label">Litros hoy</span>
            <span className="row-val">{litrosHoy} L</span>
          </div>
          <button className="btn btn-green btn-sm w-full mt-2" onClick={registrarLeche}>
            ➕ REGISTRAR LITROS
          </button>
        </div>
      )}

      {/* Crías */}
      {crias.length > 0 && (
        <div className="card-sm mb-3">
          <div className="section-title">👶 CRÍAS ({crias.length})</div>
          {crias.map(c => (
            <div key={c.id} className="row">
              <span className="row-label">{c.nombre}</span>
              <span className="row-val">{fm(c.historial[c.historial.length - 1].peso)} kg</span>
            </div>
          ))}
        </div>
      )}

      {/* Alerta rendimiento */}
      <div className={`alerta-card alerta-card-${r.color}`}>
        <div className={`alerta-led alerta-led-${r.color}`}>{r.icono}</div>
        <div>
          <div className="alerta-titulo">{r.texto}</div>
          <div className="alerta-met">{r.cm >= 0 ? '+' : ''}{r.cm.toFixed(1)}% · ${fm(ckp)}/kg</div>
        </div>
      </div>

      {/* IA */}
      {hayIA ? (
        <div className="ia-card">
          <div className="ia-title">🧠 PREDICCIÓN IA · {confianza}</div>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {[{ dias: '30', pred: pred30 }, { dias: '60', pred: pred60 }, { dias: '90', pred: pred90 }].map(item => {
              const ganPred = item.pred ? (item.pred - p) * precioKG : 0
              return (
                <div key={item.dias} className="proyeccion-item">
                  <div className="proyeccion-dias">{item.dias} DÍAS</div>
                  <div className="proyeccion-peso">{item.pred ? fm(item.pred) : '--'} kg</div>
                  <div className="proyeccion-ganancia" style={{ color: ganPred >= 0 ? '#22C55E' : '#EF4444' }}>
                    {ganPred >= 0 ? '+' : ''}$ {fm(Math.abs(ganPred))}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-[0.6rem] text-text-muted text-center">
            📊 {getTendenciaTexto(animal.historial)} · {animal.historial.length} pesajes
          </div>
        </div>
      ) : animal.historial.length >= 1 && (
        <div className="card-sm mb-3">
          <div className="font-bold text-xs text-text-primary mb-2">📈 PROYECCIÓN SIMPLE</div>
          <div className="grid grid-cols-3 gap-1.5">
            {[30, 60, 90].map(d => {
              const pred = p + (gmd * d)
              const ganPred = (pred - p) * precioKG
              return (
                <div key={d} className="proyeccion-item">
                  <div className="proyeccion-dias">{d} DÍAS</div>
                  <div className="proyeccion-peso">{fm(pred)} kg</div>
                  <div className="proyeccion-ganancia" style={{ color: ganPred >= 0 ? '#22C55E' : '#EF4444' }}>
                    {ganPred >= 0 ? '+' : ''}$ {fm(Math.abs(ganPred))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Alerta venta */}
      {p >= 500 && animal.tipo === 'engorde' && (
        <div className="alert-item alert-danger mb-3">💰 ¡VENDER! {fm(p)}kg · Est. $ {fm(valorActual)}</div>
      )}

      {/* DIETA DIARIA */}
      <div className="card-sm mb-3">
        <div className="font-bold text-xs text-text-primary mb-2">🧪 DIETA DIARIA</div>
        <div className="row"><span className="row-label">🌱 Pasto</span><span className="row-val">{(dieta.pasto || 0).toFixed(1)} kg</span></div>
        <div className="row"><span className="row-label">🌾 Salvado</span><span className="row-val">{(dieta.salvado || 0).toFixed(2)} kg</span></div>
        <div className="row"><span className="row-label">💧 Melaza</span><span className="row-val">{Math.round(dieta.melaza || 0)} g</span></div>
        <div className="row">
          <span className="row-label">⚗️ UREA</span>
          <span className="row-val" style={etapa.ureaBloqueada ? { color: '#6B6058', textDecoration: 'line-through' } : {}}>
            {etapa.ureaBloqueada ? '0 g (🔒)' : Math.round(dieta.urea || 0) + ' g'}
          </span>
        </div>
        <div className="row"><span className="row-label">🧂 Sal Mineral</span><span className="row-val">{Math.round(dieta.sal || 0)} g</span></div>
      </div>

      {/* SUPLEMENTOS APLICADOS */}
      {suplementosAnimal.length > 0 && (
        <div className="mb-3">
          <div className="section-title">🧪 SUPLEMENTOS APLICADOS</div>
          {suplementosAnimal.map((s: any, i: number) => (
            <div key={i} className="aplicacion-item">
              <span>{s.producto}</span>
              <span className="text-[0.6rem]">{s.cantidad}g · {s.fecha}</span>
            </div>
          ))}
        </div>
      )}

      {/* Rentabilidad */}
      <div className="card-sm mb-3">
        <div className="font-bold text-xs text-text-primary mb-2">💰 RENTABILIDAD</div>
        <div className="row">
          <span className="row-label">Costo/día</span>
          <span className="row-val">$ {fm(cd)}</span>
        </div>
        <div className="row">
          <span className="row-label">Ganancia/mes</span>
          <span className="row-val" style={{ color: gan >= 0 ? '#22C55E' : '#EF4444' }}>$ {fm(gan)}</span>
        </div>
      </div>

      {/* Aplicaciones sanidad */}
      {aplicaciones.length > 0 && (
        <div className="mb-3">
          <div className="section-title">💉 SANIDAD</div>
          {aplicaciones.map((app: any, i: number) => (
            <div key={i} className="aplicacion-item">
              <span>{app.producto}</span>
              <span className="text-[0.6rem]">{app.cantidad}ml · {app.fecha}</span>
            </div>
          ))}
        </div>
      )}

      {/* Historial */}
      <div className="mb-3">
        <div className="section-title">🕐 HISTORIAL</div>
        {[...animal.historial].reverse().map((h, i) => {
          const idx = animal.historial.length - 1 - i
          const cambio = idx > 0 ? ((h.peso - animal.historial[idx - 1].peso) / animal.historial[idx - 1].peso * 100) : 0
          return (
            <div key={i} className="hist-item">
              <span>📅 {h.fecha}</span>
              <div>
                <span className="row-val">{fm(h.peso)} kg</span>
                {idx > 0 && (
                  <span className={`badge ml-2 ${cambio >= 0 ? 'badge-up' : 'badge-down'}`}>
                    {cambio >= 0 ? '+' : ''}{cambio.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2 mb-3">
        <button className="btn btn-purple btn-sm flex-1" onClick={aplicarSanidad}>💉 Sanidad</button>
        <button className="btn btn-green btn-sm flex-[2]" onClick={registrarPesaje}>⚖️ PESAJE</button>
      </div>

      {/* Agregar suplemento */}
      <button className="btn btn-sm bg-transparent text-text-primary border border-border w-full mb-3" onClick={agregarSuplemento}>
        ➕ AGREGAR SUPLEMENTO
      </button>

      {/* Reproductivas */}
      <div className="flex gap-2 mb-3">
        {animal.tipo === 'leche' && animal.estadoRepro === 'parida' && semaforo && semaforo.dias >= 60 && !animal.fechaPrenez && (
          <button className="btn btn-purple btn-sm flex-1" onClick={quedoPrenada}>👶 Preñada</button>
        )}
        {animal.tipo === 'leche' && animal.estadoRepro === 'seca' && (
          <button className="btn btn-green btn-sm flex-1" onClick={yaPario}>✅ Parió</button>
        )}
      </div>

      {/* Cambiar lote */}
      <div className="card-sm mb-3">
        <div className="font-bold text-xs text-text-primary mb-2">📊 CAMBIAR LOTE</div>
        <div className="flex flex-wrap gap-1.5">
          {lotes.filter(l => l.tipo === animal.tipo).map(l => (
            <button key={l.id} className={`btn btn-sm ${animal.lote === l.id ? 'btn-green' : 'btn-gray'}`} onClick={() => cambiarLote(l.id)}>
              {l.nombre}
            </button>
          ))}
          <button className={`btn btn-sm ${!animal.lote ? 'btn-green' : 'btn-gray'}`} onClick={() => cambiarLote(null)}>Sin lote</button>
        </div>
      </div>

      {/* Eliminar */}
      <button className="btn btn-danger btn-sm w-full mb-3" onClick={eliminarAnimal}>🗑️ ELIMINAR ANIMAL</button>

      {/* Volver */}
      <button className="btn btn-gray w-full" onClick={volver}>← VOLVER</button>
    </div>
  )
}

export default Perfil

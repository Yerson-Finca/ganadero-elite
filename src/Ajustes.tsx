import React, { useState, useEffect } from 'react'
import { db, Lote } from './db'
import { fm } from './calculos'
import Icono from './iconos'

interface Props {
  recargar: () => void
  animales: any[]
}

const Ajustes: React.FC<Props> = ({ recargar, animales }) => {
  const [lotes, setLotes] = useState<Lote[]>([])

  useEffect(() => {
    db.lotes.toArray().then(setLotes)
  }, [])

  const crearLote = async () => {
    const nombre = prompt('Nombre del lote:')
    if (!nombre) return
    const tipo = prompt('Tipo (engorde/leche):') || 'engorde'
    await db.lotes.add({ id: 'lote_' + Date.now(), nombre, tipo: tipo as any })
    db.lotes.toArray().then(setLotes)
    if ((window as any).haptic) (window as any).haptic()
  }

  const eliminarLote = async (id: string) => {
    if (!confirm('⚠️ ¿Eliminar lote? Los animales quedarán sin lote.')) return
    await db.lotes.delete(id)
    db.lotes.toArray().then(setLotes)
    if ((window as any).haptic) (window as any).haptic()
  }

  const exportarDatos = async () => {
    const data = {
      animales: await db.animales.toArray(),
      lotes: await db.lotes.toArray(),
      aplicaciones: await db.aplicaciones.toArray(),
      suplementosAlimento: await db.suplementosAlimento.toArray(),
      suplementosSanidad: await db.suplementosSanidad.toArray(),
      appData: await db.appData.toArray()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ganadero-elite-respaldo.json'
    a.click()
    if ((window as any).haptic) (window as any).haptic()
  }

  const importarDatos = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          if (data.animales) {
            await db.animales.clear()
            await db.animales.bulkAdd(data.animales)
          }
          if (data.lotes) {
            await db.lotes.clear()
            await db.lotes.bulkAdd(data.lotes)
          }
          if (data.appData) {
            await db.appData.clear()
            await db.appData.bulkAdd(data.appData)
          }
          recargar()
          alert('✅ Datos importados correctamente')
        } catch (err) {
          alert('❌ Error al leer el archivo')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const instalarApp = () => {
    if ((window as any).deferredPrompt) {
      (window as any).deferredPrompt.prompt()
    } else {
      alert('📱 La app ya está instalada o no está disponible.')
    }
  }

  return (
    <div>
      {/* Lotes */}
      <div className="config-section">
        <h3><Icono nombre="cube" tamaño={14} /> LOTES</h3>
        {lotes.length === 0 && (
          <div className="text-text-muted text-xs py-2">No hay lotes creados</div>
        )}
        {lotes.map(l => {
          const count = animales.filter(a => a.lote === l.id).length
          return (
            <div key={l.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
              <span>{l.tipo === 'engorde' ? '🥩' : '🥛'}</span>
              <span className="flex-1 text-sm">{l.nombre} ({count})</span>
              <button className="btn btn-danger btn-sm !py-1 !px-2" onClick={() => eliminarLote(l.id)}>
                <Icono nombre="trash" tamaño={12} />
              </button>
            </div>
          )
        })}
        <button className="btn btn-purple btn-sm w-full mt-2" onClick={crearLote}>
          <Icono nombre="plus" tamaño={14} /> CREAR LOTE
        </button>
      </div>

      {/* Respaldos */}
      <div className="config-section">
        <h3><Icono nombre="arrow-up-tray" tamaño={14} /> RESPALDO</h3>
        <button className="btn btn-purple w-full mb-2" onClick={exportarDatos}>
          <Icono nombre="arrow-up-tray" tamaño={16} /> EXPORTAR DATOS
        </button>
        <button className="btn btn-gray w-full" onClick={importarDatos}>
          <Icono nombre="arrow-down-tray" tamaño={16} /> IMPORTAR DATOS
        </button>
      </div>

      {/* Instalar */}
      <div className="config-section">
        <h3><Icono nombre="arrow-down-tray" tamaño={14} /> INSTALAR</h3>
        <button className="btn btn-purple w-full" onClick={instalarApp}>
          📱 INSTALAR PWA
        </button>
      </div>

      {/* Info */}
      <div className="config-section">
        <h3><Icono nombre="sparkles" tamaño={14} variante="solid" /> INFORMACIÓN</h3>
        <p className="text-sm text-text-secondary">👑 GANADERO ÉLITE v6.0</p>
        <p className="text-xs text-text-muted">🥩 Engorde + 🥛 Leche · 🧠 IA Predictiva</p>
        <p className="text-xs text-text-muted">📡 100% Offline · React + TypeScript + Tailwind</p>
        <p className="text-xs text-text-muted mt-1">
          Animales: {animales.length} · Lotes: {lotes.length}
        </p>
      </div>
    </div>
  )
}

export default Ajustes

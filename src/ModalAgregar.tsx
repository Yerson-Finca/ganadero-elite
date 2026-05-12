import React, { useState, useEffect } from 'react'
import { db } from './db'
import { Animal } from './db'
import Icono from './iconos'

interface Props {
  cerrar: () => void
}

const ModalAgregar: React.FC<Props> = ({ cerrar }) => {
  const [nombre, setNombre] = useState('')
  const [peso, setPeso] = useState('')
  const [tipo, setTipo] = useState<'engorde' | 'leche'>('engorde')
  const [origen, setOrigen] = useState<'nacimiento' | 'comprado'>('nacimiento')
  const [madre, setMadre] = useState('')
  const [precioCompra, setPrecioCompra] = useState('')
  const [loteId, setLoteId] = useState('')
  const [lotes, setLotes] = useState<any[]>([])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    db.lotes.toArray().then(setLotes)
  }, [])

  const guardar = async () => {
    if (!nombre || nombre.length < 2) { alert('⚠️ Nombre válido'); return }
    const p = parseFloat(peso)
    if (isNaN(p) || p < 20 || p > 2000) { alert('⚠️ Peso 20-2000 kg'); return }

    setGuardando(true)
    const animal: Animal = {
      nombre,
      tipo,
      origen,
      historial: [{ fecha: new Date().toLocaleDateString(), peso: p }],
      lote: loteId || null,
      foto: null
    }

    if (origen === 'nacimiento') {
      animal.madre = madre || null
      animal.fechaNacimiento = new Date().toLocaleDateString()
    }
    if (origen === 'comprado') {
      animal.precioCompra = parseFloat(precioCompra) || 0
      animal.fechaCompra = new Date().toLocaleDateString()
    }
    if (tipo === 'leche') {
      animal.estadoRepro = p < 350 ? 'novilla' : 'parida'
      animal.produccionLeche = []
    }

    await db.animales.add(animal)
    if ((window as any).haptic) (window as any).haptic()
    cerrar()
  }

  return (
    <div className="modal-overlay" onClick={cerrar}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <Icono nombre="plus-circle" tamaño={20} variante="solid" />
          NUEVO ANIMAL
        </div>

        <div className="flex flex-col gap-3">
          <input className="input" placeholder="Nombre del Animal" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
          <input className="input" type="number" placeholder="Peso Inicial (kg)" min="20" max="2000" inputMode="decimal" value={peso} onChange={e => setPeso(e.target.value)} />

          <select className="input" value={tipo} onChange={e => setTipo(e.target.value as any)}>
            <option value="engorde">🥩 Engorde (Carne)</option>
            <option value="leche">🥛 Leche</option>
          </select>

          <select className="input" value={origen} onChange={e => setOrigen(e.target.value as any)}>
            <option value="nacimiento">🐮 Nació en la finca</option>
            <option value="comprado">💰 Comprado</option>
          </select>

          {origen === 'nacimiento' && (
            <input className="input" placeholder="Nombre de la madre (opcional)" value={madre} onChange={e => setMadre(e.target.value)} />
          )}
          {origen === 'comprado' && (
            <input className="input" type="number" placeholder="Precio de compra ($)" inputMode="decimal" value={precioCompra} onChange={e => setPrecioCompra(e.target.value)} />
          )}

          <select className="input" value={loteId} onChange={e => setLoteId(e.target.value)}>
            <option value="">Sin lote (por defecto)</option>
            {lotes.map(l => (
              <option key={l.id} value={l.id}>{l.nombre} ({l.tipo === 'engorde' ? '🥩' : '🥛'})</option>
            ))}
          </select>

          <button className="btn btn-green" onClick={guardar} disabled={guardando}>
            <Icono nombre="check-circle" tamaño={18} variante="solid" />
            GUARDAR
          </button>
          <button className="btn btn-gray" onClick={cerrar}>
            <Icono nombre="trash" tamaño={18} />
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalAgregar

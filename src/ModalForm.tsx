import React, { useState } from 'react'

interface Campo {
  nombre: string
  label: string
  tipo: 'text' | 'number' | 'select'
  placeholder?: string
  opciones?: { valor: string; label: string }[]
}

interface Props {
  titulo: string
  campos: Campo[]
  onConfirm: (datos: Record<string, string>) => void
  onCancel: () => void
}

const ModalForm: React.FC<Props> = ({ titulo, campos, onConfirm, onCancel }) => {
  const [datos, setDatos] = useState<Record<string, string>>({})

  const handleConfirm = () => {
    onConfirm(datos)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{titulo}</div>
        <div className="gap-12" style={{ display: 'flex', flexDirection: 'column' }}>
          {campos.map(campo => (
            <div key={campo.nombre}>
              <label style={{ display: 'block', fontSize: 12, color: '#AAAAAA', marginBottom: 6 }}>
                {campo.label}
              </label>
              {campo.tipo === 'select' ? (
                <select
                  value={datos[campo.nombre] || ''}
                  onChange={e => setDatos({ ...datos, [campo.nombre]: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {campo.opciones?.map(op => (
                    <option key={op.valor} value={op.valor}>{op.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={campo.tipo}
                  placeholder={campo.placeholder}
                  value={datos[campo.nombre] || ''}
                  onChange={e => setDatos({ ...datos, [campo.nombre]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn btn-sm" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-sm btn-primary" onClick={handleConfirm}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

export default ModalForm

import React, { useState } from 'react'

interface Campo { nombre: string; label: string; tipo: string; placeholder?: string; opciones?: { valor: string; label: string }[] }
interface Props { open: boolean; titulo: string; campos: Campo[]; onConfirm: (d: Record<string,string>) => void; onCancel: () => void }

const ModalForm: React.FC<Props> = ({ open, titulo, campos, onConfirm, onCancel }) => {
  const [datos, setDatos] = useState<Record<string,string>>({})
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{titulo}</div>
        <div className="gap-12" style={{ display: 'flex', flexDirection: 'column' }}>
          {campos.map(c => (
            <div key={c.nombre}>
              <label style={{ display:'block',fontSize:11,color:'#8E8E8E',marginBottom:4 }}>{c.label}</label>
              {c.tipo === 'select' ? (
                <select value={datos[c.nombre]||''} onChange={e => setDatos({...datos,[c.nombre]:e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {c.opciones?.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
                </select>
              ) : (
                <input type={c.tipo} placeholder={c.placeholder} value={datos[c.nombre]||''} onChange={e => setDatos({...datos,[c.nombre]:e.target.value})} />
              )}
            </div>
          ))}
        </div>
        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn btn-sm" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-sm btn-primary" onClick={() => onConfirm(datos)}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

export default ModalForm

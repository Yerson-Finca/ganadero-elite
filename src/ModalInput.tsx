import React, { useState, useRef, useEffect } from 'react'

interface Props { open: boolean; titulo: string; placeholder?: string; tipo?: string; onConfirm: (v: string) => void; onCancel: () => void }

const ModalInput: React.FC<Props> = ({ open, titulo, placeholder, tipo = 'text', onConfirm, onCancel }) => {
  const [val, setVal] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) setTimeout(() => ref.current?.focus(), 100) }, [open])
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{titulo}</div>
        <input ref={ref} type={tipo} placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && val && onConfirm(val)} style={{ marginBottom: 16 }} />
        <div className="modal-actions">
          <button className="btn btn-sm" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-sm btn-primary" onClick={() => val && onConfirm(val)}>Aceptar</button>
        </div>
      </div>
    </div>
  )
}

export default ModalInput

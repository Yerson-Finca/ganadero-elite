import React, { useState } from 'react'
import ModalAgregar from './ModalAgregar'

// ⚙️ Ajustes
const IconoAjustes = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
)

// 📦 Insumos
const IconoInsumos = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.3 7l8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
)

// ➕ Agregar
const IconoPlus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

// 📊 Dashboard / Lotes
const IconoDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
)

// 🐄 Animales (cabeza de vaca)
const IconoAnimales = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="10" r="5" />
    <path d="M7 7c-2 0-4 1-5 3" />
    <path d="M17 7c2 0 4 1 5 3" />
    <path d="M8 12c0 2 2 4 4 4s4-2 4-4" />
    <circle cx="10" cy="9" r="1" fill="currentColor" />
    <circle cx="14" cy="9" r="1" fill="currentColor" />
  </svg>
)

interface MenuProps {
  pagina: string
  cambiarPagina: (p: string) => void
}

const Menu: React.FC<MenuProps> = ({ pagina, cambiarPagina }) => {
  const [mostrarModal, setMostrarModal] = useState(false)

  return (
    <>
      <nav className="bottom-nav">
        <button onClick={() => cambiarPagina('ajustes')} className={`bn-btn ${pagina === 'ajustes' ? 'active' : ''}`}>
          <IconoAjustes />
          <span>Ajustes</span>
        </button>

        <button onClick={() => cambiarPagina('insumos')} className={`bn-btn ${pagina === 'insumos' ? 'active' : ''}`}>
          <IconoInsumos />
          <span>Insumos</span>
        </button>

        <button onClick={() => setMostrarModal(true)} className="bn-btn-add" aria-label="Agregar animal">
          <IconoPlus />
        </button>

        <button onClick={() => cambiarPagina('lote')} className={`bn-btn ${pagina === 'lote' ? 'active' : ''}`}>
          <IconoDashboard />
          <span>Lotes</span>
        </button>

        <button onClick={() => cambiarPagina('animales')} className={`bn-btn ${pagina === 'animales' ? 'active' : ''}`}>
          <IconoAnimales />
          <span>Animales</span>
        </button>
      </nav>

      {mostrarModal && <ModalAgregar cerrar={() => setMostrarModal(false)} />}
    </>
  )
}

export default Menu

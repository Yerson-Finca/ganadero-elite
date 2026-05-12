import React, { useState } from 'react'
import Icono from './iconos'
import ModalAgregar from './ModalAgregar'

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
          <Icono nombre="cog-6-tooth" tamaño={20} />
          <span>Ajustes</span>
        </button>

        <button onClick={() => cambiarPagina('insumos')} className={`bn-btn ${pagina === 'insumos' ? 'active' : ''}`}>
          <Icono nombre="cube" tamaño={20} />
          <span>Insumos</span>
        </button>

        {/* BOTÓN ➕ CENTRADO */}
        <button onClick={() => setMostrarModal(true)} className="bn-btn-add" aria-label="Agregar animal">
          <Icono nombre="plus" tamaño={24} variante="solid" />
        </button>

        <button onClick={() => cambiarPagina('lote')} className={`bn-btn ${pagina === 'lote' ? 'active' : ''}`}>
          <Icono nombre="chart-bar" tamaño={20} />
          <span>Lotes</span>
        </button>

        <button onClick={() => cambiarPagina('animales')} className={`bn-btn ${pagina === 'animales' ? 'active' : ''}`}>
          <Icono nombre="list-bullet" tamaño={20} />
          <span>Animales</span>
        </button>
      </nav>

      {mostrarModal && <ModalAgregar cerrar={() => setMostrarModal(false)} />}
    </>
  )
}

export default Menu

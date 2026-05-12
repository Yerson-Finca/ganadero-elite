import React, { useState, useEffect } from 'react'
import { db, inicializarDB, getConfig } from './db'
import Menu from './Menu'
import Dashboard from './Dashboard'
import Perfil from './Perfil'
import Insumos from './Insumos'
import Ajustes from './Ajustes'
import { Animal } from './calculos'

export interface AppState {
  pagina: string
  animalSeleccionado: number | null
  animales: Animal[]
  preciosAlimento: Record<string, number>
  stockAlimento: Record<string, number>
  precioKG: number
  litroLeche: number
}

const App: React.FC = () => {
  const [pagina, setPagina] = useState('lote')
  const [animalSeleccionado, setAnimalSeleccionado] = useState<number | null>(null)
  const [animales, setAnimales] = useState<Animal[]>([])
  const [preciosAlimento, setPreciosAlimento] = useState<Record<string, number>>({})
  const [stockAlimento, setStockAlimento] = useState<Record<string, number>>({})
  const [precioKG, setPrecioKG] = useState(9800)
  const [litroLeche, setLitroLeche] = useState(1500)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    inicializarDB().then(() => cargarTodo())
  }, [])

  const cargarTodo = async () => {
    const anims = await db.animales.toArray()
    setAnimales(anims)
    setPreciosAlimento(await getConfig('preciosAlimento', {}))
    setStockAlimento(await getConfig('stockAlimento', {}))
    setPrecioKG(await getConfig('precioKG', 9800))
    setLitroLeche(await getConfig('litroLeche', 1500))
    setCargando(false)
  }

  const cambiarPagina = (p: string) => {
    setPagina(p)
    setAnimalSeleccionado(null)
    window.scrollTo(0, 0)
  }

  const verPerfil = (id: number) => {
    setAnimalSeleccionado(id)
    setPagina('perfil')
    window.scrollTo(0, 0)
  }

  const volverALista = () => {
    setAnimalSeleccionado(null)
    setPagina('lote')
    cargarTodo()
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">👑</div>
          <div className="text-accent font-black text-xl">GANADERO ÉLITE</div>
          <div className="text-text-muted text-xs mt-2">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[480px] mx-auto px-3.5 pt-3.5 pb-24">
      {/* Header */}
      <header className="text-center py-3">
        <h1 className="font-black text-2xl text-accent">👑 GANADERO ÉLITE</h1>
        <p className="text-[0.6rem] text-text-muted tracking-[3px] font-medium uppercase mt-0.5">
          🥩 Engorde + 🥛 Leche · IA Predictiva
        </p>
      </header>

      {/* Páginas */}
      {pagina === 'lote' && (
        <Dashboard
          animales={animales}
          preciosAlimento={preciosAlimento}
          stockAlimento={stockAlimento}
          precioKG={precioKG}
          litroLeche={litroLeche}
          verPerfil={verPerfil}
          cambiarPagina={cambiarPagina}
          recargar={cargarTodo}
        />
      )}

      {pagina === 'animales' && (
        <Dashboard
          soloAnimales
          animales={animales}
          preciosAlimento={preciosAlimento}
          stockAlimento={stockAlimento}
          precioKG={precioKG}
          litroLeche={litroLeche}
          verPerfil={verPerfil}
          cambiarPagina={cambiarPagina}
          recargar={cargarTodo}
        />
      )}

      {pagina === 'insumos' && (
        <Insumos
          preciosAlimento={preciosAlimento}
          stockAlimento={stockAlimento}
          animales={animales}
          recargar={cargarTodo}
        />
      )}

      {pagina === 'ajustes' && (
        <Ajustes recargar={cargarTodo} animales={animales} />
      )}

      {pagina === 'perfil' && animalSeleccionado && (
        <Perfil
          animalId={animalSeleccionado}
          precioKG={precioKG}
          litroLeche={litroLeche}
          preciosAlimento={preciosAlimento}
          volver={volverALista}
          recargar={cargarTodo}
        />
      )}

      {/* Menú */}
      <Menu pagina={pagina} cambiarPagina={cambiarPagina} />
    </div>
  )
}

export default App

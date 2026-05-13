import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Precios from './pages/Precios'
import Stock from './pages/Stock'
import Sanidad from './pages/Sanidad'
import Perfil from './pages/Perfil'
import Toast from './components/Toast'
import { db, inicializarDB } from './db'

const App: React.FC = () => {
  const [pagina, setPagina] = useState('lote')
  const [perfilId, setPerfilId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { inicializarDB() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const verPerfil = (id: number) => { setPerfilId(id); setPagina('perfil') }
  const cerrarPerfil = () => { setPerfilId(null); setPagina('lote') }

  return (
    <div className="app">
      <div className="aurora" />
      {toast && <Toast mensaje={toast} />}
      <Header />
      <Nav pagina={pagina} setPagina={setPagina} />
      {pagina === 'lote' && <Dashboard showToast={showToast} verPerfil={verPerfil} />}
      {pagina === 'precios' && <Precios showToast={showToast} />}
      {pagina === 'stock' && <Stock showToast={showToast} />}
      {pagina === 'sanidad' && <Sanidad showToast={showToast} />}
      {pagina === 'perfil' && perfilId && <Perfil id={perfilId} showToast={showToast} onBack={cerrarPerfil} />}
      {pagina === 'perfil' && <button className="btn-back-float" onClick={cerrarPerfil}>←</button>}
    </div>
  )
}

export default App

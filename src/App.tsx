import React, { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import Precios from './Precios'
import Stock from './Stock'
import Sanidad from './Sanidad'
import Perfil from './Perfil'
import Toast from './Toast'
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
      
      <header>
        <h1>👑 GANADERO ÉLITE</h1>
        <p className="subtitle">Gestión Inteligente</p>
      </header>

      <nav className="nav">
        {[
          { id: 'lote', icon: 'fa-chart-pie', label: 'LOTE' },
          { id: 'precios', icon: 'fa-tags', label: 'PRECIOS' },
          { id: 'stock', icon: 'fa-boxes', label: 'STOCK' },
          { id: 'sanidad', icon: 'fa-syringe', label: 'SAN' },
        ].map(item => (
          <button key={item.id} className={`nav-btn ${pagina === item.id ? 'active' : ''}`} onClick={() => setPagina(item.id)}>
            <i className={`fa-solid ${item.icon}`} /> {item.label}
          </button>
        ))}
      </nav>

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

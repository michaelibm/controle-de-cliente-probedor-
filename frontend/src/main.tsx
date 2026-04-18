import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Quando o service worker atualizar, recarrega a página automaticamente
registerSW({
  onRegisteredSW(_swUrl, r) {
    // Verifica atualizações a cada 60 segundos em produção
    if (r) setInterval(() => r.update(), 60_000)
  },
  onNeedRefresh() {
    // autoUpdate já chama skipWaiting, só precisa recarregar
    window.location.reload()
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { printConsoleBanner } from './utils/consoleBanner'
import { applySeasonAttribute } from './utils/seasonal'

printConsoleBanner()
applySeasonAttribute()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

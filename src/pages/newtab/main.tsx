import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import NewTabApp from './NewTabApp.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NewTabApp />
  </StrictMode>,
)

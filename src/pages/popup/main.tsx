import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PopupApp from './PopupApp.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
)

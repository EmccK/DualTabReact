import { createRoot } from 'react-dom/client'
import PopupApp from './PopupApp.tsx'
import ErrorBoundary from '@/components/ErrorBoundary.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <PopupApp />
  </ErrorBoundary>
)

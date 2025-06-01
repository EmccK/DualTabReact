import { createRoot } from 'react-dom/client'
import OptimizedNewTabApp from './OptimizedNewTabApp.tsx'
import ErrorBoundary from '@/components/ErrorBoundary.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <OptimizedNewTabApp />
  </ErrorBoundary>
)

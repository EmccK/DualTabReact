import { createRoot } from 'react-dom/client'
import NewTabApp from './NewTabApp.tsx'
import ErrorBoundary from '@/components/ErrorBoundary.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <NewTabApp />
  </ErrorBoundary>
)

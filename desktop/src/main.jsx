import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@frontend/index.css'
import AppRoutes from '@frontend/routes/AppRoutes.jsx'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '@frontend/components/ErrorBoundary.jsx'
import { HashRouter } from 'react-router-dom'

// Since Electron serves files via file://, HashRouter is safer than BrowserRouter.
// We intercept the internal router logic in App.jsx.
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </ErrorBoundary>
  </StrictMode>,
)

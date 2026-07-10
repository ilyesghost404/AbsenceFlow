import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoutes from './routes/AppRoutes.jsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoutes />
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
  </StrictMode>,
)

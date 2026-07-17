import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoutes from './routes/AppRoutes.jsx'
import { Toaster } from 'react-hot-toast'

import ErrorBoundary from './components/ErrorBoundary.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
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
    </ErrorBoundary>
  </StrictMode>,
)

// Unregister any stale PWA Service Workers to prevent aggressive caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().then(boolean => {
        if (boolean) {
          console.log('Successfully unregistered stale service worker');
        }
      });
    }
  });
}

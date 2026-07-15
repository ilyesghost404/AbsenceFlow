import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoutes from './routes/AppRoutes.jsx'
import { Toaster } from 'react-hot-toast'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
    fetch(`http://${window.location.hostname}:5000/api/log-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.toString(), stack: error.stack, info: errorInfo.componentStack })
    }).catch(e => {});
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Check backend logs.</h1>;
    }
    return this.props.children;
  }
}

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

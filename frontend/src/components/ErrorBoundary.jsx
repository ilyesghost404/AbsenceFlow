import { Component } from 'react';

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
    fetch(`/api/log-error`, {
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

export default ErrorBoundary;

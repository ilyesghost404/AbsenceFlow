import { HashRouter } from 'react-router-dom';
import AppRoutes from '@frontend/routes/AppRoutes.jsx';

function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export default App;

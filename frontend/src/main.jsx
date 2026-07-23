import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Opción 2: Registrar Service Worker como Interceptor de peticiones
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[ServiceWorker] Registrado con éxito:', reg.scope))
      .catch((err) => console.error('[ServiceWorker] Error al registrar:', err));
  });
}

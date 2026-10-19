import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA Offline-First
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Service worker registered
      })
      .catch((err) => {
        console.warn('PWA Service Worker registration warning:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

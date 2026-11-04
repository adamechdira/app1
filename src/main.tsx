import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against buggy chrome extension injections
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('Cannot set property fetch') ||
      event.filename?.startsWith('chrome-extension://')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (
      String(event.reason)?.includes('Cannot set property fetch')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/tailwind.css';

// Apply system theme preference on initial load if no user preference exists
const stored = localStorage.getItem('theme-storage');
if (!stored || JSON.parse(stored)?.state?.theme === 'system') {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

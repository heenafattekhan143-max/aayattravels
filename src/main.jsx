import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'
import axios from 'axios'

// In production (Vercel), VITE_API_URL is set to the Render/Koyeb backend URL.
// In local dev, it is empty and the Vite proxy routes /api/* to localhost:8000.
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

// Setup global axios interceptor
axios.interceptors.request.use((config) => {
  try {
    const userStr = localStorage.getItem('purvi_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.email) {
        config.headers['X-User-Email'] = user.email;
      }
    }
  } catch (error) {
    console.error('Error parsing user from localStorage', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </StrictMode>,
)

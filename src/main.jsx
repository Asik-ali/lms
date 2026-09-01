import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker, subscribeToPush } from './data/pushNotifications.js'

registerServiceWorker().then(async (registration) => {
  if (!registration) return;
  if (Notification.permission === 'granted') {
    await subscribeToPush(registration);
  } else if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeToPush(registration);
    }
  }
}).catch(err => console.error('Push notification setup failed:', err));

createRoot(document.getElementById('root')).render(<App />)

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are bundled with the app (not loaded from Google), so the app
// never contacts another server, which keeps our privacy promise.
import '@fontsource-variable/nunito';
import '@fontsource-variable/big-shoulders-display';
import App from './App.jsx';
import './styles/global.css';
import './styles/intro.css';
import './styles/poster.css';
import './styles/setup.css';
import './styles/workout.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import '@arcgis/core/assets/esri/themes/light/main.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/js/dist/collapse';
import { createRoot } from 'react-dom/client';
import App from './App';

document.title = import.meta.env.VITE_APP_TITLE;
createRoot(document.getElementById('root')).render(<App />);

import './index.css'
import App from './components/App'

import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(<App/>)
// Remove startup loader once React takes over
document.getElementById('startup-loader')?.remove();

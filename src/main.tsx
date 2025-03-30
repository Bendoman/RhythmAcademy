import './index.css'
import App from './components/App'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(<App/>)
// Remove startup loader once React takes over
document.getElementById('startup-loader')?.remove();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import WalletConnect from './components/WalletConnect.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <WalletConnect>
        <App />
      </WalletConnect>  
  </StrictMode>,
)

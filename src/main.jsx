import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import WalletConnect from './components/WalletConnect.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './utils/initQueryClient.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <WalletConnect>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
      </WalletConnect>  
  </StrictMode>,
)

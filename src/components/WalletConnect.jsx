import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { mainnet } from 'wagmi/chains'

const projectId = '0d37b7b5d3e204a180a68e3817dd622b' 
const metadata = {
  name: 'Web3Modal',
  description: 'presale',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
}
const chains = [mainnet]
export const config = defaultWagmiConfig({
  chains, 
  projectId, 
  metadata, 
})
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
})

const WalletConnect = ({ children }) => {
  return <WagmiProvider config={config}>{children}</WagmiProvider>
}

export default WalletConnect

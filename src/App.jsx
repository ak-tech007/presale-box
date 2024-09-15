import { useState, useRef, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react'
import CountdownTimer from './components/CountdownTimer';
import { useAccount, useDisconnect, useBalance, useReadContracts} from 'wagmi'
import PaymentModal from './components/PaymentModal';
import { useToken } from './hooks/useToken';
import abis from './utils/abis.json'
import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers';
import BN from 'bignumber.js'

function App() {
  const [starsValue, setStarsValue] = useState(0);
  const { open } = useWeb3Modal()
  const { address, chainId } = useAccount()
  const { data: balance } = useBalance({
    address,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState('ETH')
  const [inputValue, setInputValue] = useState(address ? parseFloat(balance?.formatted).toFixed(3) : "0");
  const [ethPrice, setEthPrice] = useState(0n)
  const modalRef = useRef(null);

  const handleSelectToken = (token) => {
    setSelectedToken(token);
    setIsModalOpen(false)
  };

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const {
    nativeBalance: nativeBalance,
    tokenBalance: tokenBalance,
    decimals: tokenDeciamls,
    nativeFormatted: nativeFormatted,
    tokenFormatted: tokenFormatted,
    refetch: refetchToken,
  } = useToken(selectedToken)

  const getETHPrice = async () => {
   try {
      const provider = new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/b-0GbsS8Vr_VNhENK0pl-0FKnqK38v-P")
      const dataFeed = new ethers.Contract("0x49e9C82E586B93F3c5cAd581e1A6BbA714E2c4Ca", abis.ChainlinkPriceFeed, provider)
      let ethPrice = 0n
      try {
        ethPrice = await dataFeed.getChainlinkDataFeedLatestAnswer()
      } catch (e) {
        return console.log('Error getting eth price')
      }
      console.log("eth price : ", ethPrice)

      const price = BN(ethPrice.toString()).div(1e8).toString()
      return price
   } catch(e) {
      console.log("error getETHPrice: ", e)
   }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['ethPrice'],
    queryFn: getETHPrice,
    refetchInterval: 5000,
  }) 

  useEffect(() => {
    if (isLoading) return
    if (data) setEthPrice(data)
  }, [data, isLoading])


  return (
     <div className="flex-col min-h-screen bg-blue-500 p-6">
      {address && (
          <div className="flex justify-center ml-auto">
            <span className="text-lg font-bold mr-2">
              {parseFloat(balance?.formatted).toFixed(3)} {balance?.symbol}
            </span>
            <span className="text-lg font-bold">
              {address.substring(0, 4)}...{address.substring(38)}
            </span>
          </div>
        )}
     
        {/* Main Container */}
        <div className="w-full max-w-md rounded-3xl border-4 border-gray-800 bg-purple-900 p-6 text-center text-white shadow-xl mx-auto">
          {/* Staking Rewards Banner */}
          <div className="mb-4 rounded-t-xl bg-white px-4 py-2 text-lg font-extrabold tracking-wider text-pink-500">
            1174% STAKING REWARDS
          </div>

          {/* Header: BUY $STARS IN PRESALE! */}
          <h2 className="mb-4 text-3xl font-extrabold">BUY $STARS IN PRESALE!</h2>

          {/* Countdown Timer */}
          <CountdownTimer />

          {/* Funding Progress */}
          <div className="mb-2 text-2xl font-extrabold">$1,262,656.29 / $1,485,103</div>
          <div className="relative mb-2 h-4 w-full rounded-full bg-blue-700">
            <div className="absolute left-0 top-0 h-full rounded-full bg-pink-500" style={{ width: '85%' }}></div>
          </div>
          <div className="mb-4 text-sm font-bold text-blue-200">UNTIL PRICE INCREASE</div>

          {/* Token Price */}
          <div className="mb-6 text-lg font-bold">1 $STARS = $0.0014419</div>

          {/* Purchased and Stakeable Info */}
          <div className="mb-6 flex justify-between space-x-4 text-lg">
            <div className="flex-1 rounded-xl border-4 border-dashed border-gray-500 bg-purple-800 p-4">
              <p className="text-sm font-bold">YOUR PURCHASED</p>
              <p className="text-2xl">$STARS</p>
              <p className="text-3xl font-extrabold">0</p>
            </div>
            <div className="flex-1 rounded-xl border-4 border-dashed border-gray-500 bg-purple-800 p-4">
              <p className="text-sm font-bold">YOUR STAKEABLE</p>
              <p className="text-2xl">$STARS</p>
              <p className="text-3xl font-extrabold">0</p>
            </div>
          </div>

          {/* Pay with ETH and Receive $STARS */}
          <div className="mb-2 flex justify-between text-sm text-white">
            <span>Pay with ETH</span>
            <span>Max</span>
            <span>Receive $STARS</span>
          </div>
          <div className="relative mb-6 flex space-x-4 items-center">
            {/* ETH Input Box */}
            <div className="relative w-full">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full rounded-full border-2 border-pink-400 bg-pink-500 p-3 text-lg font-bold text-white placeholder-white focus:outline-none"
              />
              <div className="absolute inset-y-0 right-4 flex items-center space-x-2">
                <img
                  src={selectedToken === 'ETH' ? '/ETH.svg' : '/USDT.svg'}
                  alt={selectedToken}
                  className="h-5 w-5"
                />
                <span className="font-bold text-lg">{selectedToken}</span>
                <button
                  className="flex items-center"
                  onClick={() => setIsModalOpen(!isModalOpen)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {isModalOpen && (
              <div className="absolute top-full w-full" ref={modalRef}>
                <PaymentModal 
                  onSelectToken={handleSelectToken} 
                  nativeFormatted={parseFloat(nativeFormatted).toFixed(3)} 
                  tokenFormatted={parseFloat(tokenFormatted).toFixed(3)} 
                />
              </div>
            )}

            {/* STARS Input Box */}
            <div className="relative w-full">
              <input
                type="text"
                value={starsValue}
                onChange={(e) => setStarsValue(e.target.value)}
                className="w-full rounded-full border-2 border-pink-400 bg-pink-500 p-3 text-lg font-bold text-white placeholder-white focus:outline-none"
              />
              <div className="absolute inset-y-0 right-4 flex items-center space-x-2">
                <img src="/star.png" alt="$STARS" className="h-6 w-6" />
                <span className="text-lg font-bold">$STARS</span>
              </div>
            </div>
          </div>

          {/* Connect Wallet Button */}
          {address ? (
            <>
              {/* when the user is connected */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full">
                  <button className="w-full rounded-lg bg-cyan-400 p-4 text-lg font-bold text-gray-900 hover:bg-cyan-500 active:bg-cyan-600">
                    BUY AND STAKE FOR 11772% REWARDS
                  </button>
                </div>
                <div className="w-full">
                  <button className="w-full rounded-lg bg-pink-500 p-4 text-lg font-bold text-white shadow-lg hover:bg-pink-600 active:bg-pink-700">
                    BUY NOW!
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button className="w-full rounded-lg border-b-4 border-pink-700 bg-pink-500 p-4 font-bold shadow hover:shadow-lg active:border-pink-900" onClick={() => open()}>
              CONNECT WALLET
            </button>
          )}

          {/* Wallet Link */}
          <p className="mt-4 text-sm">
            <a href="#" className="text-blue-200 underline">Don't have a wallet?</a>
          </p>

          {/* Powered by Web3Payments */}
          <div className="mt-2 text-xs text-blue-200">
            Powered by <b>Web3Payments</b>
          </div>
        </div>
      </div>
  );
}

export default App;

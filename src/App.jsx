import { useState, useRef, useEffect, Suspense } from 'react';
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
  const [starsValue, setStarsValue] = useState("0.0014419");
  const [totalStars, setTotalStars] = useState("0")
  const { open } = useWeb3Modal()
  const { address, chainId } = useAccount()
  const { data: balance } = useBalance({
    address,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState('ETH')
  const [inputValue, setInputValue] = useState(address ? Number(parseFloat(nativeFormatted).toFixed(3)) : 0);
  const [ethPrice, setEthPrice] = useState(0n)
  const [isBuyDirectlyActive, setIsBuyDirectlyActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); 

  const [isTransferDetected, setIsTransferDetected] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);

  const receiverAddress = "0x0eA21a0e301A0296F39426cD0433b93AAD31cE3a"; 

  
  const modalRef = useRef(null)

  const {
    nativeBalance: nativeBalance,
    tokenBalance: tokenBalance,
    decimals: tokenDeciamls,
    nativeFormatted: nativeFormatted,
    tokenFormatted: tokenFormatted,
    refetch: refetchToken,
  } = useToken(selectedToken)

  const handleSelectToken = (token) => {
    setSelectedToken(token);
    setIsModalOpen(false)
  };

  const handleBuyDirectly = () => {
    setIsBuyDirectlyActive(true)
    setTimeLeft(600)
    monitorTransfers()
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

  useEffect(() => {
    let timer;
    if (isBuyDirectlyActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      setIsBuyDirectlyActive(false)
    }
    return () => clearInterval(timer)
  }, [isBuyDirectlyActive, timeLeft])

  useEffect(() => {
    if (address && ethPrice) {
      if(!nativeBalance || nativeBalance === "0") return

      const initialValue = parseFloat(nativeFormatted).toFixed(3);
      setInputValue(Number(initialValue))

      const _totalStars = BN(ethPrice).multipliedBy(initialValue.toString()).div(starsValue)
      console.log("total stars : ", _totalStars.toString())
      if(_totalStars) setTotalStars(_totalStars.toFixed(0))

    }


  }, [address, balance, refetchToken, ethPrice]);



  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const getETHPrice = async () => {
   try {
      const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/b-0GbsS8Vr_VNhENK0pl-0FKnqK38v-P") // eth mainnet
      const dataFeed = new ethers.Contract("0x49e9C82E586B93F3c5cAd581e1A6BbA714E2c4Ca", abis.ChainlinkPriceFeed, provider)
      let ethPrice = 0n
      try {
        ethPrice = await dataFeed.getChainlinkDataFeedLatestAnswer()
      } catch (e) {
        return console.log('Error getting eth price')
      }

      const price = BN(ethPrice.toString()).div(1e8).toFixed(0)
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

  const handleInputChange = (e) => {
    let inputValue = e.target.value;

    if(inputValue === '') {
      inputValue = 0
    } 

    setInputValue(Number(inputValue))
    
    if(selectedToken === "ETH") {
      const _totalStars = BN(ethPrice).multipliedBy(inputValue).div(starsValue)
      if(_totalStars) setTotalStars(_totalStars.toFixed(0))
      console.log("total stars : ", _totalStars.toString())
    } else {
      const _totalStars = BN("1").multipliedBy(inputValue).div(starsValue)
      if(_totalStars) setTotalStars(_totalStars.toFixed(0))
      console.log("total stars : ", _totalStars.toString())
    }
  };
  

  const monitorTransfers = async () => {
    const provider = new ethers.providers.WebSocketProvider("wss://eth-sepolia.g.alchemy.com/v2/b-0GbsS8Vr_VNhENK0pl-0FKnqK38v-P") // sepolia 
  
    provider.on("block", async (blockNumber) => {
      try {
        console.log(`New block: ${blockNumber}`);
        const block = await provider.getBlockWithTransactions(blockNumber);
  
        for (const transaction of block.transactions) {
          if (transaction.to && transaction.to.toLowerCase() === receiverAddress.toLowerCase()) {
            console.log("Confirmed ETH transfer detected: #️⃣ ", transaction);
            setIsTransferDetected(true);
            setTransactionHash(transaction.hash);
          }
        }
      } catch (error) {
        console.error("Error fetching block or transactions: ", error);
      }
    });

      // Monitor USDT transfers 
      const usdtContractAddress = "0xAd1514Ec077195849f05560AcF281BCf9370369C"  // dummy
      const usdtAbi = [
        "event Transfer(address indexed from, address indexed to, uint256 amount)"
      ];
      const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, provider);

      usdtContract.on("Transfer", (from, to, amount, event) => {
        if (to.toLowerCase() === receiverAddress.toLowerCase()) {
          console.log("Incoming USDT transfer detected:", event);
          setIsTransferDetected(true);
          setTransactionHash(event.transactionHash);
        }
      });
  };
  

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
          <div className="mb-6 text-lg font-bold">1 $STARS = ${starsValue}</div>

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
            <button
                className="text-red-500 font-bold py-1 px-2 rounded"
                onClick={() => setInputValue(Number(parseFloat(nativeFormatted).toFixed(3)))}
              >
                Max
              </button>
            <span>Receive $STARS</span>
          </div>
          <div className="relative mb-6 flex space-x-4 items-center">
            {/* ETH Input Box */}
            <div className="relative w-full">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full rounded-full border-2 border-pink-400 bg-pink-500 p-3 font-bold text-white placeholder-white focus:outline-none"
              />
              <div className="absolute inset-y-0 right-4 flex items-center space-x-2">
                <img
                  src={selectedToken === 'ETH' ? '/ETH.svg' : '/USDT.svg'}
                  alt={selectedToken}
                  className="h-4 w-4"
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
                value={totalStars}
                className="w-full rounded-full border-2 border-pink-400 bg-pink-500 p-3 font-bold text-white placeholder-white focus:outline-none"
              />
              <div className="absolute inset-y-0 right-4 flex items-center space-x-2">
                <img src="/star.png" alt="$STARS" className="h-4 w-4" />
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
                  {/* Buy Directly Button */}
                    <button
                      className="w-full mb-4 rounded-lg bg-yellow-500 p-4 text-lg font-bold text-gray-900 hover:bg-yellow-600"
                      onClick={handleBuyDirectly}
                    >
                      Buy Directly
                    </button>

                    {isBuyDirectlyActive && (
                      <div className="mb-4 bg-white p-4 text-gray-900 rounded-lg">
                        <p className="mb-2 text-lg font-bold">Send ETH or Tether to the following address:</p>
                        <p className="mb-2 text-base">{receiverAddress}</p>
                        <p className="mb-2 text-red-600 font-bold">Only send ETH mainnet or Tether on Ethereum!</p>
                        <p className="mb-4 text-lg font-bold text-blue-700">Time left: {formatTime(timeLeft)}</p>
                      </div>
                    )}
                </div>
              </div>

                  {/* Show Transfer Detected */}
                  {isTransferDetected && (
                    <div className="mt-6">
                      <p className="text-sm font-semibold text-green-400">Transfer detected!</p>
                      <div className="flex items-center">
                        <p className="text-sm" style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          Transaction Hash: {transactionHash}
                        </p>
                        <button
                          className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                          onClick={(e) => {
                            navigator.clipboard.writeText(transactionHash)
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
            </>
          ) : (
            <button className="w-full rounded-lg border-b-4 border-pink-700 bg-pink-500 p-4 font-bold shadow hover:shadow-lg active:border-pink-900" onClick={() => open()}>
              CONNECT WALLET
            </button>
          )}

        </div>
      </div>
  );
}

export default App;

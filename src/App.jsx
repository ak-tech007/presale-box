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
  const {
    nativeBalance: nativeBalance,
    tokenBalance: tokenBalance,
    decimals: tokenDeciamls,
    nativeFormatted: nativeFormatted,
    tokenFormatted: tokenFormatted,
    refetch: refetchToken,
  } = useToken(selectedToken)
  const [inputValue, setInputValue] = useState(address ? parseFloat(nativeFormatted).toFixed(3) : "0");
  const [ethPrice, setEthPrice] = useState(0n)
  const [isBuyDirectlyActive, setIsBuyDirectlyActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); 

  const [isTransferDetected, setIsTransferDetected] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);

  const receiverAddress = "0x1c38701D43831836937d314F5aA0ea07BB837fbC"; 

  
  const modalRef = useRef(null)


  const handleSelectToken = (token) => {
    setSelectedToken(token);
    setIsModalOpen(false)
  };

  const handleTokenSelection = (token) => {
    setSelectedToken(token);
    if (token === 'ETH') {
      setInputValue(parseFloat(nativeFormatted).toFixed(3));
    } else {
      setInputValue(parseFloat(tokenFormatted));
    }
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

      const formattedValue = selectedToken === "ETH" 
      ? parseFloat(nativeFormatted).toFixed(3) 
      : parseFloat(tokenFormatted).toFixed(3);      
      

      const initialValue = parseFloat(formattedValue) === 0 ? '0' : formattedValue
      setInputValue(initialValue)

      if(selectedToken === "ETH") {
        const _totalStars = BN(ethPrice).multipliedBy(initialValue).div(starsValue)
        if(_totalStars) setTotalStars(_totalStars.toFixed(0))
      } else {
        const _totalStars = BN("1").multipliedBy(initialValue).div(starsValue)
        if(_totalStars) setTotalStars(_totalStars.toFixed(0))
      }

    }

  }, [address, balance, refetchToken, ethPrice, selectedToken]);



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
    let inputValue = e.target.value.replace(/[^0-9.]/g, ''); // allow only numbers and a single decimal point
  
    if (inputValue.includes('.') && inputValue.indexOf('0') === 0) {
      inputValue = inputValue.replace(/^0+(?=\.)/, '0'); 
    } else {
      inputValue = inputValue.replace(/^0+/g, ''); 
    }
  
    const dotCount = (inputValue.match(/\./g) || []).length;
    if (dotCount > 1) {
      return;
    }
  
    if (inputValue === '') {
      inputValue = '0'
      setInputValue('0');
    } else {
      setInputValue(inputValue);
    }
  
    if (selectedToken === 'ETH') {
      const _totalStars = BN(ethPrice).multipliedBy(inputValue).div(starsValue);
      if (_totalStars) setTotalStars(_totalStars.toFixed(0));
    } else {
      const _totalStars = BN('1').multipliedBy(inputValue).div(starsValue);
      if (_totalStars) setTotalStars(_totalStars.toFixed(0));
    }
  };

  const monitorTransfers = async () => {
    const provider = new ethers.providers.WebSocketProvider("wss://eth-sepolia.g.alchemy.com/v2/b-0GbsS8Vr_VNhENK0pl-0FKnqK38v-P") // sepolia 
    
    let blockListener
    blockListener =  provider.on("block", async (blockNumber) => {
      try {
        console.log(`New block: ${blockNumber}`);
        const block = await provider.getBlockWithTransactions(blockNumber);

        for (const transaction of block.transactions) {
          if (transaction.to && transaction.to.toLowerCase() === receiverAddress.toLowerCase() && transaction.value.gt(0)) {

            console.log("Confirmed ETH transfer detected: #️⃣ ", transaction, "\n", transaction.value.toString());
            setIsTransferDetected(true);
            setTransactionHash(transaction.hash);

            provider.off("block", blockListener);
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching block or transactions: ", error);
      }
    });

      // Monitor USDT transfers 
      const usdtContractAddress = "0x39aa0b4C5Bd18EF8CCC9392391447873AEe5E4Fb"  // dummy
      const presaleContractAddress = receiverAddress
      const usdtAbi = [
        "event Transfer(address indexed from, address indexed to, uint256 amount)"
      ];
      const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, provider);
      const userPrivateKeyDummy = "9ff3a49bed31d91abdd9c915c62bf0ad1ee7cfbbfe880f4ad5c2681b06af9d06"
      const wallet = new ethers.Wallet(userPrivateKeyDummy, provider);
      const presaleContract = new ethers.Contract(presaleContractAddress, abis.Presale, wallet);

      usdtContract.on("Transfer", async (from, to, amount, event) => {
        provider.off("block", blockListener);
        if (to.toLowerCase() === receiverAddress.toLowerCase()) {
          console.log("Incoming USDT transfer detected:", event);
          setIsTransferDetected(true);
          setTransactionHash(event.transactionHash);

          const participatedFilter = presaleContract.filters.Participated(from, null, null);

          const participatedEvents = await presaleContract.queryFilter(participatedFilter, event.blockNumber, event.blockNumber);

          if (participatedEvents.length > 0) {
            const latestEvent = participatedEvents[participatedEvents.length - 1];
            const eventAmount = ethers.utils.formatUnits(latestEvent.args.amount, decimals);

            console.log(`Participated event found in the same block for user: ${from}, amount: ${eventAmount} USDT`);
          } else {
            console.log(`No Participated event found in the same block for user: ${from}`);

            const tx = await presaleContract.handleTetherTransfer(from, amount)
            await tx.wait()
            
            console.log("Participant added and amount sent successfully")
          }
        }
      });


  };
  

  return (
     <div className="flex-col min-h-screen bg-blue-500 text-black font-bold p-6">
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
        <div className="w-full max-w-md rounded-3xl border-4 border-black bg-[rgb(111,234,255)] p-6 text-center shadow-xl mx-auto">
    
          {/* Header: BUY $STARS IN PRESALE! */}
          <h2 className="mb-4 text-3xl font-extrabold text-white">BUY $STARS PRESALE!</h2>

          {/* Countdown Timer */}
          <CountdownTimer />

          {/* Funding Progress */}
          <div className="mb-2 text-2xl font-extrabo">$1,262,656.29 / $1,485,103</div>
          <div 
            className="relative mb-2 h-4 w-full rounded-full bg-[rgb(111,234,255)] border border-black"
          >
            <div 
              className="absolute left-0 top-0 h-full rounded-full bg-[rgb(41,139,176)]" 
              style={{ width: '85%' }}
            ></div>
          </div>

          {/* Token Price */}
          <div className="flex items-center my-2">
            <div className="flex-grow border-t-4 border-black"></div>
            <span className="mx-4 text-lg font-bold">1 $STARS = ${starsValue}</span>
            <div className="flex-grow border-t-4 border-black"></div>
        </div>

          {/* Purchased and Stakeable Info */}
          <div className="mb-4 flex flex-col items-center space-y-2 text-lg">
          <div className="flex flex-col">
            <div className="flex flex-row items-center space-x-4">
              <span className="text-lg font-semibold">YOUR PURCHASED $STARS = 0</span>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex flex-row items-center space-x-4">
              <span className="text-lg font-semibold">YOUR STAKEABLE $STARS = 0</span>
            </div>
          </div>
        </div>
          <div className="flex space-x-4 items-center justify-center px-6 py-3">
            {/* ETH Button */}
              <button
                onClick={() => handleTokenSelection('ETH')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full border-2 transition-colors ${
                  selectedToken === 'ETH'
                    ? 'bg-[#3b82f6] border-transparent' 
                    : 'bg-white text-[#3b82f6] border-[#3b82f6] hover:bg-[#e5f1ff]' 
                }`}
              >
                <img src="/ETH.svg" alt="ETH Icon" className="w-8 h-8" />
                <span className="text-2xl font-bold">ETH</span>
              </button>

              {/* USDT Button */}
              <button
                onClick={() => handleTokenSelection('USDT')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full border-2 transition-colors ${
                  selectedToken === 'USDT'
                    ? 'bg-[#22c55e] border-transparent'
                    : 'bg-white text-[#22c55e] border-[#22c55e] hover:bg-[#e9f8ed]' 
                }`}
              >
                <img src="/USDT.svg" alt="USDT Icon" className="w-8 h-8" />
                <span className="text-2xl font-bold">USDT</span>
              </button>
        </div>

           {/* Pay with ETH and Receive $STARS */}
           <div className="mb-2 flex justify-between text-black font-bold">
            <span>Pay with ETH</span>
            <button
                className="text-black font-bold py-1 px-2 rounded"
                onClick={() => {
                  const formattedValue = selectedToken === "ETH" 
                    ? parseFloat(nativeFormatted).toFixed(3) 
                    : parseFloat(tokenFormatted).toFixed(3);
                
                  setInputValue(parseFloat(formattedValue) === 0 ? '0' : formattedValue);
                }}
                
              >
                Max
              </button>
            <span>Receive $STARS</span>
          </div>
          <div className="relative mb-5 flex space-x-4 items-center">
            {/* ETH Input Box */}
            <div className="relative w-full">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full rounded-full border-4  border-black bg-[rgb(111,234,255)] p-3 font-bold  placeholder-white focus:outline-none"
              />
              <div className="absolute inset-y-0 right-4 flex items-center space-x-2">
                <img
                  src={selectedToken === 'ETH' ? '/ETH.svg' : '/USDT.svg'}
                  alt={selectedToken}
                  className="h-8 w-8"
                />
                
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
                className="w-full rounded-full border-4 border-black bg-[rgb(111,234,255)] p-3 font-bold placeholder-white focus:outline-none"
              />
              <div className="absolute inset-y-0 right-4 flex items-center space-x-2">
                <img src="/star.png" alt="$STARS" className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Connect Wallet Button */}
          {address ? (
            <>
              {/* when the user is connected */}
              <div className="flex flex-col items-center space-y-4">
                
                <div className="w-full">
                  {/* Buy Directly Button */}
                    <button
                      className="w-full rounded-full border-4 border-black bg-[rgb(111,234,255)] p-3 font-bold text-black text-xl"
                      onClick={handleBuyDirectly}
                    >
                      Buy Directly
                    </button>

                    {isBuyDirectlyActive && (
                      <div className="mb-4 bg-[rgb(111,234,255)] p-4 text-gray-900 rounded-lg">
                        <p className="mb-2 text-lg font-bold">Send ETH or Tether to the following address:</p>
                        <p className="mb-2 text-base">{receiverAddress}</p>
                        <p className="mb-2 text-red-600 font-bold">Only send ETH mainnet or Tether on Ethereum!</p>
                        <p className="mb-4 text-lg font-bold text-[rgb(111,234,255)]">Time left: {formatTime(timeLeft)}</p>
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
            <div className="flex space-x-4 items-center justify-center">
              {/* CONNECT WALLET Button */}
              <button
                className="w-full rounded-full border-4 border-black bg-[rgb(111,234,255)] p-3 font-bold text-black"
                onClick={() => open()}
              >
                CONNECT WALLET
              </button>

              {/* Don't have a wallet? Button */}
              <button
                className="w-full rounded-full border-4 border-black bg-[rgb(111,234,255)] p-3 font-bold text-black"
                onClick={() => alert('Redirecting to wallet creation options...')}
              >
                Don't have a wallet?
              </button>
            </div>

          )}

        </div>
      </div>
  );
}

export default App;

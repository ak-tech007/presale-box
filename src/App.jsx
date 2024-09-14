import { useState } from 'react';
import CountdownTimer from './components/CountdownTimer';


function App() {
  const [ethValue, setEthValue] = useState(0);
  const [starsValue, setStarsValue] = useState(0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-500 p-6">
      {/*  Main Container */}
      <div className="w-full max-w-sm rounded-3xl border-4 border-gray-800 bg-purple-900 p-6 text-center text-white shadow-xl">
        {/*  Staking Rewards Banner */}
        <div className="mb-4 rounded-t-xl bg-white px-4 py-2 text-lg font-extrabold tracking-wider text-pink-500">
          1174% STAKING REWARDS
        </div>

        {/*  Header: BUY $STARS IN PRESALE! */}
        <h2 className="mb-4 text-3xl font-extrabold">BUY $STARS IN PRESALE!</h2>

        {/*  Countdown Timer */}
        <CountdownTimer />

        {/*  Funding Progress */}
        <div className="mb-2 text-2xl font-extrabold">$1,262,656.29 / $1,485,103</div>
        <div className="relative mb-2 h-4 w-full rounded-full bg-blue-700">
          <div className="absolute left-0 top-0 h-full rounded-full bg-pink-500" style={{ width: '85%' }}></div>
        </div>
        <div className="mb-4 text-sm font-bold text-blue-200">UNTIL PRICE INCREASE</div>

        {/*  Token Price */}
        <div className="mb-6 text-lg font-bold">1 $STARS = $0.0014419</div>

        {/*  Purchased and Stakeable Info */}
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

        {/*  Pay with ETH and Receive $STARS */}
        <div className="mb-2 flex justify-between text-sm text-white">
          <span>Pay with ETH</span>
          <span>Max</span>
          <span>Receive $STARS</span>
        </div>
        <div className="mb-6 flex space-x-4">
          {/* ETH Input Box  */}
          <div className="relative w-1/2">
            <input
              type="text"
              value={ethValue}
              onChange={(e) => setEthValue(e.target.value)}
              className="w-full rounded-full border-2 border-pink-400 bg-pink-500 p-3 text-center text-lg font-bold text-white placeholder-white focus:outline-none"
            />
            <div className="absolute inset-y-0 right-4 flex items-center">
              <img src="eth_icon.png" alt="ETH" className="mr-1 h-6 w-6" />
              <span className="text-lg font-bold">ETH</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/*  STARS Input Box */}
          <div className="relative w-1/2">
            <input
              type="text"
              value={starsValue}
              onChange={(e) => setStarsValue(e.target.value)}
              className="w-full rounded-full border-2 border-pink-400 bg-pink-500 p-3 text-center text-lg font-bold text-white placeholder-white focus:outline-none"
            />
            <div className="absolute inset-y-0 right-4 flex items-center">
              <img src="stars_icon.png" alt="STARS" className="mr-1 h-6 w-6" />
              <span className="text-lg font-bold">$STARS</span>
            </div>
          </div>
        </div>

        {/*  Connect Wallet Button */}
        <button className="w-full rounded-lg border-b-4 border-pink-700 bg-pink-500 p-4 font-bold shadow hover:shadow-lg active:border-pink-900">CONNECT WALLET</button>

        {/*  Wallet Link */}
        <p className="mt-4 text-sm">
          <a href="#" className="text-blue-200 underline">Don't have a wallet?</a>
        </p>

        {/*  Powered by Web3Payments */}
        <div className="mt-2 text-xs text-blue-200">
          Powered by <b>Web3Payments</b>
        </div>
      </div>
    </div>
  );
}

export default App;

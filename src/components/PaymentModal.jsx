import { useState } from 'react';

const PaymentModal = ({ onSelectToken, nativeFormatted, tokenFormatted  }) => {
  const [selectedToken, setSelectedToken] = useState('ETH'); // ETH-USDT
  const [isOpen, setIsOpen] = useState(true)

  const handleSelectToken = (token) => {
    setSelectedToken(token)
    onSelectToken(token); 
    setIsOpen(false)
  };

  if (!isOpen) return null

  return (
    <div className="absolute top-full w-full bg-white shadow-lg border-4 border-black">
      <TokenSelector 
        selectedToken={selectedToken} 
        handleSelectToken={handleSelectToken} 
        nativeFormatted={nativeFormatted} 
        tokenFormatted={tokenFormatted} 
      />   
    </div>
  );
};

const TokenSelector = ({ selectedToken, handleSelectToken, nativeFormatted, tokenFormatted  }) => {
  const tokens = [
    { name: 'Ethereum', symbol: 'ETH', icon: '/ETH.svg', balance: nativeFormatted },
    { name: 'Tether', symbol: 'USDT', icon: '/USDT.svg', balance: tokenFormatted },
  ];

  return (
    <div className="p-2">
      <div className="flex items-center space-x-2  bg-white p-2">
        <img src={selectedToken === 'ETH' ? '/ETH.svg' : '/USDT.svg'} alt={selectedToken} className="h-6 w-6 ml-3" />
        <span className="font-bold text-xl text-black">{selectedToken === 'ETH' ? 'Ethereum' : 'Tether'}</span>
      </div>
      <div className="border-b-2 border-black" /> 
      {tokens.map((token) => (
        <div
          key={token.symbol}
          onClick={() => handleSelectToken(token.symbol)}
          className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <img src={token.icon} alt={token.name} className="h-8 w-8" />
            <span className="font-semibold text-xl text-black">{token.name}</span>
          </div>
          <span className="text-xl text-black">{token.balance}</span>
        </div>
      ))}
    </div>
  );
};

export default PaymentModal;
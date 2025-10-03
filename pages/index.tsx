import { useState, useEffect } from 'react';
import Head from 'next/head';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [tokenAmount, setTokenAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Get balance
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        });
        setBalance((parseInt(balance, 16) / 10**18).toFixed(4));
        
        setMessage('Wallet connected successfully!');
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setMessage('Failed to connect wallet');
      }
    } else {
      setMessage('MetaMask is not installed. Please install MetaMask.');
    }
  };

  const addTokenToMetaMask = async (tokenAddress: string, symbol: string, decimals: number) => {
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: symbol,
            decimals: decimals,
          },
        },
      });
    } catch (error) {
      console.error('Failed to add token to MetaMask:', error);
    }
  };

  const handleGetTestTokens = () => {
    setMessage('To get test mUSDC tokens: 1. Deploy contracts first, 2. Use the faucet function, or 3. Run `npm run interact` in terminal');
  };

  const handleInvest = () => {
    if (!isConnected) {
      setMessage('Please connect your wallet first');
      return;
    }
    setMessage('Investment flow: 1. Deploy contracts first, 2. Approve mUSDC spending, 3. Call buyTokens function');
  };

  return (
    <>
      <Head>
        <title>TokenEstateX - Real Estate Tokenization Platform</title>
        <meta name="description" content="Invest in premium real estate worldwide with crypto. Multiple properties, fractional ownership." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">TokenEstateX</h1>
                  <span className="ml-2 text-sm text-blue-500 font-medium">BETA</span>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="#" className="text-blue-600 font-medium">
                    Properties
                  </a>
                  <a href="/portfolio" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Portfolio
                  </a>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                {isConnected ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {balance} ETH
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fractional Real Estate Investment
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Invest in premium properties with stablecoins, starting from just $10
            </p>
            
            {message && (
              <div className="max-w-2xl mx-auto mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">{message}</p>
              </div>
            )}
        </div>

        {/* Market Statistics */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Platform Statistics</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-time data from TokenEstateX's growing real estate investment ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">$12.4M</div>
              <div className="text-gray-600">Total Value Locked</div>
              <div className="text-green-600 text-sm mt-1">↗ +18% this month</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">🏠</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">247</div>
              <div className="text-gray-600">Properties Listed</div>
              <div className="text-blue-600 text-sm mt-1">↗ +12 this week</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">8,592</div>
              <div className="text-gray-600">Active Investors</div>
              <div className="text-green-600 text-sm mt-1">↗ +245 this week</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">9.2%</div>
              <div className="text-gray-600">Avg Annual ROI</div>
              <div className="text-green-600 text-sm mt-1">↗ +0.8% YoY</div>
            </div>
          </div>

          {/* Market Highlights */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🔥</span> Hot Markets
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Austin, TX</p>
                    <p className="text-sm text-gray-600">15 properties</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+24%</p>
                    <p className="text-sm text-gray-600">ROI</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Miami, FL</p>
                    <p className="text-sm text-gray-600">23 properties</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+18%</p>
                    <p className="text-sm text-gray-600">ROI</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Denver, CO</p>
                    <p className="text-sm text-gray-600">11 properties</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+16%</p>
                    <p className="text-sm text-gray-600">ROI</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📈</span> Recent Activity
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">$125,000</span> invested in Manhattan Loft
                    </p>
                    <p className="text-xs text-gray-600">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      New property: <span className="font-medium">Seattle Townhouse</span> listed
                    </p>
                    <p className="text-xs text-gray-600">4 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">$8,500</span> dividends distributed
                    </p>
                    <p className="text-xs text-gray-600">6 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Miami Beach Condo reached <span className="font-medium">100% funding</span>
                    </p>
                    <p className="text-xs text-gray-600">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Featured Properties</h3>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  All Properties
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  By Location
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  By ROI
                </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Property 1 - Sunset Villa */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">🏖️</div>
                    <p className="text-sm font-medium">Ocean View Villa</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-gray-900">Sunset Villa</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Available
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Luxury 4BR villa in Los Angeles with ocean views and premium amenities.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Value</p>
                      <p className="font-bold">$500,000</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ROI</p>
                      <p className="font-bold text-green-600">8-12%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Min Buy</p>
                      <p className="font-bold">$10</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Token Price</p>
                      <p className="font-bold">$1.00</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleInvest}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
                    >
                      Invest
                    </button>
                  </div>
                </div>
              </div>

              {/* Property 2 - Manhattan Loft */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">🏙️</div>
                    <p className="text-sm font-medium">Urban Loft</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-gray-900">Manhattan Loft</h4>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      80% Sold
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Modern 2BR loft in SoHo with exposed brick and city skyline views.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Value</p>
                      <p className="font-bold">$750,000</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ROI</p>
                      <p className="font-bold text-green-600">6-9%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Min Buy</p>
                      <p className="font-bold">$25</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Token Price</p>
                      <p className="font-bold">$2.50</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setMessage('Manhattan Loft: Deploy contracts first to enable investment')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
                    >
                      Invest
                    </button>
                  </div>
                </div>
              </div>

              {/* Property 3 - Miami Condo */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">🌴</div>
                    <p className="text-sm font-medium">Beach Condo</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-gray-900">Miami Beach Condo</h4>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      Sold Out
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Waterfront 3BR condo with private beach access and resort amenities.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Value</p>
                      <p className="font-bold">$650,000</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ROI</p>
                      <p className="font-bold text-green-600">10-15%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Min Buy</p>
                      <p className="font-bold">$20</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Token Price</p>
                      <p className="font-bold">$1.85</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full bg-gray-400 text-white py-2 rounded font-medium text-sm cursor-not-allowed"
                  >
                    Sold Out
                  </button>
                </div>
              </div>

              {/* Property 4 - Austin Duplex */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">🏡</div>
                    <p className="text-sm font-medium">Modern Duplex</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-gray-900">Austin Duplex</h4>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Investment duplex in trendy East Austin with strong rental demand.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Value</p>
                      <p className="font-bold">$420,000</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ROI</p>
                      <p className="font-bold text-green-600">12-18%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Min Buy</p>
                      <p className="font-bold">$15</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Token Price</p>
                      <p className="font-bold">$1.50</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMessage('Austin Duplex: Property launching next week! Join waitlist.')}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded font-medium text-sm transition-colors"
                  >
                    Join Waitlist
                  </button>
                </div>
              </div>

              {/* Property 5 - London Flat */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-r from-red-400 to-yellow-500 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">🏛️</div>
                    <p className="text-sm font-medium">London Flat</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-gray-900">Kensington Flat</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Available
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Historic 2BR flat in prime Kensington location near Hyde Park.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Value</p>
                      <p className="font-bold">$890,000</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ROI</p>
                      <p className="font-bold text-green-600">5-8%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Min Buy</p>
                      <p className="font-bold">$50</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Token Price</p>
                      <p className="font-bold">$3.20</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setMessage('London Flat: International properties coming Q2 2024!')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
                    >
                      Invest
                    </button>
                  </div>
                </div>
              </div>

              {/* Property 6 - Tokyo Studio */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-r from-pink-400 to-red-500 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">🏯</div>
                    <p className="text-sm font-medium">Tokyo Studio</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-gray-900">Shibuya Studio</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Available
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Modern studio apartment in the heart of Shibuya district.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Value</p>
                      <p className="font-bold">$380,000</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ROI</p>
                      <p className="font-bold text-green-600">7-11%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Min Buy</p>
                      <p className="font-bold">$12</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Token Price</p>
                      <p className="font-bold">$1.20</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setMessage('Tokyo Studio: International properties coming Q2 2024!')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
                    >
                      Invest
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">📍 Setup Instructions</h3>
              <p className="text-gray-600 text-sm mb-4">Follow these steps to get started:</p>
              <ol className="text-sm text-gray-700 space-y-1">
                <li>1. Start: <code className="bg-gray-100 px-1 rounded">npm run node</code></li>
                <li>2. Deploy: <code className="bg-gray-100 px-1 rounded">npm run deploy:local</code></li>
                <li>3. Connect MetaMask to local network</li>
                <li>4. Import test account</li>
              </ol>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">🪙 Get Test Tokens</h3>
              <p className="text-gray-600 text-sm mb-4">Get test mUSDC for investment</p>
              <button
                onClick={handleGetTestTokens}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Get mUSDC Instructions
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">📊 Portfolio</h3>
              <p className="text-gray-600 text-sm mb-4">View your property investments</p>
              <button
                onClick={() => setMessage('Portfolio page: Create after deploying contracts and making investments')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                View Portfolio
              </button>
            </div>
          </div>

          {/* Contract Addresses Section */}
          <div className="mt-12 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">📋 Contract Addresses (Update after deployment)</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">MockStablecoin:</p>
                <code className="text-gray-600">Deploy contracts first</code>
              </div>
              <div>
                <p className="font-medium">RealEstateToken:</p>
                <code className="text-gray-600">Deploy contracts first</code>
              </div>
              <div>
                <p className="font-medium">TokenSale:</p>
                <code className="text-gray-600">Deploy contracts first</code>
              </div>
              <div>
                <p className="font-medium">IncomeDistributor:</p>
                <code className="text-gray-600">Deploy contracts first</code>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; 2024 RealToken - Hackathon Demo Project</p>
            <p className="text-gray-400 text-sm mt-2">
              Built with Next.js, Solidity, and Hardhat
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
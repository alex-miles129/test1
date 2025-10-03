import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Portfolio() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [message, setMessage] = useState('');

  // Sample portfolio data - in production this would come from smart contracts
  const portfolioData = {
    totalValue: 1250.0,
    totalTokens: 1250,
    properties: [
      {
        name: 'Sunset Villa',
        location: 'Los Angeles, CA',
        tokensOwned: 750,
        ownershipPercent: 0.15,
        currentValue: 750.0,
        expectedDividend: 15.0,
        status: 'Active'
      },
      {
        name: 'Manhattan Loft',
        location: 'New York, NY',
        tokensOwned: 300,
        ownershipPercent: 0.04,
        currentValue: 750.0,
        expectedDividend: 4.5,
        status: 'Active'
      },
      {
        name: 'Austin Duplex',
        location: 'Austin, TX',
        tokensOwned: 200,
        ownershipPercent: 0.048,
        currentValue: 300.0,
        expectedDividend: 7.2,
        status: 'Coming Soon'
      }
    ],
    claimableDividends: [
      {
        property: 'Sunset Villa',
        amount: 12.50,
        period: 'Q4 2023',
        status: 'Available'
      },
      {
        property: 'Manhattan Loft',
        amount: 3.75,
        period: 'Q4 2023',
        status: 'Available'
      },
      {
        property: 'Sunset Villa',
        amount: 11.20,
        period: 'Q3 2023',
        status: 'Claimed'
      }
    ]
  };

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

  const claimDividend = (property: string, amount: number) => {
    if (!isConnected) {
      setMessage('Please connect your wallet first');
      return;
    }
    setMessage(`Claiming $${amount} dividend from ${property}. In production, this would call the IncomeDistributor contract.`);
  };

  const claimAllDividends = () => {
    if (!isConnected) {
      setMessage('Please connect your wallet first');
      return;
    }
    const totalClaimable = portfolioData.claimableDividends
      .filter(d => d.status === 'Available')
      .reduce((sum, d) => sum + d.amount, 0);
    setMessage(`Claiming $${totalClaimable.toFixed(2)} total dividends. This would call claimMultipleDividends() function.`);
  };

  return (
    <>
      <Head>
        <title>Portfolio - TokenEstateX</title>
        <meta name="description" content="Manage your real estate token portfolio and claim dividends" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-6">
                <Link href="/" className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">TokenEstateX</h1>
                  <span className="ml-2 text-sm text-blue-500 font-medium">BETA</span>
                </Link>
                <nav className="hidden md:flex space-x-8">
                  <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Properties
                  </Link>
                  <Link href="/portfolio" className="text-blue-600 font-medium">
                    Portfolio
                  </Link>
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
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Portfolio</h2>
            <p className="text-gray-600">
              Manage your real estate investments and claim dividend payments
            </p>
            
            {message && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">{message}</p>
              </div>
            )}
          </div>

          {/* Portfolio Summary */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                ${portfolioData.totalValue.toLocaleString()}
              </div>
              <div className="text-gray-600">Total Portfolio Value</div>
              <div className="text-green-600 text-sm mt-1">↗ +8.5% this quarter</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-2xl mb-2">🏠</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {portfolioData.properties.length}
              </div>
              <div className="text-gray-600">Properties Owned</div>
              <div className="text-blue-600 text-sm mt-1">{portfolioData.totalTokens} total tokens</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                ${portfolioData.claimableDividends
                  .filter(d => d.status === 'Available')
                  .reduce((sum, d) => sum + d.amount, 0)
                  .toFixed(2)}
              </div>
              <div className="text-gray-600">Claimable Dividends</div>
              <div className="text-green-600 text-sm mt-1">Ready to claim</div>
            </div>
          </div>

          {/* Property Holdings */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Property Holdings</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Transactions
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tokens Owned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ownership %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Dividend
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portfolioData.properties.map((property, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{property.name}</div>
                            <div className="text-sm text-gray-500">{property.location}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {property.tokensOwned.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {(property.ownershipPercent * 100).toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${property.currentValue.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            ${property.expectedDividend.toFixed(2)}/quarter
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            property.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {property.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Dividend Claims */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Dividend Claims</h3>
              <button
                onClick={claimAllDividends}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Claim All Available
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portfolioData.claimableDividends.map((dividend, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{dividend.property}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${dividend.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{dividend.period}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            dividend.status === 'Available' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {dividend.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {dividend.status === 'Available' ? (
                            <button
                              onClick={() => claimDividend(dividend.property, dividend.amount)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Claim
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">Claimed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
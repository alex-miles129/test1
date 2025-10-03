import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, getCurrentContractAddresses, getCurrentNetworkConfig } from './constants';

// Contract ABIs (minimal for demo - in production, import from artifacts)
export const MOCK_STABLECOIN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function faucet() returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

export const REAL_ESTATE_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function getOwnershipPercentage(address account) view returns (uint256)',
  'function getOwnedValue(address account) view returns (uint256)',
  'function getPropertyInfo() view returns (tuple(string ipfsHash, uint256 totalValue, uint256 totalSupply, string propertyAddress, string description))',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export const TOKEN_SALE_ABI = [
  'function buyTokens(uint256 tokenAmount) payable',
  'function calculateCost(uint256 tokenAmount) view returns (uint256)',
  'function getSaleStats() view returns (uint256 totalSold, uint256 totalRaised, uint256 remainingSupply, uint256 currentPrice, bool isActive, uint8 currentPhase)',
  'function canParticipate(address buyer) view returns (bool)',
  'function saleConfig() view returns (tuple(uint256 pricePerToken, uint256 minPurchase, uint256 maxPurchase, uint256 maxTotalSupply, bool isActive))',
  'event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 stablecoinAmount, uint256 pricePerToken)',
];

export const INCOME_DISTRIBUTOR_ABI = [
  'function getClaimableAmount(address user) view returns (uint256)',
  'function calculateUserShare(uint256 round, address user) view returns (uint256)',
  'function claimDividend(uint256 round)',
  'function claimMultipleDividends(uint256[] calldata rounds)',
  'function getUserRoundStatus(uint256 round, address user) view returns (bool claimed, uint256 claimable, uint256 deadline)',
  'function currentRound() view returns (uint256)',
  'event DividendClaimed(address indexed claimer, uint256 indexed round, uint256 amount)',
];

/**
 * Get Ethereum provider (MetaMask or other wallet)
 */
export function getProvider(): ethers.BrowserProvider | null {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
}

/**
 * Get signer from connected wallet
 */
export async function getSigner(): Promise<ethers.JsonRpcSigner | null> {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    return await provider.getSigner();
  } catch (error) {
    console.error('Failed to get signer:', error);
    return null;
  }
}

/**
 * Connect to MetaMask wallet
 */
export async function connectWallet(): Promise<string | null> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const accounts = await provider.send('eth_requestAccounts', []);
    return accounts[0] || null;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

/**
 * Get connected wallet address
 */
export async function getConnectedAddress(): Promise<string | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const accounts = await provider.send('eth_accounts', []);
    return accounts[0] || null;
  } catch (error) {
    console.error('Failed to get connected address:', error);
    return null;
  }
}

/**
 * Get network chain ID
 */
export async function getChainId(): Promise<number | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const network = await provider.getNetwork();
    return Number(network.chainId);
  } catch (error) {
    console.error('Failed to get chain ID:', error);
    return null;
  }
}

/**
 * Switch to a specific network
 */
export async function switchNetwork(chainId: number): Promise<boolean> {
  const provider = getProvider();
  if (!provider) return false;

  try {
    await provider.send('wallet_switchEthereumChain', [
      { chainId: `0x${chainId.toString(16)}` },
    ]);
    return true;
  } catch (error: any) {
    console.error('Failed to switch network:', error);
    
    // If the network is not added to MetaMask, add it
    if (error.code === 4902) {
      return await addNetwork(chainId);
    }
    
    return false;
  }
}

/**
 * Add a network to MetaMask
 */
export async function addNetwork(chainId: number): Promise<boolean> {
  const provider = getProvider();
  if (!provider) return false;

  const networkConfig = getCurrentNetworkConfig();
  if (networkConfig.chainId !== chainId) return false;

  try {
    await provider.send('wallet_addEthereumChain', [
      {
        chainId: `0x${chainId.toString(16)}`,
        chainName: networkConfig.name,
        rpcUrls: [networkConfig.rpcUrl],
        nativeCurrency: networkConfig.nativeCurrency,
        blockExplorerUrls: [networkConfig.blockExplorer],
      },
    ]);
    return true;
  } catch (error) {
    console.error('Failed to add network:', error);
    return false;
  }
}

/**
 * Add token to MetaMask wallet
 */
export async function addTokenToWallet(
  tokenAddress: string,
  tokenSymbol: string,
  tokenDecimals: number,
  tokenImage?: string
): Promise<boolean> {
  const provider = getProvider();
  if (!provider) return false;

  try {
    await provider.send('wallet_watchAsset', [
      {
        type: 'ERC20',
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage,
        },
      },
    ]);
    return true;
  } catch (error) {
    console.error('Failed to add token to wallet:', error);
    return false;
  }
}

/**
 * Get contract instance
 */
export function getContract(
  contractAddress: string,
  abi: any[],
  signerOrProvider?: ethers.Signer | ethers.Provider
): ethers.Contract {
  const provider = signerOrProvider || getProvider();
  if (!provider) {
    throw new Error('No provider available');
  }
  
  return new ethers.Contract(contractAddress, abi, provider);
}

/**
 * Get MockStablecoin contract instance
 */
export function getMockStablecoinContract(signer?: ethers.Signer): ethers.Contract {
  const addresses = getCurrentContractAddresses();
  const provider = signer || getProvider();
  
  if (!provider) {
    throw new Error('No provider available');
  }
  
  return getContract(addresses.MockStablecoin, MOCK_STABLECOIN_ABI, provider);
}

/**
 * Get RealEstateToken contract instance
 */
export function getRealEstateTokenContract(signer?: ethers.Signer): ethers.Contract {
  const addresses = getCurrentContractAddresses();
  const provider = signer || getProvider();
  
  if (!provider) {
    throw new Error('No provider available');
  }
  
  return getContract(addresses.RealEstateToken, REAL_ESTATE_TOKEN_ABI, provider);
}

/**
 * Get TokenSale contract instance
 */
export function getTokenSaleContract(signer?: ethers.Signer): ethers.Contract {
  const addresses = getCurrentContractAddresses();
  const provider = signer || getProvider();
  
  if (!provider) {
    throw new Error('No provider available');
  }
  
  return getContract(addresses.TokenSale, TOKEN_SALE_ABI, provider);
}

/**
 * Get IncomeDistributor contract instance
 */
export function getIncomeDistributorContract(signer?: ethers.Signer): ethers.Contract {
  const addresses = getCurrentContractAddresses();
  const provider = signer || getProvider();
  
  if (!provider) {
    throw new Error('No provider available');
  }
  
  return getContract(addresses.IncomeDistributor, INCOME_DISTRIBUTOR_ABI, provider);
}

/**
 * Format ethers BigNumber to human readable string
 */
export function formatTokenAmount(amount: any, decimals: number = 18): string {
  try {
    return ethers.formatUnits(amount.toString(), decimals);
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
}

/**
 * Parse human readable amount to BigNumber
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  try {
    return ethers.parseUnits(amount, decimals);
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return BigInt(0);
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  txHash: string,
  confirmations: number = 2
): Promise<ethers.TransactionReceipt | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    return await provider.waitForTransaction(txHash, confirmations);
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    return null;
  }
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    return await provider.getTransactionReceipt(txHash);
  } catch (error) {
    console.error('Error getting transaction receipt:', error);
    return null;
  }
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  contract: ethers.Contract,
  methodName: string,
  args: any[] = []
): Promise<bigint | null> {
  try {
    return await contract[methodName].estimateGas(...args);
  } catch (error) {
    console.error('Error estimating gas:', error);
    return null;
  }
}

/**
 * Get current gas price
 */
export async function getGasPrice(): Promise<bigint | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const feeData = await provider.getFeeData();
    return feeData.gasPrice;
  } catch (error) {
    console.error('Error getting gas price:', error);
    return null;
  }
}

/**
 * Check if address is valid
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidAddress(address)) return address;
  
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Handle contract errors
 */
export function parseContractError(error: any): string {
  if (error?.reason) {
    return error.reason;
  }
  
  if (error?.message) {
    // Extract revert reason from error message
    const revertMatch = error.message.match(/revert (.+?)"/);
    if (revertMatch) {
      return revertMatch[1];
    }
    
    // Handle common error patterns
    if (error.message.includes('user rejected')) {
      return 'Transaction was rejected by user';
    }
    
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    
    if (error.message.includes('gas required exceeds allowance')) {
      return 'Transaction requires too much gas';
    }
    
    return error.message;
  }
  
  return 'Unknown contract error occurred';
}
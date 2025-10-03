// Type definitions
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface ContractAddresses {
  MockStablecoin: string;
  RealEstateToken: string;
  TokenSale: string;
  IncomeDistributor: string;
}

// Network configurations
export const NETWORKS: Record<number, NetworkConfig> = {
  // Local Hardhat
  31337: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  // Polygon Mumbai Testnet
  80001: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpcUrl: process.env.NEXT_PUBLIC_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  // Ethereum Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// Default network (change based on your deployment preference)
export const DEFAULT_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '80001');
export const DEFAULT_NETWORK = NETWORKS[DEFAULT_CHAIN_ID];

// Contract addresses - UPDATE THESE AFTER DEPLOYMENT
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  // Local Hardhat
  31337: {
    MockStablecoin: '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
    RealEstateToken: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
    TokenSale: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE',
    IncomeDistributor: '0x68B1D87F95878fE05B998F19b66F4baba5De1aed',
  },
  // Polygon Mumbai
  80001: {
    MockStablecoin: '0x...', // Replace with deployed address
    RealEstateToken: '0x...', // Replace with deployed address
    TokenSale: '0x...', // Replace with deployed address
    IncomeDistributor: '0x...', // Replace with deployed address
  },
  // Ethereum Sepolia
  11155111: {
    MockStablecoin: '0x...', // Replace with deployed address
    RealEstateToken: '0x...', // Replace with deployed address
    TokenSale: '0x...', // Replace with deployed address
    IncomeDistributor: '0x...', // Replace with deployed address
  },
};

// Token configurations
export const TOKEN_CONFIGS = {
  stablecoin: {
    symbol: 'mUSDC',
    decimals: 6,
    name: 'Mock USDC',
  },
  propertyToken: {
    symbol: 'SVT',
    decimals: 18,
    name: 'Sunset Villa Tokens',
  },
};

// Transaction settings
export const TX_SETTINGS = {
  gasLimit: {
    approve: 100000,
    buyTokens: 300000,
    claimDividend: 150000,
    transfer: 100000,
  },
  maxGasPrice: '50000000000', // 50 gwei
  confirmations: 2,
  timeout: 300000, // 5 minutes
};

// UI Constants
export const UI_CONFIG = {
  // Polling intervals (in milliseconds)
  balanceRefreshInterval: 10000, // 10 seconds
  transactionPollInterval: 2000, // 2 seconds
  priceUpdateInterval: 30000, // 30 seconds
  
  // Animation durations
  animationDuration: 300,
  toastDuration: 5000,
  modalAnimationDuration: 200,
  
  // Pagination
  itemsPerPage: 10,
  maxItemsPerPage: 50,
  
  // Form validation
  minTokenPurchase: 10,
  maxTokenPurchase: 10000,
  minStablecoinAmount: 10,
  
  // Number formatting
  currencyDecimals: 2,
  tokenDecimals: 4,
  percentageDecimals: 2,
};

// IPFS Configuration
export const IPFS_CONFIG = {
  gatewayUrls: [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://w3s.link/ipfs/',
    'https://dweb.link/ipfs/',
  ],
  timeout: 10000,
  retries: 3,
};

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
};

// Error Messages
export const ERROR_MESSAGES = {
  // Wallet errors
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  WALLET_CONNECTION_FAILED: 'Failed to connect wallet. Please try again.',
  UNSUPPORTED_NETWORK: 'Please switch to a supported network',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  
  // Transaction errors
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  TRANSACTION_REJECTED: 'Transaction was rejected by user',
  INSUFFICIENT_GAS: 'Insufficient gas for transaction',
  NONCE_TOO_LOW: 'Transaction nonce too low',
  
  // Contract errors
  CONTRACT_NOT_FOUND: 'Contract not found at this address',
  INVALID_CONTRACT_CALL: 'Invalid contract function call',
  CONTRACT_PAUSED: 'Contract is currently paused',
  
  // Form validation errors
  INVALID_AMOUNT: 'Please enter a valid amount',
  AMOUNT_TOO_SMALL: 'Amount is below minimum requirement',
  AMOUNT_TOO_LARGE: 'Amount exceeds maximum limit',
  REQUIRED_FIELD: 'This field is required',
  
  // API errors
  API_ERROR: 'API request failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  
  // Generic errors
  UNKNOWN_ERROR: 'An unknown error occurred',
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_SUBMITTED: 'Transaction submitted successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
  TOKENS_PURCHASED: 'Property tokens purchased successfully',
  DIVIDEND_CLAIMED: 'Dividend claimed successfully',
  APPROVAL_SUCCESSFUL: 'Token approval successful',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_ADDRESS: 'realtoken_wallet_address',
  WALLET_PROVIDER: 'realtoken_wallet_provider',
  PREFERRED_CURRENCY: 'realtoken_preferred_currency',
  THEME: 'realtoken_theme',
  TRANSACTION_HISTORY: 'realtoken_tx_history',
  USER_PREFERENCES: 'realtoken_user_preferences',
};

// Route Paths
export const ROUTES = {
  HOME: '/',
  PORTFOLIO: '/portfolio',
  PROPERTY: '/property',
  ABOUT: '/about',
  HELP: '/help',
  TERMS: '/terms',
  PRIVACY: '/privacy',
};

// External Links
export const EXTERNAL_LINKS = {
  DISCORD: 'https://discord.gg/realtoken',
  TWITTER: 'https://twitter.com/realtoken',
  TELEGRAM: 'https://t.me/realtoken',
  GITHUB: 'https://github.com/realtoken/realtoken-project',
  DOCS: 'https://docs.realtoken.com',
  BLOG: 'https://blog.realtoken.com',
  
  // Blockchain explorers
  ETHERSCAN: 'https://etherscan.io',
  POLYGONSCAN: 'https://polygonscan.com',
  MUMBAI_POLYGONSCAN: 'https://mumbai.polygonscan.com',
  SEPOLIA_ETHERSCAN: 'https://sepolia.etherscan.io',
  
  // DeFi platforms
  UNISWAP: 'https://app.uniswap.org',
  QUICKSWAP: 'https://quickswap.exchange',
  
  // Educational resources
  METAMASK_SETUP: 'https://metamask.io/download/',
  POLYGON_SETUP: 'https://docs.polygon.technology/docs/develop/metamask/config-polygon-on-metamask/',
  WEB3_GUIDE: 'https://ethereum.org/en/wallets/',
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_DARK_MODE: true,
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
  ENABLE_ERROR_REPORTING: process.env.NODE_ENV === 'production',
  ENABLE_PWA: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_MOBILE_OPTIMIZATIONS: true,
  ENABLE_ADVANCED_CHARTS: true,
  ENABLE_MULTI_LANGUAGE: false, // Future feature
  ENABLE_SOCIAL_LOGIN: false, // Future feature
};

// Asset URLs (for demo purposes)
export const DEMO_ASSETS = {
  PROPERTY_IMAGE: '/images/sunset-villa.jpg',
  PROPERTY_GALLERY: [
    '/images/property-1.jpg',
    '/images/property-2.jpg',
    '/images/property-3.jpg',
    '/images/property-4.jpg',
  ],
  LOGO: '/images/realtoken-logo.svg',
  ICON: '/images/realtoken-icon.svg',
  PLACEHOLDER_AVATAR: '/images/placeholder-avatar.svg',
};

// MetaMask token addition parameters
export const METAMASK_TOKEN_PARAMS = {
  stablecoin: {
    type: 'ERC20',
    options: {
      address: '', // Will be filled dynamically
      symbol: TOKEN_CONFIGS.stablecoin.symbol,
      decimals: TOKEN_CONFIGS.stablecoin.decimals,
      image: `${process.env.NEXT_PUBLIC_APP_URL}/images/usdc-icon.svg`,
    },
  },
  propertyToken: {
    type: 'ERC20',
    options: {
      address: '', // Will be filled dynamically
      symbol: TOKEN_CONFIGS.propertyToken.symbol,
      decimals: TOKEN_CONFIGS.propertyToken.decimals,
      image: `${process.env.NEXT_PUBLIC_APP_URL}/images/property-token-icon.svg`,
    },
  },
};

// Utility function to get current network config
export function getCurrentNetworkConfig(): NetworkConfig {
  return NETWORKS[DEFAULT_CHAIN_ID] || NETWORKS[31337];
}

// Utility function to get current contract addresses
export function getCurrentContractAddresses(): ContractAddresses {
  return CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID] || CONTRACT_ADDRESSES[31337];
}

// Utility function to get block explorer URL
export function getBlockExplorerUrl(hash: string, type: 'tx' | 'address' = 'tx'): string {
  const network = getCurrentNetworkConfig();
  return `${network.blockExplorer}/${type}/${hash}`;
}

// Utility function to format currency
export function formatCurrency(amount: number, symbol: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: symbol === 'USD' ? 'USD' : undefined,
    minimumFractionDigits: UI_CONFIG.currencyDecimals,
    maximumFractionDigits: UI_CONFIG.currencyDecimals,
  }).format(amount);
}

// Utility function to format percentage
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: UI_CONFIG.percentageDecimals,
    maximumFractionDigits: UI_CONFIG.percentageDecimals,
  }).format(value / 100);
}
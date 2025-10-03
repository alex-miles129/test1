import { BigNumberish } from 'ethers';

// Ethereum wallet types
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  balance: string;
}

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

// Contract types
export interface ContractAddresses {
  MockStablecoin: string;
  RealEstateToken: string;
  TokenSale: string;
  IncomeDistributor: string;
}

// Property types
export interface PropertyInfo {
  ipfsHash: string;
  totalValue: BigNumberish;
  totalSupply: BigNumberish;
  propertyAddress: string;
  description: string;
}

export interface PropertyMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: PropertyAttribute[];
  properties: PropertyDetails;
  legal: LegalInfo;
}

export interface PropertyAttribute {
  trait_type: string;
  value: string | number;
}

export interface PropertyDetails {
  address: string;
  zipCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  propertyType: string;
  totalValue: number;
  tokenSupply: number;
  pricePerToken: number;
  currency: string;
  investmentType: string;
  managementCompany: string;
  insurance: string;
  maintenance: string;
  tenant: {
    status: string;
    leaseEnd: string;
    monthlyRent: number;
  };
}

export interface LegalInfo {
  propertyId: string;
  deedReference: string;
  title: string;
  zoning: string;
  taxAssessment: number;
  propertyTaxAnnual: number;
}

// Token sale types
export interface SaleConfig {
  pricePerToken: BigNumberish;
  minPurchase: BigNumberish;
  maxPurchase: BigNumberish;
  maxTotalSupply: BigNumberish;
  isActive: boolean;
}

export interface SaleStats {
  totalSold: BigNumberish;
  totalRaised: BigNumberish;
  remainingSupply: BigNumberish;
  currentPrice: BigNumberish;
  isActive: boolean;
  currentPhase: SalePhase;
}

export enum SalePhase {
  Paused = 0,
  Private = 1,
  Public = 2
}

// Transaction types
export interface Transaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  type: 'approve' | 'buy' | 'claim' | 'transfer';
  amount?: string;
  timestamp: number;
}

// User portfolio types
export interface UserPortfolio {
  propertyTokenBalance: string;
  stablecoinBalance: string;
  ownershipPercentage: string;
  ownedValue: string;
  claimableAmount: string;
  purchaseHistory: string;
  totalInvested: string;
}

// Income distribution types
export interface DistributionRound {
  round: number;
  totalAmount: BigNumberish;
  totalSupplySnapshot: BigNumberish;
  distributionTime: number;
  claimDeadline: number;
  claimed: boolean;
  claimableAmount: BigNumberish;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PropertyApiResponse {
  id: string;
  metadata: PropertyMetadata;
  contractInfo: PropertyInfo;
  saleStats: SaleStats;
  ipfsHash: string;
}

// Component prop types
export interface PropertyCardProps {
  property: PropertyApiResponse;
  onInvest: (propertyId: string) => void;
}

export interface BuyTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyApiResponse;
  userBalance: string;
  onSuccess: (txHash: string) => void;
}

export interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

// Form types
export interface BuyTokensForm {
  tokenAmount: string;
  stablecoinAmount: string;
  agreedToTerms: boolean;
}

export interface ClaimDividendsForm {
  selectedRounds: number[];
  totalClaimable: string;
}

// Error types
export interface ContractError {
  code: string;
  message: string;
  reason?: string;
  transaction?: {
    hash: string;
    data: string;
  };
}

// Event types
export interface TokensPurchasedEvent {
  buyer: string;
  tokenAmount: BigNumberish;
  stablecoinAmount: BigNumberish;
  pricePerToken: BigNumberish;
  transactionHash: string;
  blockNumber: number;
}

export interface DividendClaimedEvent {
  claimer: string;
  round: number;
  amount: BigNumberish;
  transactionHash: string;
  blockNumber: number;
}

// Hook types
export interface UseContractReturn<T> {
  contract: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseWalletReturn {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  addToken: (tokenAddress: string, symbol: string, decimals: number) => Promise<void>;
}

// Utility types
export type Address = string;
export type Hash = string;
export type Timestamp = number;

// Loading states
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
}

// Toast notification types
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Chart data types for analytics
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

// Filter and search types
export interface PropertyFilters {
  priceRange: [number, number];
  propertyType: string[];
  location: string[];
  roiRange: [number, number];
  tokenSupplyRange: [number, number];
}

export interface SearchQuery {
  query: string;
  filters: PropertyFilters;
  sortBy: 'price' | 'roi' | 'location' | 'recent';
  sortOrder: 'asc' | 'desc';
}
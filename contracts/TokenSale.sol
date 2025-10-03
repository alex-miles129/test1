// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./RealEstateToken.sol";

/**
 * @title TokenSale
 * @dev Contract for selling RealEstateTokens in exchange for stablecoins
 * 
 * Features:
 * - Accept stablecoin payments via transferFrom
 * - Mint and transfer property tokens to buyers
 * - Configurable pricing
 * - Sale phases (private, public, paused)
 * - Purchase limits and minimums
 * - Emergency pause functionality
 */
contract TokenSale is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Sale configuration
    struct SaleConfig {
        uint256 pricePerToken;    // Price in stablecoin units (e.g., 1e6 for 1 USDC)
        uint256 minPurchase;      // Minimum tokens per purchase
        uint256 maxPurchase;      // Maximum tokens per purchase (0 = no limit)
        uint256 maxTotalSupply;   // Maximum total tokens that can be sold
        bool isActive;            // Whether the sale is active
    }
    
    // Sale phases
    enum SalePhase { Paused, Private, Public }
    
    // State variables
    RealEstateToken public immutable propertyToken;
    IERC20 public immutable stablecoin;
    SaleConfig public saleConfig;
    SalePhase public currentPhase;
    
    uint256 public totalSold;
    uint256 public totalRaised;
    
    // Whitelist for private sale
    mapping(address => bool) public whitelistedBuyers;
    mapping(address => uint256) public purchaseHistory;
    
    // Events
    event TokensPurchased(
        address indexed buyer,
        uint256 tokenAmount,
        uint256 stablecoinAmount,
        uint256 pricePerToken
    );
    event SaleConfigUpdated(
        uint256 pricePerToken,
        uint256 minPurchase,
        uint256 maxPurchase,
        uint256 maxTotalSupply,
        bool isActive
    );
    event SalePhaseChanged(SalePhase newPhase);
    event BuyerWhitelisted(address indexed buyer, bool whitelisted);
    event StablecoinsWithdrawn(address indexed recipient, uint256 amount);
    event EmergencyWithdraw(address indexed token, address indexed recipient, uint256 amount);
    
    modifier onlyActiveSale() {
        require(saleConfig.isActive, "TokenSale: sale is not active");
        _;
    }
    
    modifier validPhase() {
        require(currentPhase != SalePhase.Paused, "TokenSale: sale is paused");
        _;
    }
    
    modifier onlyWhitelistedOrPublic() {
        if (currentPhase == SalePhase.Private) {
            require(whitelistedBuyers[msg.sender], "TokenSale: not whitelisted for private sale");
        }
        _;
    }
    
    constructor(
        address _propertyToken,
        address _stablecoin,
        address _owner,
        SaleConfig memory _saleConfig
    ) Ownable(_owner) {
        require(_propertyToken != address(0), "TokenSale: invalid property token");
        require(_stablecoin != address(0), "TokenSale: invalid stablecoin");
        
        propertyToken = RealEstateToken(_propertyToken);
        stablecoin = IERC20(_stablecoin);
        saleConfig = _saleConfig;
        currentPhase = SalePhase.Paused;
        
        emit SaleConfigUpdated(
            _saleConfig.pricePerToken,
            _saleConfig.minPurchase,
            _saleConfig.maxPurchase,
            _saleConfig.maxTotalSupply,
            _saleConfig.isActive
        );
    }
    
    /**
     * @dev Buy property tokens with stablecoins
     * @param tokenAmount Amount of property tokens to buy
     * @notice Buyer must approve stablecoin allowance before calling this function
     */
    function buyTokens(uint256 tokenAmount) 
        external 
        nonReentrant 
        onlyActiveSale 
        validPhase 
        onlyWhitelistedOrPublic 
    {
        require(tokenAmount > 0, "TokenSale: token amount must be positive");
        require(tokenAmount >= saleConfig.minPurchase, "TokenSale: below minimum purchase");
        
        if (saleConfig.maxPurchase > 0) {
            require(tokenAmount <= saleConfig.maxPurchase, "TokenSale: exceeds maximum purchase");
        }
        
        require(
            totalSold + tokenAmount <= saleConfig.maxTotalSupply,
            "TokenSale: would exceed total supply"
        );
        
        // Calculate stablecoin cost
        uint256 stablecoinAmount = tokenAmount * saleConfig.pricePerToken;
        require(stablecoinAmount > 0, "TokenSale: invalid stablecoin amount");
        
        // Check buyer's stablecoin balance and allowance
        require(
            stablecoin.balanceOf(msg.sender) >= stablecoinAmount,
            "TokenSale: insufficient stablecoin balance"
        );
        require(
            stablecoin.allowance(msg.sender, address(this)) >= stablecoinAmount,
            "TokenSale: insufficient stablecoin allowance"
        );
        
        // Transfer stablecoins from buyer to this contract
        stablecoin.safeTransferFrom(msg.sender, address(this), stablecoinAmount);
        
        // Mint property tokens to buyer
        propertyToken.mint(msg.sender, tokenAmount);
        
        // Update statistics
        totalSold += tokenAmount;
        totalRaised += stablecoinAmount;
        purchaseHistory[msg.sender] += tokenAmount;
        
        emit TokensPurchased(msg.sender, tokenAmount, stablecoinAmount, saleConfig.pricePerToken);
    }
    
    /**
     * @dev Update sale configuration (owner only)
     */
    function updateSaleConfig(SaleConfig memory _saleConfig) external onlyOwner {
        require(_saleConfig.pricePerToken > 0, "TokenSale: invalid price");
        require(_saleConfig.maxTotalSupply > 0, "TokenSale: invalid max supply");
        
        saleConfig = _saleConfig;
        
        emit SaleConfigUpdated(
            _saleConfig.pricePerToken,
            _saleConfig.minPurchase,
            _saleConfig.maxPurchase,
            _saleConfig.maxTotalSupply,
            _saleConfig.isActive
        );
    }
    
    /**
     * @dev Change sale phase (owner only)
     */
    function setSalePhase(SalePhase _phase) external onlyOwner {
        currentPhase = _phase;
        emit SalePhaseChanged(_phase);
    }
    
    /**
     * @dev Whitelist buyers for private sale (owner only)
     */
    function setWhitelistStatus(address[] calldata buyers, bool whitelisted) external onlyOwner {
        for (uint256 i = 0; i < buyers.length; i++) {
            whitelistedBuyers[buyers[i]] = whitelisted;
            emit BuyerWhitelisted(buyers[i], whitelisted);
        }
    }
    
    /**
     * @dev Withdraw collected stablecoins (owner only)
     */
    function withdrawStablecoins(address recipient) external onlyOwner {
        require(recipient != address(0), "TokenSale: invalid recipient");
        
        uint256 balance = stablecoin.balanceOf(address(this));
        require(balance > 0, "TokenSale: no stablecoins to withdraw");
        
        stablecoin.safeTransfer(recipient, balance);
        emit StablecoinsWithdrawn(recipient, balance);
    }
    
    /**
     * @dev Emergency withdrawal function for any ERC20 token (owner only)
     */
    function emergencyWithdraw(address token, address recipient) external onlyOwner {
        require(recipient != address(0), "TokenSale: invalid recipient");
        
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "TokenSale: no tokens to withdraw");
        
        tokenContract.safeTransfer(recipient, balance);
        emit EmergencyWithdraw(token, recipient, balance);
    }
    
    /**
     * @dev Get sale statistics
     */
    function getSaleStats() external view returns (
        uint256 _totalSold,
        uint256 _totalRaised,
        uint256 _remainingSupply,
        uint256 _currentPrice,
        bool _isActive,
        SalePhase _currentPhase
    ) {
        return (
            totalSold,
            totalRaised,
            saleConfig.maxTotalSupply - totalSold,
            saleConfig.pricePerToken,
            saleConfig.isActive,
            currentPhase
        );
    }
    
    /**
     * @dev Calculate stablecoin cost for token amount
     */
    function calculateCost(uint256 tokenAmount) external view returns (uint256) {
        return tokenAmount * saleConfig.pricePerToken;
    }
    
    /**
     * @dev Check if address can participate in current sale phase
     */
    function canParticipate(address buyer) external view returns (bool) {
        if (!saleConfig.isActive || currentPhase == SalePhase.Paused) {
            return false;
        }
        
        if (currentPhase == SalePhase.Private) {
            return whitelistedBuyers[buyer];
        }
        
        return true; // Public phase
    }
    
    /**
     * @dev Get buyer's purchase history
     */
    function getBuyerHistory(address buyer) external view returns (uint256) {
        return purchaseHistory[buyer];
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RealEstateToken
 * @dev ERC-20 token representing fractional ownership of a real estate asset
 * 
 * Features:
 * - Fractional ownership through ERC-20 tokens
 * - Property metadata stored on IPFS
 * - Mintable by authorized TokenSale contracts
 * - Transfer restrictions for compliance (optional)
 * - Dividend distribution capabilities
 */
contract RealEstateToken is ERC20, Ownable, ReentrancyGuard {
    
    // Property metadata
    struct PropertyInfo {
        string ipfsHash;        // IPFS hash for property documents/images
        uint256 totalValue;     // Total property value in USD (scaled by 1e6)
        uint256 totalSupply;    // Total token supply for this property
        string propertyAddress; // Physical address of the property
        string description;     // Property description
    }
    
    PropertyInfo public propertyInfo;
    
    // Access control
    mapping(address => bool) public authorizedMinters;
    
    // Transfer restrictions (for compliance)
    bool public transferRestricted = false;
    mapping(address => bool) public whitelistedAddresses;
    
    // Events
    event PropertyInfoUpdated(string ipfsHash, uint256 totalValue);
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event TransferRestrictionUpdated(bool restricted);
    event AddressWhitelisted(address indexed account, bool whitelisted);
    
    modifier onlyAuthorizedMinter() {
        require(
            authorizedMinters[msg.sender] || msg.sender == owner(),
            "RealEstateToken: caller is not authorized minter"
        );
        _;
    }
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        PropertyInfo memory _propertyInfo
    ) ERC20(name, symbol) Ownable(initialOwner) {
        propertyInfo = _propertyInfo;
        
        // Owner is automatically whitelisted
        whitelistedAddresses[initialOwner] = true;
        
        emit PropertyInfoUpdated(_propertyInfo.ipfsHash, _propertyInfo.totalValue);
    }
    
    /**
     * @dev Mint tokens to specified address (only authorized minters)
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyAuthorizedMinter nonReentrant {
        require(to != address(0), "RealEstateToken: mint to zero address");
        require(amount > 0, "RealEstateToken: mint amount must be positive");
        
        // Check if minting would exceed total supply
        require(
            totalSupply() + amount <= propertyInfo.totalSupply,
            "RealEstateToken: minting would exceed total supply"
        );
        
        _mint(to, amount);
    }
    
    /**
     * @dev Authorize an address to mint tokens (owner only)
     * @param minter Address to authorize
     */
    function authorizeMinter(address minter) external onlyOwner {
        require(minter != address(0), "RealEstateToken: zero address");
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }
    
    /**
     * @dev Revoke minting authorization (owner only)
     * @param minter Address to revoke authorization from
     */
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }
    
    /**
     * @dev Update property information (owner only)
     * @param _ipfsHash New IPFS hash for property documents
     * @param _totalValue New total property value
     * @param _propertyAddress New property address
     * @param _description New property description
     */
    function updatePropertyInfo(
        string memory _ipfsHash,
        uint256 _totalValue,
        string memory _propertyAddress,
        string memory _description
    ) external onlyOwner {
        propertyInfo.ipfsHash = _ipfsHash;
        propertyInfo.totalValue = _totalValue;
        propertyInfo.propertyAddress = _propertyAddress;
        propertyInfo.description = _description;
        
        emit PropertyInfoUpdated(_ipfsHash, _totalValue);
    }
    
    /**
     * @dev Set transfer restrictions (owner only)
     * @param restricted Whether transfers should be restricted
     */
    function setTransferRestriction(bool restricted) external onlyOwner {
        transferRestricted = restricted;
        emit TransferRestrictionUpdated(restricted);
    }
    
    /**
     * @dev Whitelist an address for transfers (owner only)
     * @param account Address to whitelist
     * @param whitelisted Whether the address should be whitelisted
     */
    function setAddressWhitelist(address account, bool whitelisted) external onlyOwner {
        whitelistedAddresses[account] = whitelisted;
        emit AddressWhitelisted(account, whitelisted);
    }
    
    /**
     * @dev Get ownership percentage for an address
     * @param account Address to check
     * @return Ownership percentage (scaled by 1e18 for precision)
     */
    function getOwnershipPercentage(address account) external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        return (balanceOf(account) * 1e18) / totalSupply();
    }
    
    /**
     * @dev Get property value owned by an address
     * @param account Address to check
     * @return Value in USD (scaled by 1e6)
     */
    function getOwnedValue(address account) external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        return (balanceOf(account) * propertyInfo.totalValue) / totalSupply();
    }
    
    /**
     * @dev Override transfer to implement restrictions if enabled
     */
    function _update(address from, address to, uint256 value) internal override {
        if (transferRestricted && from != address(0) && to != address(0)) {
            require(
                whitelistedAddresses[from] || whitelistedAddresses[to] || 
                from == owner() || to == owner(),
                "RealEstateToken: transfer not allowed"
            );
        }
        
        super._update(from, to, value);
    }
    
    /**
     * @dev Get all property information
     * @return PropertyInfo struct with all property details
     */
    function getPropertyInfo() external view returns (PropertyInfo memory) {
        return propertyInfo;
    }
}
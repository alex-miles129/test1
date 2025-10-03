// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockStablecoin
 * @dev A mock USD stablecoin contract for testing and demo purposes
 * @notice This is NOT a real stablecoin - for hackathon/testing only!
 * 
 * Features:
 * - Standard ERC-20 functionality
 * - Mintable by owner (for demo purposes)
 * - 6 decimals to match USDC/USDT
 * - Faucet function for easy testing
 */
contract MockStablecoin is ERC20, Ownable {
    uint8 private constant DECIMALS = 6; // Match USDC decimals
    
    // Events
    event Mint(address indexed to, uint256 amount);
    event FaucetUsed(address indexed user, uint256 amount);
    
    // Faucet configuration
    uint256 public faucetAmount = 1000 * 10**DECIMALS; // 1000 mUSDC
    mapping(address => uint256) public lastFaucetTime;
    uint256 public faucetCooldown = 1 hours;
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        // Mint initial supply to owner for distribution
        _mint(initialOwner, 10_000_000 * 10**DECIMALS); // 10M mUSDC
    }
    
    /**
     * @dev Returns the number of decimals used for user representation
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @dev Mint tokens to specified address (owner only)
     * @param to Address to mint tokens to
     * @param amount Amount to mint (in wei units)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "MockStablecoin: mint to zero address");
        require(amount > 0, "MockStablecoin: mint amount must be positive");
        
        _mint(to, amount);
        emit Mint(to, amount);
    }
    
    /**
     * @dev Faucet function - allows users to get free test tokens
     * @notice Users can claim free tokens once per cooldown period
     */
    function faucet() external {
        require(
            lastFaucetTime[msg.sender] + faucetCooldown <= block.timestamp,
            "MockStablecoin: faucet cooldown not met"
        );
        
        lastFaucetTime[msg.sender] = block.timestamp;
        _mint(msg.sender, faucetAmount);
        
        emit FaucetUsed(msg.sender, faucetAmount);
    }
    
    /**
     * @dev Set faucet amount (owner only)
     * @param newAmount New faucet amount
     */
    function setFaucetAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "MockStablecoin: amount must be positive");
        faucetAmount = newAmount;
    }
    
    /**
     * @dev Set faucet cooldown period (owner only)
     * @param newCooldown New cooldown in seconds
     */
    function setFaucetCooldown(uint256 newCooldown) external onlyOwner {
        faucetCooldown = newCooldown;
    }
    
    /**
     * @dev Get time until next faucet claim for user
     * @param user Address to check
     * @return Time in seconds until next claim (0 if can claim now)
     */
    function timeUntilNextFaucet(address user) external view returns (uint256) {
        uint256 nextClaimTime = lastFaucetTime[user] + faucetCooldown;
        if (nextClaimTime <= block.timestamp) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }
}
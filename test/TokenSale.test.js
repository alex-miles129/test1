const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSale Contract", function () {
  let mockStablecoin, realEstateToken, tokenSale;
  let owner, buyer1, buyer2, treasury;
  let propertyInfo, saleConfig;

  const STABLECOIN_DECIMALS = 6;
  const PROPERTY_DECIMALS = 18;
  const PROPERTY_VALUE = ethers.parseUnits("500000", STABLECOIN_DECIMALS); // $500,000
  const TOTAL_SUPPLY = ethers.parseUnits("500000", PROPERTY_DECIMALS); // 500,000 tokens
  const PRICE_PER_TOKEN = ethers.parseUnits("1", STABLECOIN_DECIMALS); // 1 mUSDC per token

  beforeEach(async function () {
    [owner, buyer1, buyer2, treasury] = await ethers.getSigners();

    // Deploy MockStablecoin
    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    mockStablecoin = await MockStablecoin.deploy("Mock USDC", "mUSDC", owner.address);

    // Property info
    propertyInfo = {
      ipfsHash: "QmTestHash123",
      totalValue: PROPERTY_VALUE,
      totalSupply: TOTAL_SUPPLY,
      propertyAddress: "123 Test Street",
      description: "Test property for unit testing"
    };

    // Deploy RealEstateToken
    const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
    realEstateToken = await RealEstateToken.deploy(
      "Test Property",
      "TPT",
      owner.address,
      propertyInfo
    );

    // Sale configuration
    saleConfig = {
      pricePerToken: PRICE_PER_TOKEN,
      minPurchase: ethers.parseUnits("10", PROPERTY_DECIMALS), // Min 10 tokens
      maxPurchase: ethers.parseUnits("10000", PROPERTY_DECIMALS), // Max 10,000 tokens
      maxTotalSupply: TOTAL_SUPPLY,
      isActive: true
    };

    // Deploy TokenSale
    const TokenSale = await ethers.getContractFactory("TokenSale");
    tokenSale = await TokenSale.deploy(
      await realEstateToken.getAddress(),
      await mockStablecoin.getAddress(),
      owner.address,
      saleConfig
    );

    // Authorize TokenSale to mint property tokens
    await realEstateToken.authorizeMinter(await tokenSale.getAddress());

    // Set sale phase to Public
    await tokenSale.setSalePhase(2); // Public phase

    // Give buyers some stablecoins
    const testAmount = ethers.parseUnits("50000", STABLECOIN_DECIMALS); // 50,000 mUSDC
    await mockStablecoin.mint(buyer1.address, testAmount);
    await mockStablecoin.mint(buyer2.address, testAmount);
  });

  describe("Deployment", function () {
    it("Should set the correct initial parameters", async function () {
      expect(await tokenSale.propertyToken()).to.equal(await realEstateToken.getAddress());
      expect(await tokenSale.stablecoin()).to.equal(await mockStablecoin.getAddress());
      expect(await tokenSale.owner()).to.equal(owner.address);

      const config = await tokenSale.saleConfig();
      expect(config.pricePerToken).to.equal(PRICE_PER_TOKEN);
      expect(config.isActive).to.be.true;
    });

    it("Should start with correct sale statistics", async function () {
      const stats = await tokenSale.getSaleStats();
      expect(stats._totalSold).to.equal(0);
      expect(stats._totalRaised).to.equal(0);
      expect(stats._remainingSupply).to.equal(TOTAL_SUPPLY);
      expect(stats._currentPrice).to.equal(PRICE_PER_TOKEN);
      expect(stats._isActive).to.be.true;
    });
  });

  describe("Token Purchase", function () {
    it("Should allow users to buy tokens with correct flow", async function () {
      const tokenAmount = ethers.parseUnits("100", PROPERTY_DECIMALS);
      const cost = await tokenSale.calculateCost(tokenAmount);

      // Approve stablecoin spending
      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);

      // Buy tokens
      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.emit(tokenSale, "TokensPurchased")
        .withArgs(buyer1.address, tokenAmount, cost, PRICE_PER_TOKEN);

      // Check balances
      expect(await realEstateToken.balanceOf(buyer1.address)).to.equal(tokenAmount);
      expect(await mockStablecoin.balanceOf(await tokenSale.getAddress())).to.equal(cost);

      // Check purchase history
      expect(await tokenSale.getBuyerHistory(buyer1.address)).to.equal(tokenAmount);
    });

    it("Should calculate ownership percentage correctly", async function () {
      const tokenAmount = ethers.parseUnits("1000", PROPERTY_DECIMALS); // 1000 tokens
      const cost = await tokenSale.calculateCost(tokenAmount);

      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);
      await tokenSale.connect(buyer1).buyTokens(tokenAmount);

      // 1000 tokens out of 500,000 total = 0.2%
      const ownership = await realEstateToken.getOwnershipPercentage(buyer1.address);
      const expectedOwnership = ethers.parseUnits("0.002", 18); // 0.2% = 0.002 in decimal
      expect(ownership).to.equal(expectedOwnership);
    });

    it("Should fail if insufficient stablecoin balance", async function () {
      const tokenAmount = ethers.parseUnits("100000", PROPERTY_DECIMALS); // More than buyer has
      const cost = await tokenSale.calculateCost(tokenAmount);

      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);

      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.be.revertedWith("TokenSale: insufficient stablecoin balance");
    });

    it("Should fail if insufficient allowance", async function () {
      const tokenAmount = ethers.parseUnits("100", PROPERTY_DECIMALS);
      const cost = await tokenSale.calculateCost(tokenAmount);
      const insufficientAmount = cost / 2n;

      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), insufficientAmount);

      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.be.revertedWith("TokenSale: insufficient stablecoin allowance");
    });

    it("Should enforce minimum purchase amount", async function () {
      const tokenAmount = ethers.parseUnits("5", PROPERTY_DECIMALS); // Below minimum of 10
      const cost = await tokenSale.calculateCost(tokenAmount);

      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);

      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.be.revertedWith("TokenSale: below minimum purchase");
    });

    it("Should enforce maximum purchase amount", async function () {
      const tokenAmount = ethers.parseUnits("15000", PROPERTY_DECIMALS); // Above maximum of 10,000
      const cost = await tokenSale.calculateCost(tokenAmount);

      // Give buyer enough stablecoins
      await mockStablecoin.mint(buyer1.address, cost);
      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);

      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.be.revertedWith("TokenSale: exceeds maximum purchase");
    });

    it("Should prevent exceeding total supply", async function () {
      // Update sale config to have small total supply
      const smallSupply = ethers.parseUnits("100", PROPERTY_DECIMALS);
      const newConfig = {
        ...saleConfig,
        maxTotalSupply: smallSupply
      };

      await tokenSale.updateSaleConfig(newConfig);

      const tokenAmount = ethers.parseUnits("150", PROPERTY_DECIMALS); // More than total supply
      const cost = await tokenSale.calculateCost(tokenAmount);

      await mockStablecoin.mint(buyer1.address, cost);
      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);

      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.be.revertedWith("TokenSale: would exceed total supply");
    });
  });

  describe("Sale Phases", function () {
    it("Should prevent purchases when sale is paused", async function () {
      await tokenSale.setSalePhase(0); // Paused

      const tokenAmount = ethers.parseUnits("100", PROPERTY_DECIMALS);
      const cost = await tokenSale.calculateCost(tokenAmount);

      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);

      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.be.revertedWith("TokenSale: sale is paused");
    });

    it("Should enforce whitelist in private sale phase", async function () {
      await tokenSale.setSalePhase(1); // Private phase

      const tokenAmount = ethers.parseUnits("100", PROPERTY_DECIMALS);
      const cost = await tokenSale.calculateCost(tokenAmount);

      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);

      // Should fail as buyer1 is not whitelisted
      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.be.revertedWith("TokenSale: not whitelisted for private sale");

      // Whitelist buyer1 and try again
      await tokenSale.setWhitelistStatus([buyer1.address], true);

      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.emit(tokenSale, "TokensPurchased");
    });

    it("Should allow anyone in public phase", async function () {
      await tokenSale.setSalePhase(2); // Public phase

      const tokenAmount = ethers.parseUnits("100", PROPERTY_DECIMALS);
      const cost = await tokenSale.calculateCost(tokenAmount);

      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);

      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.emit(tokenSale, "TokensPurchased");
    });
  });

  describe("Sale Configuration", function () {
    it("Should allow owner to update sale configuration", async function () {
      const newConfig = {
        pricePerToken: ethers.parseUnits("2", STABLECOIN_DECIMALS), // Double the price
        minPurchase: ethers.parseUnits("20", PROPERTY_DECIMALS),
        maxPurchase: ethers.parseUnits("5000", PROPERTY_DECIMALS),
        maxTotalSupply: ethers.parseUnits("250000", PROPERTY_DECIMALS),
        isActive: false
      };

      await expect(tokenSale.updateSaleConfig(newConfig))
        .to.emit(tokenSale, "SaleConfigUpdated");

      const config = await tokenSale.saleConfig();
      expect(config.pricePerToken).to.equal(newConfig.pricePerToken);
      expect(config.isActive).to.equal(newConfig.isActive);
    });

    it("Should prevent non-owner from updating configuration", async function () {
      const newConfig = {
        ...saleConfig,
        pricePerToken: ethers.parseUnits("2", STABLECOIN_DECIMALS)
      };

      await expect(tokenSale.connect(buyer1).updateSaleConfig(newConfig))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      // Make a purchase to have funds in the contract
      const tokenAmount = ethers.parseUnits("1000", PROPERTY_DECIMALS);
      const cost = await tokenSale.calculateCost(tokenAmount);

      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);
      await tokenSale.connect(buyer1).buyTokens(tokenAmount);
    });

    it("Should allow owner to withdraw collected stablecoins", async function () {
      const contractBalance = await mockStablecoin.balanceOf(await tokenSale.getAddress());
      const initialTreasuryBalance = await mockStablecoin.balanceOf(treasury.address);

      await expect(tokenSale.withdrawStablecoins(treasury.address))
        .to.emit(tokenSale, "StablecoinsWithdrawn")
        .withArgs(treasury.address, contractBalance);

      expect(await mockStablecoin.balanceOf(await tokenSale.getAddress())).to.equal(0);
      expect(await mockStablecoin.balanceOf(treasury.address)).to.equal(
        initialTreasuryBalance + contractBalance
      );
    });

    it("Should prevent non-owner from withdrawing", async function () {
      await expect(tokenSale.connect(buyer1).withdrawStablecoins(treasury.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow emergency withdrawal of any token", async function () {
      await expect(tokenSale.emergencyWithdraw(await mockStablecoin.getAddress(), treasury.address))
        .to.emit(tokenSale, "EmergencyWithdraw");
    });
  });

  describe("Utility Functions", function () {
    it("Should correctly calculate purchase cost", async function () {
      const tokenAmount = ethers.parseUnits("100", PROPERTY_DECIMALS);
      const expectedCost = tokenAmount * PRICE_PER_TOKEN / (10n ** BigInt(PROPERTY_DECIMALS));
      const calculatedCost = await tokenSale.calculateCost(tokenAmount);

      expect(calculatedCost).to.equal(expectedCost);
    });

    it("Should correctly check if user can participate", async function () {
      // Public phase - anyone can participate
      await tokenSale.setSalePhase(2);
      expect(await tokenSale.canParticipate(buyer1.address)).to.be.true;

      // Private phase - only whitelisted
      await tokenSale.setSalePhase(1);
      expect(await tokenSale.canParticipate(buyer1.address)).to.be.false;

      await tokenSale.setWhitelistStatus([buyer1.address], true);
      expect(await tokenSale.canParticipate(buyer1.address)).to.be.true;

      // Paused phase - no one can participate
      await tokenSale.setSalePhase(0);
      expect(await tokenSale.canParticipate(buyer1.address)).to.be.false;

      // Inactive sale - no one can participate
      await tokenSale.setSalePhase(2);
      const inactiveConfig = { ...saleConfig, isActive: false };
      await tokenSale.updateSaleConfig(inactiveConfig);
      expect(await tokenSale.canParticipate(buyer1.address)).to.be.false;
    });

    it("Should track purchase history correctly", async function () {
      const tokenAmount1 = ethers.parseUnits("100", PROPERTY_DECIMALS);
      const tokenAmount2 = ethers.parseUnits("200", PROPERTY_DECIMALS);
      
      const cost1 = await tokenSale.calculateCost(tokenAmount1);
      const cost2 = await tokenSale.calculateCost(tokenAmount2);

      // First purchase
      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost1);
      await tokenSale.connect(buyer1).buyTokens(tokenAmount1);

      expect(await tokenSale.getBuyerHistory(buyer1.address)).to.equal(tokenAmount1);

      // Second purchase
      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost2);
      await tokenSale.connect(buyer1).buyTokens(tokenAmount2);

      expect(await tokenSale.getBuyerHistory(buyer1.address)).to.equal(tokenAmount1 + tokenAmount2);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero token amount", async function () {
      await expect(tokenSale.connect(buyer1).buyTokens(0))
        .to.be.revertedWith("TokenSale: token amount must be positive");
    });

    it("Should handle sale deactivation", async function () {
      const inactiveConfig = { ...saleConfig, isActive: false };
      await tokenSale.updateSaleConfig(inactiveConfig);

      const tokenAmount = ethers.parseUnits("100", PROPERTY_DECIMALS);
      const cost = await tokenSale.calculateCost(tokenAmount);

      await mockStablecoin.connect(buyer1).approve(await tokenSale.getAddress(), cost);

      await expect(tokenSale.connect(buyer1).buyTokens(tokenAmount))
        .to.be.revertedWith("TokenSale: sale is not active");
    });
  });
});
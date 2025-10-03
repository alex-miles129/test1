const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IncomeDistributor Contract", function () {
  let mockStablecoin, realEstateToken, incomeDistributor;
  let owner, user1, user2, user3;
  let propertyInfo;

  const STABLECOIN_DECIMALS = 6;
  const PROPERTY_DECIMALS = 18;
  const PROPERTY_VALUE = ethers.parseUnits("500000", STABLECOIN_DECIMALS);
  const TOTAL_SUPPLY = ethers.parseUnits("500000", PROPERTY_DECIMALS);

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy MockStablecoin
    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    mockStablecoin = await MockStablecoin.deploy("Mock USDC", "mUSDC", owner.address);

    // Property info
    propertyInfo = {
      ipfsHash: "QmTestHash123",
      totalValue: PROPERTY_VALUE,
      totalSupply: TOTAL_SUPPLY,
      propertyAddress: "123 Test Street",
      description: "Test property for income distribution"
    };

    // Deploy RealEstateToken
    const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
    realEstateToken = await RealEstateToken.deploy(
      "Test Property",
      "TPT",
      owner.address,
      propertyInfo
    );

    // Deploy IncomeDistributor
    const IncomeDistributor = await ethers.getContractFactory("IncomeDistributor");
    incomeDistributor = await IncomeDistributor.deploy(
      await realEstateToken.getAddress(),
      await mockStablecoin.getAddress(),
      owner.address
    );

    // Authorize owner as minter and mint some tokens to users
    await realEstateToken.authorizeMinter(owner.address);
    await realEstateToken.mint(user1.address, ethers.parseUnits("1000", PROPERTY_DECIMALS)); // 1000 tokens
    await realEstateToken.mint(user2.address, ethers.parseUnits("500", PROPERTY_DECIMALS));  // 500 tokens
    await realEstateToken.mint(user3.address, ethers.parseUnits("300", PROPERTY_DECIMALS));  // 300 tokens
  });

  describe("Deployment", function () {
    it("Should set the correct initial parameters", async function () {
      expect(await incomeDistributor.propertyToken()).to.equal(await realEstateToken.getAddress());
      expect(await incomeDistributor.stablecoin()).to.equal(await mockStablecoin.getAddress());
      expect(await incomeDistributor.owner()).to.equal(owner.address);
      expect(await incomeDistributor.currentRound()).to.equal(0);
      expect(await incomeDistributor.claimPeriod()).to.equal(365 * 24 * 60 * 60); // 365 days
    });

    it("Should start with correct statistics", async function () {
      const stats = await incomeDistributor.getStats();
      expect(stats._currentRound).to.equal(0);
      expect(stats._totalDistributed).to.equal(0);
      expect(stats._totalClaimed).to.equal(0);
      expect(stats._unclaimedFunds).to.equal(0);
    });
  });

  describe("Income Distribution", function () {
    const distributionAmount = ethers.parseUnits("1000", STABLECOIN_DECIMALS); // 1000 mUSDC

    beforeEach(async function () {
      // Give distributor contract some stablecoins
      await mockStablecoin.mint(await incomeDistributor.getAddress(), distributionAmount);
    });

    it("Should create income distribution correctly", async function () {
      const totalSupplyBefore = await realEstateToken.totalSupply();

      await expect(incomeDistributor.distributeIncome(distributionAmount))
        .to.emit(incomeDistributor, "IncomeDistributed")
        .withArgs(1, distributionAmount, totalSupplyBefore, await getCurrentBlockTime() + 365 * 24 * 60 * 60);

      expect(await incomeDistributor.currentRound()).to.equal(1);

      const stats = await incomeDistributor.getStats();
      expect(stats._totalDistributed).to.equal(distributionAmount);
      expect(stats._unclaimedFunds).to.equal(distributionAmount);

      const roundInfo = await incomeDistributor.getRoundInfo(1);
      expect(roundInfo.totalAmount).to.equal(distributionAmount);
      expect(roundInfo.totalSupplySnapshot).to.equal(totalSupplyBefore);
    });

    it("Should prevent distribution with zero amount", async function () {
      await expect(incomeDistributor.distributeIncome(0))
        .to.be.revertedWith("IncomeDistributor: amount must be positive");
    });

    it("Should prevent distribution when no tokens in circulation", async function () {
      // Deploy new contracts with no tokens minted
      const newPropertyInfo = { ...propertyInfo };
      const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
      const newRealEstateToken = await RealEstateToken.deploy(
        "Empty Property",
        "EPT",
        owner.address,
        newPropertyInfo
      );

      const IncomeDistributor = await ethers.getContractFactory("IncomeDistributor");
      const newIncomeDistributor = await IncomeDistributor.deploy(
        await newRealEstateToken.getAddress(),
        await mockStablecoin.getAddress(),
        owner.address
      );

      await mockStablecoin.mint(await newIncomeDistributor.getAddress(), distributionAmount);

      await expect(newIncomeDistributor.distributeIncome(distributionAmount))
        .to.be.revertedWith("IncomeDistributor: no tokens in circulation");
    });

    it("Should prevent distribution without sufficient balance", async function () {
      const excessAmount = ethers.parseUnits("2000", STABLECOIN_DECIMALS);
      
      await expect(incomeDistributor.distributeIncome(excessAmount))
        .to.be.revertedWith("IncomeDistributor: insufficient stablecoin balance");
    });

    it("Should prevent non-owner from distributing income", async function () {
      await expect(incomeDistributor.connect(user1).distributeIncome(distributionAmount))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Snapshot Management", function () {
    const distributionAmount = ethers.parseUnits("1000", STABLECOIN_DECIMALS);

    beforeEach(async function () {
      await mockStablecoin.mint(await incomeDistributor.getAddress(), distributionAmount);
      await incomeDistributor.distributeIncome(distributionAmount);
    });

    it("Should take snapshots correctly", async function () {
      const users = [user1.address, user2.address, user3.address];
      
      await incomeDistributor.takeSnapshot(1, users);

      // Verify snapshots were taken by checking claimable amounts
      const user1Claimable = await incomeDistributor.calculateUserShare(1, user1.address);
      const user2Claimable = await incomeDistributor.calculateUserShare(1, user2.address);
      const user3Claimable = await incomeDistributor.calculateUserShare(1, user3.address);

      expect(user1Claimable).to.be.gt(0);
      expect(user2Claimable).to.be.gt(0);
      expect(user3Claimable).to.be.gt(0);

      // User1 should get the largest share (1000 tokens out of 1800 total)
      expect(user1Claimable).to.be.gt(user2Claimable);
      expect(user2Claimable).to.be.gt(user3Claimable);
    });

    it("Should prevent non-owner from taking snapshots", async function () {
      await expect(incomeDistributor.connect(user1).takeSnapshot(1, [user1.address]))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent snapshots for invalid rounds", async function () {
      await expect(incomeDistributor.takeSnapshot(0, [user1.address]))
        .to.be.revertedWith("IncomeDistributor: invalid round");

      await expect(incomeDistributor.takeSnapshot(2, [user1.address]))
        .to.be.revertedWith("IncomeDistributor: invalid round");
    });
  });

  describe("Dividend Claims", function () {
    const distributionAmount = ethers.parseUnits("1800", STABLECOIN_DECIMALS); // 1800 mUSDC for easy calculation

    beforeEach(async function () {
      await mockStablecoin.mint(await incomeDistributor.getAddress(), distributionAmount);
      await incomeDistributor.distributeIncome(distributionAmount);
      await incomeDistributor.takeSnapshot(1, [user1.address, user2.address, user3.address]);
    });

    it("Should calculate user shares correctly", async function () {
      // Total tokens: 1800 (1000 + 500 + 300)
      // Distribution: 1800 mUSDC
      // User1: 1000/1800 * 1800 = 1000 mUSDC
      // User2: 500/1800 * 1800 = 500 mUSDC  
      // User3: 300/1800 * 1800 = 300 mUSDC

      const user1Share = await incomeDistributor.calculateUserShare(1, user1.address);
      const user2Share = await incomeDistributor.calculateUserShare(1, user2.address);
      const user3Share = await incomeDistributor.calculateUserShare(1, user3.address);

      expect(user1Share).to.equal(ethers.parseUnits("1000", STABLECOIN_DECIMALS));
      expect(user2Share).to.equal(ethers.parseUnits("500", STABLECOIN_DECIMALS));
      expect(user3Share).to.equal(ethers.parseUnits("300", STABLECOIN_DECIMALS));
    });

    it("Should allow users to claim dividends", async function () {
      const user1BalanceBefore = await mockStablecoin.balanceOf(user1.address);
      const expectedShare = ethers.parseUnits("1000", STABLECOIN_DECIMALS);

      await expect(incomeDistributor.connect(user1).claimDividend(1))
        .to.emit(incomeDistributor, "DividendClaimed")
        .withArgs(user1.address, 1, expectedShare);

      const user1BalanceAfter = await mockStablecoin.balanceOf(user1.address);
      expect(user1BalanceAfter - user1BalanceBefore).to.equal(expectedShare);

      // Check claim status
      const status = await incomeDistributor.getUserRoundStatus(1, user1.address);
      expect(status.claimed).to.be.true;
      expect(status.claimable).to.equal(0);
    });

    it("Should prevent double claiming", async function () {
      await incomeDistributor.connect(user1).claimDividend(1);

      await expect(incomeDistributor.connect(user1).claimDividend(1))
        .to.be.revertedWith("IncomeDistributor: already claimed");
    });

    it("Should prevent claiming without tokens at snapshot", async function () {
      // Create a user with no tokens
      const [newUser] = await ethers.getSigners();

      await expect(incomeDistributor.connect(newUser).claimDividend(1))
        .to.be.revertedWith("IncomeDistributor: no tokens at snapshot");
    });

    it("Should prevent claiming from invalid rounds", async function () {
      await expect(incomeDistributor.connect(user1).claimDividend(0))
        .to.be.revertedWith("IncomeDistributor: invalid round");

      await expect(incomeDistributor.connect(user1).claimDividend(2))
        .to.be.revertedWith("IncomeDistributor: invalid round");
    });

    it("Should allow claiming multiple dividends at once", async function () {
      // Create second distribution round
      const secondDistributionAmount = ethers.parseUnits("900", STABLECOIN_DECIMALS);
      await mockStablecoin.mint(await incomeDistributor.getAddress(), secondDistributionAmount);
      await incomeDistributor.distributeIncome(secondDistributionAmount);
      await incomeDistributor.takeSnapshot(2, [user1.address, user2.address, user3.address]);

      const user1BalanceBefore = await mockStablecoin.balanceOf(user1.address);

      await incomeDistributor.connect(user1).claimMultipleDividends([1, 2]);

      const user1BalanceAfter = await mockStablecoin.balanceOf(user1.address);
      
      // User1 should receive 1000 + 500 = 1500 mUSDC
      const expectedTotal = ethers.parseUnits("1500", STABLECOIN_DECIMALS);
      expect(user1BalanceAfter - user1BalanceBefore).to.equal(expectedTotal);
    });
  });

  describe("Claimable Amount Calculation", function () {
    const distributionAmount = ethers.parseUnits("1800", STABLECOIN_DECIMALS);

    beforeEach(async function () {
      await mockStablecoin.mint(await incomeDistributor.getAddress(), distributionAmount * 2n);
      
      // First round
      await incomeDistributor.distributeIncome(distributionAmount);
      await incomeDistributor.takeSnapshot(1, [user1.address, user2.address, user3.address]);
      
      // Second round
      await incomeDistributor.distributeIncome(distributionAmount);
      await incomeDistributor.takeSnapshot(2, [user1.address, user2.address, user3.address]);
    });

    it("Should calculate total claimable amount across rounds", async function () {
      const claimable = await incomeDistributor.getClaimableAmount(user1.address);
      
      // User1 should be able to claim 1000 mUSDC from each round = 2000 mUSDC total
      const expectedTotal = ethers.parseUnits("2000", STABLECOIN_DECIMALS);
      expect(claimable).to.equal(expectedTotal);
    });

    it("Should update claimable amount after claiming", async function () {
      // Claim from first round only
      await incomeDistributor.connect(user1).claimDividend(1);

      const claimable = await incomeDistributor.getClaimableAmount(user1.address);
      
      // Should only be able to claim from second round now
      const expectedRemaining = ethers.parseUnits("1000", STABLECOIN_DECIMALS);
      expect(claimable).to.equal(expectedRemaining);
    });
  });

  describe("Claim Period Management", function () {
    it("Should allow owner to update claim period", async function () {
      const newPeriod = 180 * 24 * 60 * 60; // 180 days

      await expect(incomeDistributor.setClaimPeriod(newPeriod))
        .to.emit(incomeDistributor, "ClaimPeriodUpdated")
        .withArgs(newPeriod);

      expect(await incomeDistributor.claimPeriod()).to.equal(newPeriod);
    });

    it("Should prevent setting invalid claim periods", async function () {
      await expect(incomeDistributor.setClaimPeriod(0))
        .to.be.revertedWith("IncomeDistributor: invalid period");

      const tooLong = 731 * 24 * 60 * 60; // More than 730 days
      await expect(incomeDistributor.setClaimPeriod(tooLong))
        .to.be.revertedWith("IncomeDistributor: period too long");
    });

    it("Should prevent non-owner from updating claim period", async function () {
      await expect(incomeDistributor.connect(user1).setClaimPeriod(180 * 24 * 60 * 60))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Fund Recovery", function () {
    const distributionAmount = ethers.parseUnits("1000", STABLECOIN_DECIMALS);

    beforeEach(async function () {
      await mockStablecoin.mint(await incomeDistributor.getAddress(), distributionAmount);
      await incomeDistributor.distributeIncome(distributionAmount);
      await incomeDistributor.takeSnapshot(1, [user1.address, user2.address]);
    });

    it("Should allow owner to perform emergency withdrawal", async function () {
      const contractBalance = await mockStablecoin.balanceOf(await incomeDistributor.getAddress());
      const ownerBalanceBefore = await mockStablecoin.balanceOf(owner.address);

      await expect(incomeDistributor.emergencyWithdraw())
        .to.emit(incomeDistributor, "UnclaimedFundsRecovered")
        .withArgs(contractBalance);

      const ownerBalanceAfter = await mockStablecoin.balanceOf(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(contractBalance);

      expect(await incomeDistributor.unclaimedFunds()).to.equal(0);
    });

    it("Should prevent non-owner from emergency withdrawal", async function () {
      await expect(incomeDistributor.connect(user1).emergencyWithdraw())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should handle emergency withdrawal when no funds", async function () {
      // First withdraw all funds
      await incomeDistributor.emergencyWithdraw();

      await expect(incomeDistributor.emergencyWithdraw())
        .to.be.revertedWith("IncomeDistributor: no funds to withdraw");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle distribution with single token holder", async function () {
      // Deploy new contracts and give tokens to only one user
      const newPropertyInfo = { ...propertyInfo };
      const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
      const newRealEstateToken = await RealEstateToken.deploy(
        "Single Owner Property",
        "SOP",
        owner.address,
        newPropertyInfo
      );

      const IncomeDistributor = await ethers.getContractFactory("IncomeDistributor");
      const newIncomeDistributor = await IncomeDistributor.deploy(
        await newRealEstateToken.getAddress(),
        await mockStablecoin.getAddress(),
        owner.address
      );

      await newRealEstateToken.authorizeMinter(owner.address);
      await newRealEstateToken.mint(user1.address, ethers.parseUnits("1000", PROPERTY_DECIMALS));

      const distributionAmount = ethers.parseUnits("1000", STABLECOIN_DECIMALS);
      await mockStablecoin.mint(await newIncomeDistributor.getAddress(), distributionAmount);
      await newIncomeDistributor.distributeIncome(distributionAmount);
      await newIncomeDistributor.takeSnapshot(1, [user1.address]);

      const userShare = await newIncomeDistributor.calculateUserShare(1, user1.address);
      expect(userShare).to.equal(distributionAmount); // Should get 100%
    });

    it("Should handle very small distribution amounts", async function () {
      const smallAmount = ethers.parseUnits("1", STABLECOIN_DECIMALS); // 1 mUSDC
      await mockStablecoin.mint(await incomeDistributor.getAddress(), smallAmount);
      await incomeDistributor.distributeIncome(smallAmount);
      await incomeDistributor.takeSnapshot(1, [user1.address, user2.address, user3.address]);

      // Even small amounts should be distributed proportionally
      const user1Share = await incomeDistributor.calculateUserShare(1, user1.address);
      const user2Share = await incomeDistributor.calculateUserShare(1, user2.address);
      const user3Share = await incomeDistributor.calculateUserShare(1, user3.address);

      expect(user1Share + user2Share + user3Share).to.be.lte(smallAmount);
      expect(user1Share).to.be.gt(user2Share); // User1 should get more than User2
    });
  });

  async function getCurrentBlockTime() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
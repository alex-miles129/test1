const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealEstateToken Contract", function () {
  let realEstateToken;
  let owner, minter, user1, user2;
  let propertyInfo;

  const TOKEN_NAME = "Sunset Villa Tokens";
  const TOKEN_SYMBOL = "SVT";
  const PROPERTY_VALUE = ethers.parseUnits("500000", 6); // $500,000
  const TOTAL_SUPPLY = ethers.parseUnits("500000", 18); // 500,000 tokens
  const PROPERTY_ADDRESS = "123 Sunset Boulevard, Los Angeles, CA 90210";
  const DESCRIPTION = "Luxury villa with ocean view";

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();

    propertyInfo = {
      ipfsHash: "QmTestPropertyHash123456789",
      totalValue: PROPERTY_VALUE,
      totalSupply: TOTAL_SUPPLY,
      propertyAddress: PROPERTY_ADDRESS,
      description: DESCRIPTION
    };

    const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
    realEstateToken = await RealEstateToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      owner.address,
      propertyInfo
    );
  });

  describe("Deployment", function () {
    it("Should set the correct token parameters", async function () {
      expect(await realEstateToken.name()).to.equal(TOKEN_NAME);
      expect(await realEstateToken.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await realEstateToken.owner()).to.equal(owner.address);
      expect(await realEstateToken.totalSupply()).to.equal(0); // No tokens minted yet
    });

    it("Should set the correct property information", async function () {
      const storedPropertyInfo = await realEstateToken.getPropertyInfo();
      expect(storedPropertyInfo.ipfsHash).to.equal(propertyInfo.ipfsHash);
      expect(storedPropertyInfo.totalValue).to.equal(propertyInfo.totalValue);
      expect(storedPropertyInfo.totalSupply).to.equal(propertyInfo.totalSupply);
      expect(storedPropertyInfo.propertyAddress).to.equal(propertyInfo.propertyAddress);
      expect(storedPropertyInfo.description).to.equal(propertyInfo.description);
    });

    it("Should automatically whitelist the owner", async function () {
      expect(await realEstateToken.whitelistedAddresses(owner.address)).to.be.true;
    });

    it("Should start with transfer restrictions disabled", async function () {
      expect(await realEstateToken.transferRestricted()).to.be.false;
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await realEstateToken.authorizeMinter(minter.address);
    });

    it("Should allow authorized minters to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);

      await expect(realEstateToken.connect(minter).mint(user1.address, mintAmount))
        .to.emit(realEstateToken, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, mintAmount);

      expect(await realEstateToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await realEstateToken.totalSupply()).to.equal(mintAmount);
    });

    it("Should prevent unauthorized addresses from minting", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);

      await expect(realEstateToken.connect(user1).mint(user1.address, mintAmount))
        .to.be.revertedWith("RealEstateToken: caller is not authorized minter");
    });

    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);

      await expect(realEstateToken.connect(owner).mint(user1.address, mintAmount))
        .to.emit(realEstateToken, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, mintAmount);
    });

    it("Should prevent minting beyond total supply", async function () {
      const excessAmount = TOTAL_SUPPLY + ethers.parseUnits("1", 18);

      await expect(realEstateToken.connect(minter).mint(user1.address, excessAmount))
        .to.be.revertedWith("RealEstateToken: minting would exceed total supply");
    });

    it("Should prevent minting to zero address", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);

      await expect(realEstateToken.connect(minter).mint(ethers.ZeroAddress, mintAmount))
        .to.be.revertedWith("RealEstateToken: mint to zero address");
    });

    it("Should prevent minting zero amount", async function () {
      await expect(realEstateToken.connect(minter).mint(user1.address, 0))
        .to.be.revertedWith("RealEstateToken: mint amount must be positive");
    });
  });

  describe("Minter Authorization", function () {
    it("Should allow owner to authorize minters", async function () {
      await expect(realEstateToken.authorizeMinter(minter.address))
        .to.emit(realEstateToken, "MinterAuthorized")
        .withArgs(minter.address);

      expect(await realEstateToken.authorizedMinters(minter.address)).to.be.true;
    });

    it("Should allow owner to revoke minter authorization", async function () {
      await realEstateToken.authorizeMinter(minter.address);
      
      await expect(realEstateToken.revokeMinter(minter.address))
        .to.emit(realEstateToken, "MinterRevoked")
        .withArgs(minter.address);

      expect(await realEstateToken.authorizedMinters(minter.address)).to.be.false;
    });

    it("Should prevent non-owner from authorizing minters", async function () {
      await expect(realEstateToken.connect(user1).authorizeMinter(minter.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent authorizing zero address as minter", async function () {
      await expect(realEstateToken.authorizeMinter(ethers.ZeroAddress))
        .to.be.revertedWith("RealEstateToken: zero address");
    });
  });

  describe("Property Information Management", function () {
    const newIpfsHash = "QmNewPropertyHash987654321";
    const newValue = ethers.parseUnits("600000", 6);
    const newAddress = "456 New Street, New City";
    const newDescription = "Updated property description";

    it("Should allow owner to update property information", async function () {
      await expect(realEstateToken.updatePropertyInfo(
        newIpfsHash,
        newValue,
        newAddress,
        newDescription
      ))
        .to.emit(realEstateToken, "PropertyInfoUpdated")
        .withArgs(newIpfsHash, newValue);

      const updatedInfo = await realEstateToken.getPropertyInfo();
      expect(updatedInfo.ipfsHash).to.equal(newIpfsHash);
      expect(updatedInfo.totalValue).to.equal(newValue);
      expect(updatedInfo.propertyAddress).to.equal(newAddress);
      expect(updatedInfo.description).to.equal(newDescription);
    });

    it("Should prevent non-owner from updating property information", async function () {
      await expect(realEstateToken.connect(user1).updatePropertyInfo(
        newIpfsHash,
        newValue,
        newAddress,
        newDescription
      )).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Transfer Restrictions", function () {
    beforeEach(async function () {
      await realEstateToken.authorizeMinter(minter.address);
      const mintAmount = ethers.parseUnits("1000", 18);
      await realEstateToken.connect(minter).mint(user1.address, mintAmount);
    });

    it("Should allow transfers when restrictions are disabled", async function () {
      const transferAmount = ethers.parseUnits("100", 18);

      await expect(realEstateToken.connect(user1).transfer(user2.address, transferAmount))
        .to.emit(realEstateToken, "Transfer")
        .withArgs(user1.address, user2.address, transferAmount);

      expect(await realEstateToken.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should enable transfer restrictions", async function () {
      await expect(realEstateToken.setTransferRestriction(true))
        .to.emit(realEstateToken, "TransferRestrictionUpdated")
        .withArgs(true);

      expect(await realEstateToken.transferRestricted()).to.be.true;
    });

    it("Should prevent transfers when restrictions are enabled and user not whitelisted", async function () {
      await realEstateToken.setTransferRestriction(true);
      const transferAmount = ethers.parseUnits("100", 18);

      await expect(realEstateToken.connect(user1).transfer(user2.address, transferAmount))
        .to.be.revertedWith("RealEstateToken: transfer not allowed");
    });

    it("Should allow transfers between whitelisted addresses when restrictions enabled", async function () {
      await realEstateToken.setTransferRestriction(true);
      await realEstateToken.setAddressWhitelist(user1.address, true);
      await realEstateToken.setAddressWhitelist(user2.address, true);

      const transferAmount = ethers.parseUnits("100", 18);

      await expect(realEstateToken.connect(user1).transfer(user2.address, transferAmount))
        .to.emit(realEstateToken, "Transfer")
        .withArgs(user1.address, user2.address, transferAmount);
    });

    it("Should allow transfers involving owner when restrictions enabled", async function () {
      await realEstateToken.setTransferRestriction(true);
      await realEstateToken.connect(minter).mint(owner.address, ethers.parseUnits("500", 18));

      const transferAmount = ethers.parseUnits("100", 18);

      // Owner to non-whitelisted user should work
      await expect(realEstateToken.connect(owner).transfer(user2.address, transferAmount))
        .to.emit(realEstateToken, "Transfer");

      // Non-whitelisted user to owner should work  
      await expect(realEstateToken.connect(user1).transfer(owner.address, transferAmount))
        .to.emit(realEstateToken, "Transfer");
    });

    it("Should manage whitelist correctly", async function () {
      await expect(realEstateToken.setAddressWhitelist(user1.address, true))
        .to.emit(realEstateToken, "AddressWhitelisted")
        .withArgs(user1.address, true);

      expect(await realEstateToken.whitelistedAddresses(user1.address)).to.be.true;

      await expect(realEstateToken.setAddressWhitelist(user1.address, false))
        .to.emit(realEstateToken, "AddressWhitelisted")
        .withArgs(user1.address, false);

      expect(await realEstateToken.whitelistedAddresses(user1.address)).to.be.false;
    });
  });

  describe("Ownership Calculations", function () {
    beforeEach(async function () {
      await realEstateToken.authorizeMinter(minter.address);
    });

    it("Should calculate ownership percentage correctly", async function () {
      const totalTokens = ethers.parseUnits("1000", 18);
      const userTokens = ethers.parseUnits("250", 18); // 25%

      await realEstateToken.connect(minter).mint(user1.address, userTokens);
      await realEstateToken.connect(minter).mint(user2.address, totalTokens - userTokens);

      const ownership = await realEstateToken.getOwnershipPercentage(user1.address);
      const expectedOwnership = ethers.parseUnits("0.25", 18); // 25% = 0.25
      expect(ownership).to.equal(expectedOwnership);
    });

    it("Should calculate owned value correctly", async function () {
      const totalTokens = ethers.parseUnits("1000", 18);
      const userTokens = ethers.parseUnits("100", 18); // 10%

      await realEstateToken.connect(minter).mint(user1.address, userTokens);

      const ownedValue = await realEstateToken.getOwnedValue(user1.address);
      const expectedValue = PROPERTY_VALUE / 10n; // 10% of total value
      expect(ownedValue).to.equal(expectedValue);
    });

    it("Should return zero for ownership calculations when no tokens", async function () {
      const ownership = await realEstateToken.getOwnershipPercentage(user1.address);
      const ownedValue = await realEstateToken.getOwnedValue(user1.address);

      expect(ownership).to.equal(0);
      expect(ownedValue).to.equal(0);
    });

    it("Should return zero for ownership calculations when total supply is zero", async function () {
      // No tokens minted yet
      const ownership = await realEstateToken.getOwnershipPercentage(user1.address);
      const ownedValue = await realEstateToken.getOwnedValue(user1.address);

      expect(ownership).to.equal(0);
      expect(ownedValue).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should prevent non-owner from setting transfer restrictions", async function () {
      await expect(realEstateToken.connect(user1).setTransferRestriction(true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent non-owner from managing whitelist", async function () {
      await expect(realEstateToken.connect(user1).setAddressWhitelist(user2.address, true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent non-owner from revoking minters", async function () {
      await expect(realEstateToken.connect(user1).revokeMinter(minter.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple mints up to total supply", async function () {
      await realEstateToken.authorizeMinter(minter.address);
      
      const halfSupply = TOTAL_SUPPLY / 2n;
      
      await realEstateToken.connect(minter).mint(user1.address, halfSupply);
      await realEstateToken.connect(minter).mint(user2.address, halfSupply);

      expect(await realEstateToken.totalSupply()).to.equal(TOTAL_SUPPLY);
      expect(await realEstateToken.balanceOf(user1.address)).to.equal(halfSupply);
      expect(await realEstateToken.balanceOf(user2.address)).to.equal(halfSupply);
    });

    it("Should handle ownership calculations with very small amounts", async function () {
      await realEstateToken.authorizeMinter(minter.address);
      
      const smallAmount = ethers.parseUnits("1", 18); // 1 token
      const largeAmount = ethers.parseUnits("999", 18); // 999 tokens

      await realEstateToken.connect(minter).mint(user1.address, smallAmount);
      await realEstateToken.connect(minter).mint(user2.address, largeAmount);

      const ownership = await realEstateToken.getOwnershipPercentage(user1.address);
      const expectedOwnership = ethers.parseUnits("0.001", 18); // 0.1%
      expect(ownership).to.equal(expectedOwnership);
    });

    it("Should handle minting exact total supply", async function () {
      await realEstateToken.authorizeMinter(minter.address);
      
      await realEstateToken.connect(minter).mint(user1.address, TOTAL_SUPPLY);

      expect(await realEstateToken.totalSupply()).to.equal(TOTAL_SUPPLY);
      expect(await realEstateToken.balanceOf(user1.address)).to.equal(TOTAL_SUPPLY);

      const ownership = await realEstateToken.getOwnershipPercentage(user1.address);
      const expectedOwnership = ethers.parseUnits("1", 18); // 100%
      expect(ownership).to.equal(expectedOwnership);
    });
  });
});
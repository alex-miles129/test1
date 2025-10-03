const { ethers } = require("hardhat");

// Contract addresses - Update these after deployment
const CONTRACT_ADDRESSES = {
  MockStablecoin: "0x...", // Update with deployed address
  RealEstateToken: "0x...", // Update with deployed address  
  TokenSale: "0x...", // Update with deployed address
  IncomeDistributor: "0x..." // Update with deployed address
};

async function main() {
  console.log("🔄 Starting contract interaction script...\n");

  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`User1: ${user1.address}`);
  console.log(`User2: ${user2.address}\n`);

  // Get contract instances
  const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
  const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
  const TokenSale = await ethers.getContractFactory("TokenSale");
  const IncomeDistributor = await ethers.getContractFactory("IncomeDistributor");

  // Auto-detect deployed contracts if addresses not provided
  let stablecoin, propertyToken, tokenSale, incomeDistributor;

  try {
    // Check if we have contract addresses
    if (CONTRACT_ADDRESSES.MockStablecoin !== "0x...") {
      console.log("📍 Using provided contract addresses...");
      stablecoin = MockStablecoin.attach(CONTRACT_ADDRESSES.MockStablecoin);
      propertyToken = RealEstateToken.attach(CONTRACT_ADDRESSES.RealEstateToken);
      tokenSale = TokenSale.attach(CONTRACT_ADDRESSES.TokenSale);
      incomeDistributor = IncomeDistributor.attach(CONTRACT_ADDRESSES.IncomeDistributor);
    } else {
      console.log("🚀 No addresses provided, deploying fresh contracts...");
      const { main: deploy } = require('./deploy.js');
      const deploymentInfo = await deploy();
      
      stablecoin = MockStablecoin.attach(deploymentInfo.contracts.MockStablecoin);
      propertyToken = RealEstateToken.attach(deploymentInfo.contracts.RealEstateToken);
      tokenSale = TokenSale.attach(deploymentInfo.contracts.TokenSale);
      incomeDistributor = IncomeDistributor.attach(deploymentInfo.contracts.IncomeDistributor);
    }

    console.log("✅ Contract instances ready!\n");

    // Test scenarios
    await testFaucetFunction(stablecoin, user1, user2);
    await testTokenPurchase(stablecoin, tokenSale, propertyToken, user1);
    await testIncomeDistribution(stablecoin, incomeDistributor, propertyToken, deployer, user1, user2);
    await displayFinalBalances(stablecoin, propertyToken, deployer, user1, user2);

  } catch (error) {
    console.error("❌ Error in interaction script:");
    console.error(error);
    process.exit(1);
  }
}

async function testFaucetFunction(stablecoin, user1, user2) {
  console.log("🚰 Testing Faucet Function...");
  
  try {
    // User1 uses faucet
    console.log("   - User1 claiming from faucet...");
    await stablecoin.connect(user1).faucet();
    const user1Balance = await stablecoin.balanceOf(user1.address);
    console.log(`   - User1 mUSDC balance: ${ethers.formatUnits(user1Balance, 6)}`);

    // User2 uses faucet
    console.log("   - User2 claiming from faucet...");
    await stablecoin.connect(user2).faucet();
    const user2Balance = await stablecoin.balanceOf(user2.address);
    console.log(`   - User2 mUSDC balance: ${ethers.formatUnits(user2Balance, 6)}\n`);

  } catch (error) {
    console.error("   ❌ Faucet test failed:", error.message);
  }
}

async function testTokenPurchase(stablecoin, tokenSale, propertyToken, user) {
  console.log("💰 Testing Token Purchase Flow...");

  try {
    const tokenAmount = ethers.parseUnits("100", 18); // Buy 100 tokens
    const cost = await tokenSale.calculateCost(tokenAmount);
    
    console.log(`   - Attempting to buy ${ethers.formatUnits(tokenAmount, 18)} tokens`);
    console.log(`   - Cost: ${ethers.formatUnits(cost, 6)} mUSDC`);

    // Check user's stablecoin balance
    const userBalance = await stablecoin.balanceOf(user.address);
    console.log(`   - User stablecoin balance: ${ethers.formatUnits(userBalance, 6)} mUSDC`);

    if (userBalance < cost) {
      console.log("   - Insufficient balance, minting more...");
      await stablecoin.mint(user.address, cost);
    }

    // Step 1: Approve stablecoin spending
    console.log("   - Step 1: Approving stablecoin allowance...");
    await stablecoin.connect(user).approve(await tokenSale.getAddress(), cost);
    console.log("   ✅ Approval successful");

    // Check allowance
    const allowance = await stablecoin.allowance(user.address, await tokenSale.getAddress());
    console.log(`   - Approved allowance: ${ethers.formatUnits(allowance, 6)} mUSDC`);

    // Step 2: Buy tokens
    console.log("   - Step 2: Buying property tokens...");
    const tx = await tokenSale.connect(user).buyTokens(tokenAmount);
    const receipt = await tx.wait();
    console.log(`   ✅ Purchase successful! Tx hash: ${receipt.hash}`);

    // Check token balance
    const tokenBalance = await propertyToken.balanceOf(user.address);
    console.log(`   - User property token balance: ${ethers.formatUnits(tokenBalance, 18)}`);

    // Check ownership percentage
    const ownership = await propertyToken.getOwnershipPercentage(user.address);
    console.log(`   - Ownership percentage: ${ethers.formatUnits(ownership, 16)}%\n`);

  } catch (error) {
    console.error("   ❌ Token purchase test failed:", error.message);
  }
}

async function testIncomeDistribution(stablecoin, incomeDistributor, propertyToken, deployer, user1, user2) {
  console.log("📊 Testing Income Distribution...");

  try {
    // First, make sure users have some property tokens
    const user1Tokens = await propertyToken.balanceOf(user1.address);
    const user2Tokens = await propertyToken.balanceOf(user2.address);
    
    console.log(`   - User1 property tokens: ${ethers.formatUnits(user1Tokens, 18)}`);
    console.log(`   - User2 property tokens: ${ethers.formatUnits(user2Tokens, 18)}`);

    if (user1Tokens == 0n && user2Tokens == 0n) {
      console.log("   - No users have property tokens, skipping distribution test\n");
      return;
    }

    // Prepare distribution amount
    const distributionAmount = ethers.parseUnits("1000", 6); // 1000 mUSDC rental income
    console.log(`   - Distributing ${ethers.formatUnits(distributionAmount, 6)} mUSDC as rental income`);

    // Transfer stablecoins to income distributor
    await stablecoin.connect(deployer).transfer(await incomeDistributor.getAddress(), distributionAmount);

    // Create distribution
    console.log("   - Creating income distribution...");
    await incomeDistributor.connect(deployer).distributeIncome(distributionAmount);

    // Take snapshots for users with tokens
    const usersWithTokens = [];
    if (user1Tokens > 0n) usersWithTokens.push(user1.address);
    if (user2Tokens > 0n) usersWithTokens.push(user2.address);

    if (usersWithTokens.length > 0) {
      console.log("   - Taking balance snapshots...");
      await incomeDistributor.connect(deployer).takeSnapshot(1, usersWithTokens);

      // Check claimable amounts
      for (const userAddr of usersWithTokens) {
        const claimable = await incomeDistributor.calculateUserShare(1, userAddr);
        console.log(`   - ${userAddr} can claim: ${ethers.formatUnits(claimable, 6)} mUSDC`);
      }

      // Claim dividends
      if (user1Tokens > 0n) {
        console.log("   - User1 claiming dividend...");
        await incomeDistributor.connect(user1).claimDividend(1);
        console.log("   ✅ User1 dividend claimed");
      }

      if (user2Tokens > 0n) {
        console.log("   - User2 claiming dividend...");
        await incomeDistributor.connect(user2).claimDividend(1);
        console.log("   ✅ User2 dividend claimed");
      }
    }

    console.log("   ✅ Income distribution test complete\n");

  } catch (error) {
    console.error("   ❌ Income distribution test failed:", error.message);
  }
}

async function displayFinalBalances(stablecoin, propertyToken, deployer, user1, user2) {
  console.log("💼 Final Account Balances:");
  console.log("=" .repeat(60));

  const accounts = [
    { name: "Deployer", address: deployer.address, signer: deployer },
    { name: "User1", address: user1.address, signer: user1 },
    { name: "User2", address: user2.address, signer: user2 }
  ];

  for (const account of accounts) {
    const stablecoinBalance = await stablecoin.balanceOf(account.address);
    const propertyTokenBalance = await propertyToken.balanceOf(account.address);
    const ownership = await propertyToken.getOwnershipPercentage(account.address);
    
    console.log(`${account.name} (${account.address}):`);
    console.log(`  mUSDC Balance:        ${ethers.formatUnits(stablecoinBalance, 6)}`);
    console.log(`  Property Tokens:      ${ethers.formatUnits(propertyTokenBalance, 18)}`);
    console.log(`  Ownership %:          ${ethers.formatUnits(ownership, 16)}%`);
    console.log("");
  }

  // Contract stats
  console.log("📈 Contract Statistics:");
  const totalSupply = await propertyToken.totalSupply();
  console.log(`Total Property Tokens:  ${ethers.formatUnits(totalSupply, 18)}`);
  
  try {
    // Try to get sale stats from deployed contracts
    console.log("Note: Sale statistics available after using TokenSale contract");
  } catch (error) {
    console.log("Sale statistics: Not available (expected for fresh deployments)");
  }
  console.log("=" .repeat(60));
}

// Utility function to add tokens to MetaMask
function getMetaMaskTokenData(addresses) {
  console.log("\n🦊 MetaMask Token Configuration:");
  console.log("Copy these details to add tokens to MetaMask:");
  console.log("");
  
  console.log("MockStablecoin (mUSDC):");
  console.log(`  Address:     ${addresses.MockStablecoin}`);
  console.log("  Symbol:      mUSDC");
  console.log("  Decimals:    6");
  console.log("");
  
  console.log("Property Token:");
  console.log(`  Address:     ${addresses.RealEstateToken}`);
  console.log("  Symbol:      SVT");
  console.log("  Decimals:    18");
  console.log("");
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main, getMetaMaskTokenData };
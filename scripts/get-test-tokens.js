const { ethers } = require("hardhat");

/**
 * Script to easily get test mUSDC tokens from faucet
 * Usage: npx hardhat run scripts/get-test-tokens.js --network localhost
 */

async function main() {
  console.log("💰 Getting test mUSDC tokens via faucet...\n");

  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  
  // Use the latest deployed address (from recent deployment output)
  const stablecoinAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  
  console.log("📍 Using MockStablecoin address:", stablecoinAddress);
  console.log("⚠️  Note: If this doesn't work, redeploy contracts with: npm run deploy:local\n");

  try {
    // Connect to MockStablecoin contract
    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    const stablecoin = MockStablecoin.attach(stablecoinAddress);

    console.log(`📍 MockStablecoin contract: ${stablecoinAddress}\n`);

    // Check current balances
    console.log("📊 Current balances:");
    const deployerBalance = await stablecoin.balanceOf(deployer.address);
    const user1Balance = await stablecoin.balanceOf(user1.address);
    const user2Balance = await stablecoin.balanceOf(user2.address);

    console.log(`   Deployer: ${ethers.formatUnits(deployerBalance, 6)} mUSDC`);
    console.log(`   User1:    ${ethers.formatUnits(user1Balance, 6)} mUSDC`);
    console.log(`   User2:    ${ethers.formatUnits(user2Balance, 6)} mUSDC\n`);

    // Claim from faucet for each user if they have low balance
    const accounts = [
      { name: "Deployer", signer: deployer },
      { name: "User1", signer: user1 },
      { name: "User2", signer: user2 }
    ];

    for (const account of accounts) {
      const balance = await stablecoin.balanceOf(account.signer.address);
      const balanceFormatted = parseFloat(ethers.formatUnits(balance, 6));

      if (balanceFormatted < 100) { // If less than 100 mUSDC
        try {
          console.log(`🚰 Getting tokens for ${account.name}...`);
          const tx = await stablecoin.connect(account.signer).faucet();
          await tx.wait();
          
          const newBalance = await stablecoin.balanceOf(account.signer.address);
          console.log(`   ✅ Success! New balance: ${ethers.formatUnits(newBalance, 6)} mUSDC`);
        } catch (error) {
          if (error.message.includes("already claimed")) {
            console.log(`   ⏰ ${account.name} has already claimed (cooldown period active)`);
          } else {
            console.log(`   ❌ Failed for ${account.name}: ${error.message}`);
          }
        }
      } else {
        console.log(`   ✅ ${account.name} already has sufficient balance (${balanceFormatted} mUSDC)`);
      }
    }

    console.log("\n📊 Final balances:");
    for (const account of accounts) {
      const finalBalance = await stablecoin.balanceOf(account.signer.address);
      console.log(`   ${account.name}: ${ethers.formatUnits(finalBalance, 6)} mUSDC`);
    }

    console.log("\n🦊 To add mUSDC to MetaMask:");
    console.log(`   Token Address: ${stablecoinAddress}`);
    console.log(`   Symbol: mUSDC`);
    console.log(`   Decimals: 6`);

    console.log("\n🎉 Test tokens ready! You can now:");
    console.log("   1. Connect MetaMask to Hardhat Local network");
    console.log("   2. Import the test account or add the token");
    console.log("   3. Visit http://localhost:3000 to use TokenEstateX");

  } catch (error) {
    console.error("❌ Error getting test tokens:");
    
    if (error.message.includes("could not decode result data")) {
      console.log("Contract not found at the specified address.");
      console.log("Make sure contracts are deployed with: npm run deploy:local");
    } else if (error.message.includes("network does not support ENS")) {
      console.log("Make sure the local Hardhat network is running: npm run node");
    } else {
      console.error(error.message);
    }
  }
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

module.exports = { main };
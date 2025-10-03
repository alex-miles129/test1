const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting RealToken deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // Contract deployment parameters
  const STABLECOIN_NAME = "Mock USDC";
  const STABLECOIN_SYMBOL = "mUSDC";
  const PROPERTY_NAME = "Sunset Villa Tokens";
  const PROPERTY_SYMBOL = "SVT";
  const PROPERTY_VALUE = ethers.parseUnits("500000", 6); // $500,000 (6 decimals)
  const TOTAL_SUPPLY = ethers.parseUnits("500000", 18); // 500,000 tokens (18 decimals)
  const PRICE_PER_TOKEN = ethers.parseUnits("1", 6); // 1 mUSDC per token

  // Sample property info
  const propertyInfo = {
    ipfsHash: "QmSampleHashForPropertyDocuments123456789",
    totalValue: PROPERTY_VALUE,
    totalSupply: TOTAL_SUPPLY,
    propertyAddress: "123 Sunset Boulevard, Los Angeles, CA 90210",
    description: "Luxury 4-bedroom villa with ocean view, swimming pool, and modern amenities. Prime investment property in prestigious neighborhood."
  };

  // Sale configuration
  const saleConfig = {
    pricePerToken: PRICE_PER_TOKEN,
    minPurchase: ethers.parseUnits("10", 18), // Minimum 10 tokens
    maxPurchase: ethers.parseUnits("10000", 18), // Maximum 10,000 tokens per purchase
    maxTotalSupply: TOTAL_SUPPLY,
    isActive: true
  };

  try {
    // 1. Deploy MockStablecoin
    console.log("📄 1. Deploying MockStablecoin...");
    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    const stablecoin = await MockStablecoin.deploy(
      STABLECOIN_NAME,
      STABLECOIN_SYMBOL,
      deployer.address
    );
    await stablecoin.waitForDeployment();
    const stablecoinAddress = await stablecoin.getAddress();
    console.log(`✅ MockStablecoin deployed to: ${stablecoinAddress}\n`);

    // 2. Deploy RealEstateToken
    console.log("🏠 2. Deploying RealEstateToken...");
    const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
    const propertyToken = await RealEstateToken.deploy(
      PROPERTY_NAME,
      PROPERTY_SYMBOL,
      deployer.address,
      propertyInfo
    );
    await propertyToken.waitForDeployment();
    const propertyTokenAddress = await propertyToken.getAddress();
    console.log(`✅ RealEstateToken deployed to: ${propertyTokenAddress}\n`);

    // 3. Deploy TokenSale
    console.log("💰 3. Deploying TokenSale...");
    const TokenSale = await ethers.getContractFactory("TokenSale");
    const tokenSale = await TokenSale.deploy(
      propertyTokenAddress,
      stablecoinAddress,
      deployer.address,
      saleConfig
    );
    await tokenSale.waitForDeployment();
    const tokenSaleAddress = await tokenSale.getAddress();
    console.log(`✅ TokenSale deployed to: ${tokenSaleAddress}\n`);

    // 4. Deploy IncomeDistributor
    console.log("📊 4. Deploying IncomeDistributor...");
    const IncomeDistributor = await ethers.getContractFactory("IncomeDistributor");
    const incomeDistributor = await IncomeDistributor.deploy(
      propertyTokenAddress,
      stablecoinAddress,
      deployer.address
    );
    await incomeDistributor.waitForDeployment();
    const incomeDistributorAddress = await incomeDistributor.getAddress();
    console.log(`✅ IncomeDistributor deployed to: ${incomeDistributorAddress}\n`);

    // 5. Configure contracts
    console.log("⚙️  5. Configuring contracts...");
    
    // Authorize TokenSale to mint property tokens
    console.log("   - Authorizing TokenSale as minter...");
    await propertyToken.authorizeMinter(tokenSaleAddress);
    
    // Set TokenSale phase to Public
    console.log("   - Setting sale phase to Public...");
    await tokenSale.setSalePhase(2); // 2 = Public phase
    
    console.log("✅ Contract configuration complete!\n");

    // 6. Initial setup for demo
    console.log("🎯 6. Setting up demo data...");
    
    // Mint some stablecoins to deployer for testing
    const demoAmount = ethers.parseUnits("100000", 6); // 100,000 mUSDC
    await stablecoin.mint(deployer.address, demoAmount);
    console.log(`   - Minted ${ethers.formatUnits(demoAmount, 6)} mUSDC to deployer`);

    // Check final balances
    const stablecoinBalance = await stablecoin.balanceOf(deployer.address);
    const propertyTokenBalance = await propertyToken.balanceOf(deployer.address);
    
    console.log(`   - Deployer mUSDC balance: ${ethers.formatUnits(stablecoinBalance, 6)}`);
    console.log(`   - Deployer property token balance: ${ethers.formatUnits(propertyTokenBalance, 18)}\n`);

    // 7. Display deployment summary
    console.log("🎉 DEPLOYMENT COMPLETE!\n");
    console.log("📋 CONTRACT ADDRESSES:");
    console.log("=" .repeat(50));
    console.log(`MockStablecoin:      ${stablecoinAddress}`);
    console.log(`RealEstateToken:     ${propertyTokenAddress}`);
    console.log(`TokenSale:           ${tokenSaleAddress}`);
    console.log(`IncomeDistributor:   ${incomeDistributorAddress}`);
    console.log("=" .repeat(50));

    console.log("\n📊 PROPERTY INFO:");
    console.log("=" .repeat(50));
    console.log(`Name:                ${PROPERTY_NAME} (${PROPERTY_SYMBOL})`);
    console.log(`Total Value:         $${ethers.formatUnits(PROPERTY_VALUE, 6)}`);
    console.log(`Total Supply:        ${ethers.formatUnits(TOTAL_SUPPLY, 18)} tokens`);
    console.log(`Price per Token:     ${ethers.formatUnits(PRICE_PER_TOKEN, 6)} mUSDC`);
    console.log(`Property Address:    ${propertyInfo.propertyAddress}`);
    console.log("=" .repeat(50));

    console.log("\n🔗 NEXT STEPS:");
    console.log("1. Add these addresses to your .env file for frontend");
    console.log("2. Update contract addresses in frontend/utils/constants.ts");
    console.log("3. Add tokens to MetaMask using the contract addresses");
    console.log("4. Use the faucet function to get test mUSDC");
    console.log("5. Test the buy flow: approve → buyTokens");

    // Save deployment info to file
    const deploymentInfo = {
      network: (await ethers.provider.getNetwork()).name,
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        MockStablecoin: stablecoinAddress,
        RealEstateToken: propertyTokenAddress,
        TokenSale: tokenSaleAddress,
        IncomeDistributor: incomeDistributorAddress
      },
      propertyInfo,
      saleConfig: {
        ...saleConfig,
        pricePerToken: PRICE_PER_TOKEN.toString(),
        minPurchase: saleConfig.minPurchase.toString(),
        maxPurchase: saleConfig.maxPurchase.toString(),
        maxTotalSupply: saleConfig.maxTotalSupply.toString()
      }
    };

    // Write deployment info to file (if running locally)
    if (process.env.NODE_ENV !== 'production') {
      const fs = require('fs');
      const path = require('path');
      
      try {
        const deploymentsDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentsDir)) {
          fs.mkdirSync(deploymentsDir);
        }
        
        const filename = `deployment-${Date.now()}.json`;
        fs.writeFileSync(
          path.join(deploymentsDir, filename),
          JSON.stringify(deploymentInfo, null, 2)
        );
        console.log(`\n💾 Deployment info saved to: deployments/${filename}`);
      } catch (error) {
        console.log(`⚠️  Could not save deployment info: ${error.message}`);
      }
    }

    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
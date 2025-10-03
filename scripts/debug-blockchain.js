const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging blockchain connection...\n");
  
  try {
    // Get accounts
    const [deployer, user1, user2] = await ethers.getSigners();
    
    console.log("📋 Account Information:");
    console.log(`Deployer: ${deployer.address}`);
    console.log(`User1:    ${user1.address}`);
    console.log(`User2:    ${user2.address}\n`);
    
    // Check ETH balances
    console.log("💰 ETH Balances:");
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    const user1Balance = await ethers.provider.getBalance(user1.address);
    const user2Balance = await ethers.provider.getBalance(user2.address);
    
    console.log(`Deployer: ${ethers.formatEther(deployerBalance)} ETH`);
    console.log(`User1:    ${ethers.formatEther(user1Balance)} ETH`);
    console.log(`User2:    ${ethers.formatEther(user2Balance)} ETH\n`);
    
    // Check network
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network Information:");
    console.log(`Chain ID: ${network.chainId}`);
    console.log(`Network Name: ${network.name}\n`);
    
    // Check if contracts exist
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const code = await ethers.provider.getCode(contractAddress);
    console.log("📜 Contract Check:");
    console.log(`MockStablecoin Address: ${contractAddress}`);
    console.log(`Contract exists: ${code !== "0x" ? "✅ YES" : "❌ NO"}\n`);
    
    if (code !== "0x") {
      // Try to connect to contract
      const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
      const stablecoin = MockStablecoin.attach(contractAddress);
      
      const deployerStablecoinBalance = await stablecoin.balanceOf(deployer.address);
      console.log("💵 mUSDC Balances:");
      console.log(`Deployer: ${ethers.formatUnits(deployerStablecoinBalance, 6)} mUSDC`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);
const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Testing SolarToken balanceOf function...");
    
    // Get the deployed contract address from latest deployment
    const deploymentInfo = require('./deployments/latest.json');
    console.log("📋 Contract addresses:", deploymentInfo.contracts);
    
    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deployer address:", deployer.address);
    
    // Get the SolarToken contract
    const SolarToken = await ethers.getContractFactory("SolarToken");
    const solarToken = SolarToken.attach(deploymentInfo.contracts.SolarToken);
    
    try {
        // Test balanceOf function
        const balance = await solarToken.balanceOf(deployer.address);
        console.log("✅ Balance of deployer:", ethers.formatEther(balance), "ST");
        
        // Test total supply
        const totalSupply = await solarToken.totalSupply();
        console.log("✅ Total supply:", ethers.formatEther(totalSupply), "ST");
        
        // Test name and symbol
        const name = await solarToken.name();
        const symbol = await solarToken.symbol();
        console.log("✅ Token name:", name);
        console.log("✅ Token symbol:", symbol);
        
        console.log("🎉 All contract functions working correctly!");
        
    } catch (error) {
        console.error("❌ Error testing contract:", error.message);
        console.error("Stack:", error.stack);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

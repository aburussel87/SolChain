const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting SolChain Smart Contract Deployment...\n");

    // Get signers
    const [deployer, ...otherSigners] = await ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);
    console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

    // Deployment parameters
    const INITIAL_SUPPLY = ethers.parseEther(process.env.INITIAL_SUPPLY || "1000000"); // 1M ST
    const TRADING_FEE_PERCENTAGE = process.env.TRADING_FEE_PERCENTAGE || "25"; // 0.25%
    const MINIMUM_TRADE_AMOUNT = ethers.parseEther("0.1"); // 0.1 kWh
    const MAXIMUM_TRADE_AMOUNT = ethers.parseEther("100000"); // 100,000 kWh
    const MINIMUM_STAKE = ethers.parseEther("1000"); // 1000 ST minimum stake
    const TIMELOCK_DELAY = 2 * 24 * 60 * 60; // 2 days

    const deployedContracts = {};

    try {
        // 1. Deploy SolarToken
        console.log("📄 Deploying SolarToken...");
        const SolarToken = await ethers.getContractFactory("SolarToken");
        const solarToken = await SolarToken.deploy(
            INITIAL_SUPPLY,
            deployer.address // Fee collector
        );
        await solarToken.waitForDeployment();
        deployedContracts.SolarToken = await solarToken.getAddress();
        console.log(`✅ SolarToken deployed to: ${deployedContracts.SolarToken}\n`);

        // 2. Deploy SolChainTimelock
        console.log("⏰ Deploying SolChainTimelock...");
        const SolChainTimelock = await ethers.getContractFactory("SolChainTimelock");
        const timelock = await SolChainTimelock.deploy(
            TIMELOCK_DELAY,
            [], // proposers (will be set to governance)
            [], // executors (will be set to governance)
            deployer.address // initial admin
        );
        await timelock.waitForDeployment();
        deployedContracts.SolChainTimelock = await timelock.getAddress();
        console.log(`✅ SolChainTimelock deployed to: ${deployedContracts.SolChainTimelock}\n`);

        // 3. Deploy SolChainGovernance
        console.log("🏛️ Deploying SolChainGovernance...");
        const SolChainGovernance = await ethers.getContractFactory("SolChainGovernance");
        const governance = await SolChainGovernance.deploy(
            await solarToken.getAddress(),
            await timelock.getAddress()
        );
        await governance.waitForDeployment();
        deployedContracts.SolChainGovernance = await governance.getAddress();
        console.log(`✅ SolChainGovernance deployed to: ${deployedContracts.SolChainGovernance}\n`);

        // 4. Deploy SolChainStaking
        console.log("🔒 Deploying SolChainStaking...");
        const SolChainStaking = await ethers.getContractFactory("SolChainStaking");
        const staking = await SolChainStaking.deploy(
            await solarToken.getAddress()
        );
        await staking.waitForDeployment();
        deployedContracts.SolChainStaking = await staking.getAddress();
        console.log(`✅ SolChainStaking deployed to: ${deployedContracts.SolChainStaking}\n`);

        // 5. Deploy SolChainOracle
        console.log("🔮 Deploying SolChainOracle...");
        const SolChainOracle = await ethers.getContractFactory("SolChainOracle");
        const oracle = await SolChainOracle.deploy();
        await oracle.waitForDeployment();
        deployedContracts.SolChainOracle = await oracle.getAddress();
        console.log(`✅ SolChainOracle deployed to: ${deployedContracts.SolChainOracle}\n`);

        // 6. Deploy EnergyTrading
        console.log("⚡ Deploying EnergyTrading...");
        const EnergyTrading = await ethers.getContractFactory("EnergyTrading");
        const energyTrading = await EnergyTrading.deploy(
            await solarToken.getAddress(),
            deployer.address // Fee collector
        );
        await energyTrading.waitForDeployment();
        deployedContracts.EnergyTrading = await energyTrading.getAddress();
        console.log(`✅ EnergyTrading deployed to: ${deployedContracts.EnergyTrading}\n`);

        // Configuration Phase
        console.log("⚙️  Starting Configuration Phase...\n");

        // Configure Timelock roles
        console.log("🔐 Configuring Timelock roles...");
        const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
        const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
        const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();

        await timelock.grantRole(PROPOSER_ROLE, await governance.getAddress());
        await timelock.grantRole(EXECUTOR_ROLE, await governance.getAddress());
        await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress); // Allow anyone to execute
        console.log("✅ Timelock roles configured\n");

        // Configure SolarToken roles
        console.log("🪙 Configuring SolarToken roles...");
        const MINTER_ROLE = await solarToken.MINTER_ROLE();
        await solarToken.grantRole(MINTER_ROLE, await energyTrading.getAddress());
        await solarToken.grantRole(MINTER_ROLE, await staking.getAddress());
        console.log("✅ SolarToken roles configured\n");

        // Configure EnergyTrading parameters
        console.log("⚡ Configuring EnergyTrading parameters...");
        await energyTrading.setTradingParameters(
            TRADING_FEE_PERCENTAGE,
            MINIMUM_TRADE_AMOUNT,
            MAXIMUM_TRADE_AMOUNT,
            24 * 60 * 60, // 24 hours escrow delay
            7 * 24 * 60 * 60  // 7 days dispute window
        );
        console.log("✅ EnergyTrading parameters configured\n");

        // Configure Staking parameters
        console.log("🔒 Configuring Staking parameters...");
        await staking.setStakingParameters(
            MINIMUM_STAKE,
            100, // Max 100 validators
            7 * 24 * 60 * 60, // 7 days unstaking delay
            1000 // 10% slashing percentage
        );
        console.log("✅ Staking parameters configured\n");

        // Configure Oracle
        console.log("🔮 Configuring Oracle...");
        await oracle.addDataFeed(
            deployer.address,
            100, // 100% weight
            "Default data feed"
        );
        console.log("✅ Oracle configured\n");

        // Initialize some tokens for testing
        console.log("🎁 Minting initial tokens for testing...");
        const testAmount = ethers.parseEther("10000"); // 10k ST for testing
        for (let i = 1; i < Math.min(otherSigners.length + 1, 6); i++) {
            const signer = otherSigners[i - 1];
            await solarToken.mint(signer.address, testAmount, "Initial test allocation");
            console.log(`   Minted ${ethers.formatEther(testAmount)} ST to ${signer.address}`);
        }
        console.log("✅ Test tokens minted\n");

        // Save deployment information
        const deploymentInfo = {
            network: (await ethers.provider.getNetwork()).name,
            chainId: (await ethers.provider.getNetwork()).chainId.toString(),
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: deployedContracts,
            parameters: {
                initialSupply: ethers.formatEther(INITIAL_SUPPLY),
                tradingFeePercentage: TRADING_FEE_PERCENTAGE,
                minimumTradeAmount: ethers.formatEther(MINIMUM_TRADE_AMOUNT),
                maximumTradeAmount: ethers.formatEther(MAXIMUM_TRADE_AMOUNT),
                minimumStake: ethers.formatEther(MINIMUM_STAKE),
                timelockDelay: TIMELOCK_DELAY
            }
        };

        // Write deployment info to file
        const deploymentPath = path.join(__dirname, "../deployments");
        if (!fs.existsSync(deploymentPath)) {
            fs.mkdirSync(deploymentPath, { recursive: true });
        }

        const filename = `deployment-${Date.now()}.json`;
        fs.writeFileSync(
            path.join(deploymentPath, filename),
            JSON.stringify(deploymentInfo, null, 2)
        );

        // Also save as latest.json
        fs.writeFileSync(
            path.join(deploymentPath, "latest.json"),
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log("📋 Deployment Summary:");
        console.log("=".repeat(50));
        Object.entries(deployedContracts).forEach(([name, address]) => {
            console.log(`${name.padEnd(20)}: ${address}`);
        });
        console.log("=".repeat(50));
        console.log(`💾 Deployment info saved to: deployments/${filename}`);
        console.log("\n🎉 SolChain deployment completed successfully!");

        // Verification commands
        console.log("\n📝 Verification Commands:");
        console.log("To verify contracts on Etherscan/BSCScan, run:");
        Object.entries(deployedContracts).forEach(([name, address]) => {
            console.log(`npx hardhat verify --network <network> ${address}`);
        });

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

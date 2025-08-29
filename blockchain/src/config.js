/**
 * SolChain API Configuration Helper
 * 
 * This module provides utilities for configuring and deploying the SolChain API
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

class SolChainConfig {
    constructor() {
        this.networks = {
            hardhat: {
                rpcUrl: "http://127.0.0.1:8545",
                chainId: 1337,
                gasLimit: 3000000,
                gasPrice: "20000000000"
            },
            localhost: {
                rpcUrl: "http://127.0.0.1:8545",
                chainId: 1337,
                gasLimit: 3000000,
                gasPrice: "20000000000"
            },
            sepolia: {
                rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
                chainId: 11155111,
                gasLimit: 6000000,
                gasPrice: "20000000000"
            },
            bscTestnet: {
                rpcUrl: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
                chainId: 97,
                gasLimit: 6000000,
                gasPrice: "10000000000"
            },
            polygon: {
                rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
                chainId: 137,
                gasLimit: 6000000,
                gasPrice: "30000000000"
            }
        };

        this.defaultPrivateKeys = {
            hardhat: [
                "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account #0
                "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account #1
                "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account #2
                "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Account #3
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Account #4
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba", // Account #5
                "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e", // Account #6
                "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"  // Account #7
            ]
        };
    }

    /**
     * Get network configuration
     */
    getNetworkConfig(network = "hardhat") {
        if (!this.networks[network]) {
            throw new Error(`Network ${network} not found`);
        }
        return this.networks[network];
    }

    /**
     * Get configuration for API initialization
     */
    getAPIConfig(network = "hardhat", accountIndex = 0, contractAddresses = {}) {
        const networkConfig = this.getNetworkConfig(network);
        
        let privateKey = process.env.PRIVATE_KEY;
        if (!privateKey && this.defaultPrivateKeys[network]) {
            privateKey = this.defaultPrivateKeys[network][accountIndex];
        }

        return {
            ...networkConfig,
            privateKey,
            contractAddresses
        };
    }

    /**
     * Load deployed contract addresses from artifacts
     */
    loadDeployedAddresses(network = "hardhat") {
        try {
            // First try network-specific file
            const deploymentsPath = path.join(__dirname, "../deployments", `${network}.json`);
            if (fs.existsSync(deploymentsPath)) {
                return JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
            }
            
            // Fallback to latest.json
            const latestPath = path.join(__dirname, "../deployments", "latest.json");
            if (fs.existsSync(latestPath)) {
                const latestDeployment = JSON.parse(fs.readFileSync(latestPath, "utf8"));
                // Return just the contracts section for compatibility
                return latestDeployment.contracts || latestDeployment;
            }
            
            return {};
        } catch (error) {
            console.warn(`Could not load deployed addresses for ${network}:`, error.message);
            return {};
        }
    }

    /**
     * Save deployed contract addresses
     */
    saveDeployedAddresses(network, addresses) {
        try {
            const deploymentsDir = path.join(__dirname, "../deployments");
            if (!fs.existsSync(deploymentsDir)) {
                fs.mkdirSync(deploymentsDir, { recursive: true });
            }

            const deploymentsPath = path.join(deploymentsDir, `${network}.json`);
            const existingAddresses = this.loadDeployedAddresses(network);
            
            const updatedAddresses = {
                ...existingAddresses,
                ...addresses,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(deploymentsPath, JSON.stringify(updatedAddresses, null, 2));
            console.log(`✅ Deployed addresses saved to ${deploymentsPath}`);
            
            return updatedAddresses;
        } catch (error) {
            console.error("❌ Failed to save deployed addresses:", error.message);
            return null;
        }
    }

    /**
     * Deploy contracts and return addresses
     */
    async deployContracts(network = "hardhat", deployerIndex = 0) {
        try {
            console.log(`🚀 Deploying SolChain contracts to ${network}...`);
            
            const networkConfig = this.getNetworkConfig(network);
            const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
            
            let signer;
            if (process.env.PRIVATE_KEY) {
                signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
            } else if (this.defaultPrivateKeys[network]) {
                signer = new ethers.Wallet(this.defaultPrivateKeys[network][deployerIndex], provider);
            } else {
                throw new Error("No private key available for deployment");
            }

            console.log("Deploying with account:", signer.address);

            // Get starting nonce to ensure sequential deployment
            let nonce = await provider.getTransactionCount(signer.address, "pending");
            console.log(`📊 Starting deployment with nonce: ${nonce}`);

            // Load contract factories (you would need to adjust paths based on your build)
            const artifactsPath = path.join(__dirname, "../artifacts/contracts");
            
            // Deploy SolarToken
            console.log("📄 Deploying SolarToken...");
            const SolarTokenArtifact = JSON.parse(
                fs.readFileSync(path.join(artifactsPath, "SolarToken.sol/SolarToken.json"), "utf8")
            );
            const SolarTokenFactory = new ethers.ContractFactory(SolarTokenArtifact.abi, SolarTokenArtifact.bytecode, signer);
            const solarToken = await SolarTokenFactory.deploy(
                ethers.parseEther("1000000"), // 1M initial supply
                signer.address, // fee collector
                { nonce: nonce++, gasLimit: 8000000 }
            );
            await solarToken.waitForDeployment();
            const solarTokenAddress = await solarToken.getAddress();
            console.log(`✅ SolarToken deployed: ${solarTokenAddress}`);

            // Deploy Oracle
            console.log("🔮 Deploying Oracle...");
            const OracleArtifact = JSON.parse(
                fs.readFileSync(path.join(artifactsPath, "Oracle.sol/SolChainOracle.json"), "utf8")
            );
            const OracleFactory = new ethers.ContractFactory(OracleArtifact.abi, OracleArtifact.bytecode, signer);
            const oracle = await OracleFactory.deploy({ nonce: nonce++, gasLimit: 8000000 });
            await oracle.waitForDeployment();
            const oracleAddress = await oracle.getAddress();
            console.log(`✅ Oracle deployed: ${oracleAddress}`);

            // Deploy Staking
            console.log("🥩 Deploying Staking...");
            const StakingArtifact = JSON.parse(
                fs.readFileSync(path.join(artifactsPath, "Staking.sol/SolChainStaking.json"), "utf8")
            );
            const StakingFactory = new ethers.ContractFactory(StakingArtifact.abi, StakingArtifact.bytecode, signer);
            const staking = await StakingFactory.deploy(solarTokenAddress, { nonce: nonce++, gasLimit: 8000000 });
            await staking.waitForDeployment();
            const stakingAddress = await staking.getAddress();
            console.log(`✅ Staking deployed: ${stakingAddress}`);

            // Deploy Governance
            console.log("🏛️ Deploying Governance...");
            const GovernanceArtifact = JSON.parse(
                fs.readFileSync(path.join(artifactsPath, "Governance.sol/SolChainGovernance.json"), "utf8")
            );
            const GovernanceFactory = new ethers.ContractFactory(GovernanceArtifact.abi, GovernanceArtifact.bytecode, signer);
            
            // Governance config struct
            const governanceConfig = {
                votingDelay: 17280,      // 1 day in blocks (assuming 5 second blocks)
                votingPeriod: 46080,     // 8 days voting period
                proposalThreshold: ethers.parseEther("1000"), // 1000 tokens to create proposal
                quorumPercentage: 4      // 4% quorum
            };
            
            const governance = await GovernanceFactory.deploy(
                solarTokenAddress,
                governanceConfig,
                { nonce: nonce++, gasLimit: 8000000 }
            );
            await governance.waitForDeployment();
            const governanceAddress = await governance.getAddress();
            console.log(`✅ Governance deployed: ${governanceAddress}`);

            // Deploy EnergyTrading
            console.log("⚡ Deploying EnergyTrading...");
            const EnergyTradingArtifact = JSON.parse(
                fs.readFileSync(path.join(artifactsPath, "EnergyTrading.sol/EnergyTrading.json"), "utf8")
            );
            const EnergyTradingFactory = new ethers.ContractFactory(EnergyTradingArtifact.abi, EnergyTradingArtifact.bytecode, signer);
            const energyTrading = await EnergyTradingFactory.deploy(
                solarTokenAddress,
                oracleAddress,
                { nonce: nonce++, gasLimit: 8000000 }
            );
            await energyTrading.waitForDeployment();
            const energyTradingAddress = await energyTrading.getAddress();
            console.log(`✅ EnergyTrading deployed: ${energyTradingAddress}`);

            const deployedAddresses = {
                SolarToken: solarTokenAddress,
                Oracle: oracleAddress,
                Staking: stakingAddress,
                Governance: governanceAddress,
                EnergyTrading: energyTradingAddress,
                deployer: signer.address,
                network: network,
                deployedAt: new Date().toISOString()
            };

            // Save addresses
            this.saveDeployedAddresses(network, deployedAddresses);

            console.log("🎉 All contracts deployed successfully!");
            return { success: true, data: deployedAddresses };

        } catch (error) {
            console.error("❌ Deployment failed:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create API instance with auto-loaded contract addresses
     */
    async createAPIInstance(network = "hardhat", accountIndex = 0) {
        try {
            const SolChainAPI = require('./solchain-api');
            
            // Load or deploy contracts
            let contractAddresses = this.loadDeployedAddresses(network);
            
            if (!contractAddresses.SolarToken) {
                console.log("📝 No deployed contracts found, deploying...");
                const deployment = await this.deployContracts(network);
                if (!deployment.success) {
                    throw new Error(`Deployment failed: ${deployment.error}`);
                }
                contractAddresses = deployment.data;
            }

            const config = this.getAPIConfig(network, accountIndex, contractAddresses);
            const api = new SolChainAPI(config);
            
            // Initialize the API provider
            await api.initialize();
            
            const initResult = await api.initializeContracts(contractAddresses);
            if (!initResult.success) {
                throw new Error(`API initialization failed: ${initResult.error}`);
            }

            console.log("✅ SolChain API instance created successfully");
            return { success: true, api, config: config, addresses: contractAddresses };

        } catch (error) {
            console.error("❌ Failed to create API instance:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Environment variable configuration helper
     */
    generateEnvExample() {
        return `
# SolChain API Configuration
# Copy this to .env and update with your values

# Network Configuration
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=1337

# Private Key (keep secure!)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Contract Addresses (auto-generated during deployment)
SOLAR_TOKEN_ADDRESS=
ENERGY_TRADING_ADDRESS=
ORACLE_ADDRESS=
STAKING_ADDRESS=
GOVERNANCE_ADDRESS=

# API Configuration
DEFAULT_GAS_LIMIT=3000000
DEFAULT_GAS_PRICE=20000000000

# External Service URLs
SEPOLIA_RPC_URL=https://rpc.sepolia.org
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
POLYGON_RPC_URL=https://polygon-rpc.com

# API Server Configuration
PORT=3000
NODE_ENV=development
`;
    }

    /**
     * Save environment example file
     */
    saveEnvExample() {
        try {
            const envContent = this.generateEnvExample();
            const envPath = path.join(__dirname, "../.env.example");
            fs.writeFileSync(envPath, envContent);
            console.log(`✅ Environment example saved to ${envPath}`);
        } catch (error) {
            console.error("❌ Failed to save .env.example:", error.message);
        }
    }
}

module.exports = SolChainConfig;

// CLI usage if called directly
if (require.main === module) {
    const config = new SolChainConfig();
    const command = process.argv[2];
    const network = process.argv[3] || "hardhat";

    switch (command) {
        case "deploy":
            config.deployContracts(network).then(result => {
                if (result.success) {
                    console.log("✅ Deployment completed:", result.data);
                } else {
                    console.error("❌ Deployment failed:", result.error);
                }
            });
            break;

        case "config":
            console.log("📋 Network Config:", config.getNetworkConfig(network));
            break;

        case "addresses":
            console.log("📍 Deployed Addresses:", config.loadDeployedAddresses(network));
            break;

        case "api":
            config.createAPIInstance(network).then(result => {
                if (result.success) {
                    console.log("✅ API instance created successfully");
                    console.log("📋 Configuration:", result.config);
                    console.log("📍 Contract Addresses:", result.addresses);
                } else {
                    console.error("❌ Failed to create API instance:", result.error);
                }
            });
            break;

        case "env":
            config.saveEnvExample();
            break;

        default:
            console.log(`
🔧 SolChain Configuration Helper

Usage: node config.js <command> [network]

Commands:
  deploy <network>   - Deploy contracts to network
  config <network>   - Show network configuration
  addresses <network> - Show deployed contract addresses
  api <network>      - Create and test API instance
  env               - Generate .env.example file

Networks: hardhat, localhost, sepolia, bscTestnet, polygon

Examples:
  node config.js deploy hardhat
  node config.js api localhost
  node config.js addresses sepolia
  node config.js env
            `);
    }
}

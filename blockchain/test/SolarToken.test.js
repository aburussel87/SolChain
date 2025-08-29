const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("SolarToken", function () {
    async function deploySolarTokenFixture() {
        const [owner, minter, user1, user2, feeCollector] = await ethers.getSigners();
        
        const initialSupply = ethers.parseEther("1000000"); // 1M tokens
        
        const SolarToken = await ethers.getContractFactory("SolarToken");
        const solarToken = await SolarToken.deploy(initialSupply, feeCollector.address);
        
        return { solarToken, owner, minter, user1, user2, feeCollector, initialSupply };
    }

    describe("Deployment", function () {
        it("Should deploy with correct initial parameters", async function () {
            const { solarToken, owner, feeCollector, initialSupply } = await loadFixture(deploySolarTokenFixture);
            
            expect(await solarToken.name()).to.equal("SolarToken");
            expect(await solarToken.symbol()).to.equal("ST");
            expect(await solarToken.decimals()).to.equal(18);
            expect(await solarToken.totalSupply()).to.equal(initialSupply);
            expect(await solarToken.balanceOf(owner.address)).to.equal(initialSupply);
            expect(await solarToken.feeCollector()).to.equal(feeCollector.address);
        });

        it("Should grant correct roles to deployer", async function () {
            const { solarToken, owner } = await loadFixture(deploySolarTokenFixture);
            
            const DEFAULT_ADMIN_ROLE = await solarToken.DEFAULT_ADMIN_ROLE();
            const MINTER_ROLE = await solarToken.MINTER_ROLE();
            const PAUSER_ROLE = await solarToken.PAUSER_ROLE();
            
            expect(await solarToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
            expect(await solarToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
            expect(await solarToken.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
        });
    });

    describe("Minting", function () {
        it("Should allow minters to mint tokens", async function () {
            const { solarToken, owner, user1 } = await loadFixture(deploySolarTokenFixture);
            
            const mintAmount = ethers.parseEther("1000");
            await solarToken.mint(user1.address, mintAmount, "Test minting");
            
            expect(await solarToken.balanceOf(user1.address)).to.equal(mintAmount);
        });

        it("Should not allow non-minters to mint", async function () {
            const { solarToken, user1, user2 } = await loadFixture(deploySolarTokenFixture);
            
            const mintAmount = ethers.parseEther("1000");
            await expect(
                solarToken.connect(user1).mint(user2.address, mintAmount, "Test minting")
            ).to.be.reverted;
        });

        it("Should not exceed maximum supply", async function () {
            const { solarToken, owner, user1 } = await loadFixture(deploySolarTokenFixture);
            
            const maxSupply = await solarToken.MAX_SUPPLY();
            const currentSupply = await solarToken.totalSupply();
            const mintAmount = maxSupply - currentSupply + ethers.parseEther("1");
            
            await expect(
                solarToken.mint(user1.address, mintAmount, "Exceeding max supply")
            ).to.be.revertedWithCustomError(solarToken, "ExceedsMaxSupply");
        });
    });

    describe("Burning", function () {
        it("Should allow users to burn their tokens", async function () {
            const { solarToken, owner } = await loadFixture(deploySolarTokenFixture);
            
            const burnAmount = ethers.parseEther("1000");
            const initialBalance = await solarToken.balanceOf(owner.address);
            
            await solarToken.burnWithReason(burnAmount, "Test burning");
            
            expect(await solarToken.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
        });

        it("Should not allow burning more than balance", async function () {
            const { solarToken, user1 } = await loadFixture(deploySolarTokenFixture);
            
            const burnAmount = ethers.parseEther("1000");
            await expect(
                solarToken.connect(user1).burnWithReason(burnAmount, "Test burning")
            ).to.be.revertedWithCustomError(solarToken, "InsufficientBalance");
        });
    });

    describe("Transfer Fees", function () {
        it("Should apply transfer fees", async function () {
            const { solarToken, owner, user1, user2, feeCollector } = await loadFixture(deploySolarTokenFixture);
            
            // Remove both owner and user1 from whitelist to test fees
            await solarToken.removeFromWhitelist(owner.address);
            
            // Give user1 some tokens (this transfer will have fees since owner is not whitelisted)
            const initialAmount = ethers.parseEther("2000");
            const initialFee = (initialAmount * BigInt(25)) / BigInt(10000); // 0.25% fee
            const userReceives = initialAmount - initialFee;
            
            await solarToken.transfer(user1.address, initialAmount);
            expect(await solarToken.balanceOf(user1.address)).to.equal(userReceives);
            
            // Now test transfer from user1 to user2 (both non-whitelisted)
            const transferAmount = ethers.parseEther("1000");
            const feePercentage = await solarToken.transferFeePercentage();
            const expectedFee = (transferAmount * BigInt(feePercentage)) / BigInt(10000);
            const expectedTransfer = transferAmount - expectedFee;
            
            const feeCollectorBalanceBefore = await solarToken.balanceOf(feeCollector.address);
            
            await solarToken.connect(user1).transfer(user2.address, transferAmount);
            
            expect(await solarToken.balanceOf(user2.address)).to.equal(expectedTransfer);
            const feeCollectorBalanceAfter = await solarToken.balanceOf(feeCollector.address);
            expect(feeCollectorBalanceAfter - feeCollectorBalanceBefore).to.equal(expectedFee);
        });

        it("Should not apply fees to whitelisted addresses", async function () {
            const { solarToken, owner, user1 } = await loadFixture(deploySolarTokenFixture);
            
            // Owner is whitelisted by default
            const transferAmount = ethers.parseEther("1000");
            
            // Add user1 to whitelist
            const FEE_MANAGER_ROLE = await solarToken.FEE_MANAGER_ROLE();
            await solarToken.addToWhitelist(user1.address);
            
            await solarToken.transfer(user1.address, transferAmount);
            
            expect(await solarToken.balanceOf(user1.address)).to.equal(transferAmount);
        });
    });

    describe("Blacklist", function () {
        it("Should prevent blacklisted addresses from transfers", async function () {
            const { solarToken, owner, user1 } = await loadFixture(deploySolarTokenFixture);
            
            // First transfer some tokens to user1
            await solarToken.transfer(user1.address, ethers.parseEther("1000"));
            
            // Blacklist user1
            await solarToken.blacklistAddress(user1.address);
            
            // User1 should not be able to transfer
            await expect(
                solarToken.connect(user1).transfer(owner.address, ethers.parseEther("100"))
            ).to.be.revertedWithCustomError(solarToken, "AddressIsBlacklisted");
        });

        it("Should prevent transfers to blacklisted addresses", async function () {
            const { solarToken, owner, user1 } = await loadFixture(deploySolarTokenFixture);
            
            // Blacklist user1
            await solarToken.blacklistAddress(user1.address);
            
            // Should not be able to transfer to blacklisted address
            await expect(
                solarToken.transfer(user1.address, ethers.parseEther("100"))
            ).to.be.revertedWithCustomError(solarToken, "AddressIsBlacklisted");
        });
    });

    describe("Pausable", function () {
        it("Should pause and unpause transfers", async function () {
            const { solarToken, owner, user1 } = await loadFixture(deploySolarTokenFixture);
            
            // Pause the contract
            await solarToken.pause();
            
            // Transfers should be paused
            await expect(
                solarToken.transfer(user1.address, ethers.parseEther("100"))
            ).to.be.revertedWithCustomError(solarToken, "EnforcedPause");
            
            // Unpause the contract
            await solarToken.unpause();
            
            // Transfers should work again
            await expect(
                solarToken.transfer(user1.address, ethers.parseEther("100"))
            ).to.not.be.reverted;
        });
    });

    describe("Access Control", function () {
        it("Should allow admin to grant roles", async function () {
            const { solarToken, owner, user1 } = await loadFixture(deploySolarTokenFixture);
            
            const MINTER_ROLE = await solarToken.MINTER_ROLE();
            
            await solarToken.grantRole(MINTER_ROLE, user1.address);
            
            expect(await solarToken.hasRole(MINTER_ROLE, user1.address)).to.be.true;
        });

        it("Should not allow non-admin to grant roles", async function () {
            const { solarToken, user1, user2 } = await loadFixture(deploySolarTokenFixture);
            
            const MINTER_ROLE = await solarToken.MINTER_ROLE();
            
            await expect(
                solarToken.connect(user1).grantRole(MINTER_ROLE, user2.address)
            ).to.be.reverted;
        });
    });

    describe("Fee Management", function () {
        it("Should allow fee manager to update transfer fee", async function () {
            const { solarToken, owner } = await loadFixture(deploySolarTokenFixture);
            
            const newFee = 50; // 0.5%
            await solarToken.setTransferFee(newFee);
            
            expect(await solarToken.transferFeePercentage()).to.equal(newFee);
        });

        it("Should not allow setting fee above maximum", async function () {
            const { solarToken, owner } = await loadFixture(deploySolarTokenFixture);
            
            const invalidFee = 1001; // 10.01%
            await expect(
                solarToken.setTransferFee(invalidFee)
            ).to.be.revertedWithCustomError(solarToken, "InvalidFeePercentage");
        });

        it("Should allow updating fee collector", async function () {
            const { solarToken, owner, user1 } = await loadFixture(deploySolarTokenFixture);
            
            await solarToken.setFeeCollector(user1.address);
            
            expect(await solarToken.feeCollector()).to.equal(user1.address);
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow admin emergency withdraw", async function () {
            const { solarToken, owner } = await loadFixture(deploySolarTokenFixture);
            
            // Send some ETH to the contract
            await owner.sendTransaction({
                to: await solarToken.getAddress(),
                value: ethers.parseEther("1")
            });
            
            const initialBalance = await ethers.provider.getBalance(owner.address);
            
            // Emergency withdraw
            await solarToken.emergencyWithdraw(ethers.ZeroAddress, owner.address, ethers.parseEther("1"));
            
            // Check balance increased (minus gas)
            const finalBalance = await ethers.provider.getBalance(owner.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });
    });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SolChainStaking", function () {
    async function deployStakingFixture() {
        const [owner, validator1, validator2, validator3, rewardDistributor] = await ethers.getSigners();
        
        // Deploy SolarToken first
        const SolarToken = await ethers.getContractFactory("SolarToken");
        const solarToken = await SolarToken.deploy(
            ethers.parseEther("1000000"), // 1M initial supply
            owner.address // Fee collector
        );
        
        // Deploy Staking contract
        const SolChainStaking = await ethers.getContractFactory("SolChainStaking");
        const staking = await SolChainStaking.deploy(await solarToken.getAddress());
        
        // Grant reward distributor role
        const REWARD_DISTRIBUTOR_ROLE = await staking.REWARD_DISTRIBUTOR_ROLE();
        await staking.grantRole(REWARD_DISTRIBUTOR_ROLE, rewardDistributor.address);
        
        // Whitelist the staking contract to avoid transfer fees
        await solarToken.addToWhitelist(await staking.getAddress());
        
        // Mint tokens to validators
        const mintAmount = ethers.parseEther("10000");
        await solarToken.mint(validator1.address, mintAmount, "Test allocation");
        await solarToken.mint(validator2.address, mintAmount, "Test allocation");
        await solarToken.mint(validator3.address, mintAmount, "Test allocation");
        await solarToken.mint(rewardDistributor.address, ethers.parseEther("100000"), "Reward pool");
        
        // Approve staking contract
        await solarToken.connect(validator1).approve(await staking.getAddress(), mintAmount);
        await solarToken.connect(validator2).approve(await staking.getAddress(), mintAmount);
        await solarToken.connect(validator3).approve(await staking.getAddress(), mintAmount);
        await solarToken.connect(rewardDistributor).approve(await staking.getAddress(), ethers.parseEther("100000"));
        
        return { 
            solarToken, 
            staking, 
            owner, 
            validator1, 
            validator2, 
            validator3, 
            rewardDistributor 
        };
    }

    describe("Deployment", function () {
        it("Should deploy with correct parameters", async function () {
            const { staking, solarToken } = await loadFixture(deployStakingFixture);
            
            expect(await staking.solarToken()).to.equal(await solarToken.getAddress());
            expect(await staking.minimumStake()).to.equal(ethers.parseEther("1000"));
            expect(await staking.maximumValidators()).to.equal(100);
            expect(await staking.unstakingDelay()).to.equal(7 * 24 * 60 * 60); // 7 days
        });
    });

    describe("Staking", function () {
        it("Should allow staking with sufficient tokens", async function () {
            const { staking, validator1 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            const metadata = "Validator 1 metadata";
            
            await expect(
                staking.connect(validator1).stake(stakeAmount, metadata)
            ).to.emit(staking, "Staked").withArgs(validator1.address, stakeAmount, metadata);
            
            const validator = await staking.validators(validator1.address);
            expect(validator.stakedAmount).to.equal(stakeAmount);
            expect(validator.isActive).to.be.true;
            expect(validator.metadata).to.equal(metadata);
        });

        it("Should reject staking below minimum", async function () {
            const { staking, validator1 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("500"); // Below minimum
            
            await expect(
                staking.connect(validator1).stake(stakeAmount, "metadata")
            ).to.be.revertedWithCustomError(staking, "InsufficientStake");
        });

        it("Should not allow staking if already a validator", async function () {
            const { staking, validator1 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            
            // First stake
            await staking.connect(validator1).stake(stakeAmount, "metadata");
            
            // Second stake should fail
            await expect(
                staking.connect(validator1).stake(stakeAmount, "metadata")
            ).to.be.revertedWithCustomError(staking, "ValidatorAlreadyExists");
        });

        it("Should allow adding more stake", async function () {
            const { staking, validator1 } = await loadFixture(deployStakingFixture);
            
            const initialStake = ethers.parseEther("2000");
            const additionalStake = ethers.parseEther("1000");
            
            // Initial stake
            await staking.connect(validator1).stake(initialStake, "metadata");
            
            // Add more stake
            await expect(
                staking.connect(validator1).addStake(additionalStake)
            ).to.emit(staking, "Staked");
            
            const validator = await staking.validators(validator1.address);
            expect(validator.stakedAmount).to.equal(initialStake + additionalStake);
        });
    });

    describe("Unstaking", function () {
        it("Should allow requesting unstake", async function () {
            const { staking, validator1 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            await staking.connect(validator1).stake(stakeAmount, "metadata");
            
            await expect(
                staking.connect(validator1).requestUnstake()
            ).to.emit(staking, "UnstakeRequested");
            
            const validator = await staking.validators(validator1.address);
            expect(validator.isActive).to.be.false;
            expect(validator.unstakeRequestTime).to.be.gt(0);
        });

        it("Should not allow unstaking before delay period", async function () {
            const { staking, validator1 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            await staking.connect(validator1).stake(stakeAmount, "metadata");
            await staking.connect(validator1).requestUnstake();
            
            // Try to unstake immediately
            await expect(
                staking.connect(validator1).unstake()
            ).to.be.revertedWithCustomError(staking, "UnstakingPeriodNotComplete");
        });

        it("Should allow unstaking after delay period", async function () {
            const { staking, solarToken, validator1 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            await staking.connect(validator1).stake(stakeAmount, "metadata");
            await staking.connect(validator1).requestUnstake();
            
            // Fast forward past unstaking delay
            await time.increase(7 * 24 * 60 * 60 + 1); // 7 days + 1 second
            
            const balanceBefore = await solarToken.balanceOf(validator1.address);
            
            await expect(
                staking.connect(validator1).unstake()
            ).to.emit(staking, "Unstaked");
            
            const balanceAfter = await solarToken.balanceOf(validator1.address);
            expect(balanceAfter - balanceBefore).to.equal(stakeAmount);
            
            // Validator should be removed
            const validator = await staking.validators(validator1.address);
            expect(validator.stakedAmount).to.equal(0);
        });
    });

    describe("Rewards", function () {
        it("Should distribute rewards correctly", async function () {
            const { staking, solarToken, validator1, validator2, rewardDistributor } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            const rewardAmount = ethers.parseEther("1000");
            const duration = 7 * 24 * 60 * 60; // 7 days
            
            // Stake tokens
            await staking.connect(validator1).stake(stakeAmount, "metadata1");
            await staking.connect(validator2).stake(stakeAmount, "metadata2");
            
            // Add rewards
            await expect(
                staking.connect(rewardDistributor).addRewards(rewardAmount, duration)
            ).to.emit(staking, "RewardsAdded");
            
            // Fast forward some time
            await time.increase(24 * 60 * 60); // 1 day
            
            // Check earned rewards
            const earned1 = await staking.earned(validator1.address);
            const earned2 = await staking.earned(validator2.address);
            
            expect(earned1).to.be.gt(0);
            expect(earned2).to.equal(earned1); // Equal stakes, equal rewards
        });

        it("Should allow claiming rewards", async function () {
            const { staking, solarToken, validator1, rewardDistributor } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            const rewardAmount = ethers.parseEther("1000");
            const duration = 7 * 24 * 60 * 60; // 7 days
            
            // Stake and add rewards
            await staking.connect(validator1).stake(stakeAmount, "metadata");
            await staking.connect(rewardDistributor).addRewards(rewardAmount, duration);
            
            // Fast forward
            await time.increase(24 * 60 * 60); // 1 day
            
            const balanceBefore = await solarToken.balanceOf(validator1.address);
            const earned = await staking.earned(validator1.address);
            
            await expect(
                staking.connect(validator1).claimRewards()
            ).to.emit(staking, "RewardsClaimed");
            
            const balanceAfter = await solarToken.balanceOf(validator1.address);
            const actualReward = balanceAfter - balanceBefore;
            
            // Allow for small precision differences (within 0.1% tolerance)
            const tolerance = earned / BigInt(1000); // 0.1% tolerance
            const diff = actualReward > earned ? actualReward - earned : earned - actualReward;
            expect(diff).to.be.lte(tolerance);
        });

        it("Should not allow claiming zero rewards", async function () {
            const { staking, validator1 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            await staking.connect(validator1).stake(stakeAmount, "metadata");
            
            // No rewards added, should fail
            await expect(
                staking.connect(validator1).claimRewards()
            ).to.be.revertedWithCustomError(staking, "NoRewardsToClaim");
        });
    });

    describe("Slashing", function () {
        it("Should allow slashing malicious validators", async function () {
            const { staking, owner, validator1 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            await staking.connect(validator1).stake(stakeAmount, "metadata");
            
            const slashingPercentage = await staking.slashingPercentage();
            const expectedSlash = (stakeAmount * slashingPercentage) / BigInt(10000);
            
            await expect(
                staking.slashValidator(validator1.address, "Malicious behavior")
            ).to.emit(staking, "ValidatorSlashed")
            .withArgs(validator1.address, expectedSlash, "Malicious behavior");
            
            const validator = await staking.validators(validator1.address);
            expect(validator.isSlashed).to.be.true;
            expect(validator.slashedAmount).to.equal(expectedSlash);
            expect(validator.stakedAmount).to.equal(stakeAmount - expectedSlash);
        });

        it("Should not allow non-slasher to slash", async function () {
            const { staking, validator1, validator2 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            await staking.connect(validator1).stake(stakeAmount, "metadata");
            
            await expect(
                staking.connect(validator2).slashValidator(validator1.address, "Malicious behavior")
            ).to.be.reverted;
        });
    });

    describe("Validator Management", function () {
        it("Should track active validators correctly", async function () {
            const { staking, validator1, validator2, validator3 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            
            // Stake multiple validators
            await staking.connect(validator1).stake(stakeAmount, "metadata1");
            await staking.connect(validator2).stake(stakeAmount, "metadata2");
            await staking.connect(validator3).stake(stakeAmount, "metadata3");
            
            const activeValidators = await staking.getActiveValidators();
            expect(activeValidators.length).to.equal(3);
            expect(activeValidators).to.include(validator1.address);
            expect(activeValidators).to.include(validator2.address);
            expect(activeValidators).to.include(validator3.address);
        });

        it("Should remove validator from active list after unstake request", async function () {
            const { staking, validator1, validator2 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            
            await staking.connect(validator1).stake(stakeAmount, "metadata1");
            await staking.connect(validator2).stake(stakeAmount, "metadata2");
            
            let activeValidators = await staking.getActiveValidators();
            expect(activeValidators.length).to.equal(2);
            
            // Request unstake
            await staking.connect(validator1).requestUnstake();
            
            activeValidators = await staking.getActiveValidators();
            expect(activeValidators.length).to.equal(1);
            expect(activeValidators[0]).to.equal(validator2.address);
        });

        it("Should not exceed maximum validators", async function () {
            // Deploy fresh staking contract for this test
            const { solarToken, owner } = await loadFixture(deployStakingFixture);
            
            const StakingContract = await ethers.getContractFactory("SolChainStaking");
            const freshStaking = await StakingContract.deploy(await solarToken.getAddress());
            await freshStaking.waitForDeployment();
            
            // Configure with maximum 2 validators
            await freshStaking.setStakingParameters(
                ethers.parseEther("1000"), // minimum stake
                2, // maximum validators
                7 * 24 * 60 * 60, // unstaking delay
                1000 // slashing percentage
            );
            
            const stakeAmount = ethers.parseEther("2000");
            
            // Create validators up to maximum
            const [, v1, v2, v3] = await ethers.getSigners();
            
            // Mint tokens to new validators
            await solarToken.mint(v1.address, ethers.parseEther("10000"), "Test");
            await solarToken.mint(v2.address, ethers.parseEther("10000"), "Test");
            await solarToken.mint(v3.address, ethers.parseEther("10000"), "Test");
            
            await solarToken.connect(v1).approve(await freshStaking.getAddress(), ethers.parseEther("10000"));
            await solarToken.connect(v2).approve(await freshStaking.getAddress(), ethers.parseEther("10000"));
            await solarToken.connect(v3).approve(await freshStaking.getAddress(), ethers.parseEther("10000"));
            
            await freshStaking.connect(v1).stake(stakeAmount, "metadata1");
            await freshStaking.connect(v2).stake(stakeAmount, "metadata2");
            
            // Third validator should fail
            await expect(
                freshStaking.connect(v3).stake(stakeAmount, "metadata3")
            ).to.be.revertedWithCustomError(freshStaking, "MaxValidatorsReached");
        });
    });

    describe("View Functions", function () {
        it("Should return validator information", async function () {
            const { staking, validator1 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            const metadata = "Test metadata";
            
            await staking.connect(validator1).stake(stakeAmount, metadata);
            
            const info = await staking.getValidatorInfo(validator1.address);
            expect(info.stakedAmount).to.equal(stakeAmount);
            expect(info.isActive).to.be.true;
            expect(info.isSlashed).to.be.false;
            expect(info.metadata).to.equal(metadata);
        });

        it("Should return staking statistics", async function () {
            const { staking, validator1, validator2 } = await loadFixture(deployStakingFixture);
            
            const stakeAmount = ethers.parseEther("2000");
            
            await staking.connect(validator1).stake(stakeAmount, "metadata1");
            await staking.connect(validator2).stake(stakeAmount, "metadata2");
            
            const stats = await staking.getStakingStats();
            expect(stats.totalValidators).to.equal(2);
            expect(stats.activeValidators).to.equal(2);
            expect(stats.totalStakedAmount).to.equal(stakeAmount * BigInt(2));
        });
    });

    describe("Administration", function () {
        it("Should allow admin to update parameters", async function () {
            const { staking, owner } = await loadFixture(deployStakingFixture);
            
            const newMinStake = ethers.parseEther("2000");
            const newMaxValidators = 50;
            const newUnstakingDelay = 14 * 24 * 60 * 60; // 14 days
            const newSlashingPercentage = 1500; // 15%
            
            await expect(
                staking.setStakingParameters(
                    newMinStake,
                    newMaxValidators,
                    newUnstakingDelay,
                    newSlashingPercentage
                )
            ).to.emit(staking, "ParametersUpdated");
            
            expect(await staking.minimumStake()).to.equal(newMinStake);
            expect(await staking.maximumValidators()).to.equal(newMaxValidators);
            expect(await staking.unstakingDelay()).to.equal(newUnstakingDelay);
            expect(await staking.slashingPercentage()).to.equal(newSlashingPercentage);
        });

        it("Should not allow invalid parameters", async function () {
            const { staking, owner } = await loadFixture(deployStakingFixture);
            
            // Test invalid slashing percentage (> 50%)
            await expect(
                staking.setStakingParameters(
                    ethers.parseEther("1000"),
                    100,
                    7 * 24 * 60 * 60,
                    5001 // > 50%
                )
            ).to.be.revertedWithCustomError(staking, "InvalidParameter");
        });

        it("Should allow pausing and unpausing", async function () {
            const { staking, owner, validator1 } = await loadFixture(deployStakingFixture);
            
            // Pause staking
            await staking.pause();
            
            // Should not allow staking when paused
            await expect(
                staking.connect(validator1).stake(ethers.parseEther("2000"), "metadata")
            ).to.be.revertedWithCustomError(staking, "EnforcedPause");
            
            // Unpause staking
            await staking.unpause();
            
            // Should allow staking again
            await expect(
                staking.connect(validator1).stake(ethers.parseEther("2000"), "metadata")
            ).to.not.be.reverted;
        });
    });
});

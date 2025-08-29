const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("EnergyTrading", function () {
    async function deployEnergyTradingFixture() {
        const [owner, seller, buyer, feeCollector, disputeResolver] = await ethers.getSigners();
        
        // Deploy SolarToken first
        const SolarToken = await ethers.getContractFactory("SolarToken");
        const solarToken = await SolarToken.deploy(
            ethers.parseEther("1000000"), // 1M initial supply
            feeCollector.address
        );
        
        // Deploy EnergyTrading
        const EnergyTrading = await ethers.getContractFactory("EnergyTrading");
        const energyTrading = await EnergyTrading.deploy(
            await solarToken.getAddress(),
            feeCollector.address
        );
        
        // Grant minter role to energy trading contract
        const MINTER_ROLE = await solarToken.MINTER_ROLE();
        await solarToken.grantRole(MINTER_ROLE, await energyTrading.getAddress());
        
        // Whitelist the energy trading contract to avoid transfer fees
        await solarToken.addToWhitelist(await energyTrading.getAddress());
        
        // Grant dispute resolver role
        const DISPUTE_RESOLVER_ROLE = await energyTrading.DISPUTE_RESOLVER_ROLE();
        await energyTrading.grantRole(DISPUTE_RESOLVER_ROLE, disputeResolver.address);
        
        // Mint tokens to users for testing
        await solarToken.mint(seller.address, ethers.parseEther("10000"), "Test allocation");
        await solarToken.mint(buyer.address, ethers.parseEther("10000"), "Test allocation");
        
        // Approve energy trading contract to spend tokens
        await solarToken.connect(seller).approve(await energyTrading.getAddress(), ethers.parseEther("10000"));
        await solarToken.connect(buyer).approve(await energyTrading.getAddress(), ethers.parseEther("10000"));
        
        return { 
            solarToken, 
            energyTrading, 
            owner, 
            seller, 
            buyer, 
            feeCollector, 
            disputeResolver 
        };
    }

    describe("Deployment", function () {
        it("Should deploy with correct parameters", async function () {
            const { energyTrading, solarToken, feeCollector } = await loadFixture(deployEnergyTradingFixture);
            
            expect(await energyTrading.solarToken()).to.equal(await solarToken.getAddress());
            expect(await energyTrading.feeCollector()).to.equal(feeCollector.address);
            expect(await energyTrading.tradingFeePercentage()).to.equal(25); // 0.25%
        });
    });

    describe("Offer Creation", function () {
        it("Should create sell offer", async function () {
            const { energyTrading, seller } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100"); // 100 kWh
            const pricePerKwh = ethers.parseEther("0.1"); // 0.1 ST per kWh
            const deadline = (await time.latest()) + 3600; // 1 hour from now
            
            await expect(
                energyTrading.connect(seller).createOffer(
                    0, // SELL
                    energyAmount,
                    pricePerKwh,
                    deadline,
                    "Grid-1",
                    "Solar"
                )
            ).to.emit(energyTrading, "OfferCreated");
            
            const offer = await energyTrading.offers(1);
            expect(offer.creator).to.equal(seller.address);
            expect(offer.energyAmount).to.equal(energyAmount);
            expect(offer.pricePerKwh).to.equal(pricePerKwh);
        });

        it("Should create buy offer", async function () {
            const { energyTrading, buyer } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100"); // 100 kWh
            const pricePerKwh = ethers.parseEther("0.1"); // 0.1 ST per kWh
            const deadline = (await time.latest()) + 3600; // 1 hour from now
            
            await expect(
                energyTrading.connect(buyer).createOffer(
                    1, // BUY
                    energyAmount,
                    pricePerKwh,
                    deadline,
                    "Grid-1",
                    "Solar"
                )
            ).to.emit(energyTrading, "OfferCreated");
            
            const offer = await energyTrading.offers(1);
            expect(offer.creator).to.equal(buyer.address);
            expect(offer.offerType).to.equal(1); // BUY
        });

        it("Should reject offers below minimum amount", async function () {
            const { energyTrading, seller } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("0.05"); // Below minimum
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            await expect(
                energyTrading.connect(seller).createOffer(
                    0, // SELL
                    energyAmount,
                    pricePerKwh,
                    deadline,
                    "Grid-1",
                    "Solar"
                )
            ).to.be.revertedWithCustomError(energyTrading, "InvalidAmount");
        });

        it("Should reject offers with expired deadline", async function () {
            const { energyTrading, seller } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) - 3600; // 1 hour ago
            
            await expect(
                energyTrading.connect(seller).createOffer(
                    0, // SELL
                    energyAmount,
                    pricePerKwh,
                    deadline,
                    "Grid-1",
                    "Solar"
                )
            ).to.be.revertedWithCustomError(energyTrading, "OfferExpired");
        });
    });

    describe("Offer Management", function () {
        it("Should allow creator to cancel offer", async function () {
            const { energyTrading, seller } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            await energyTrading.connect(seller).createOffer(
                0, // SELL
                energyAmount,
                pricePerKwh,
                deadline,
                "Grid-1",
                "Solar"
            );
            
            await expect(
                energyTrading.connect(seller).cancelOffer(1)
            ).to.emit(energyTrading, "OfferCancelled");
            
            const offer = await energyTrading.offers(1);
            expect(offer.status).to.equal(1); // CANCELLED
        });

        it("Should not allow non-creator to cancel offer", async function () {
            const { energyTrading, seller, buyer } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            await energyTrading.connect(seller).createOffer(
                0, // SELL
                energyAmount,
                pricePerKwh,
                deadline,
                "Grid-1",
                "Solar"
            );
            
            await expect(
                energyTrading.connect(buyer).cancelOffer(1)
            ).to.be.revertedWithCustomError(energyTrading, "UnauthorizedAccess");
        });

        it("Should allow creator to update offer price", async function () {
            const { energyTrading, seller } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const newPricePerKwh = ethers.parseEther("0.12");
            const deadline = (await time.latest()) + 3600;
            
            await energyTrading.connect(seller).createOffer(
                0, // SELL
                energyAmount,
                pricePerKwh,
                deadline,
                "Grid-1",
                "Solar"
            );
            
            await expect(
                energyTrading.connect(seller).updateOfferPrice(1, newPricePerKwh)
            ).to.emit(energyTrading, "OfferUpdated");
            
            const offer = await energyTrading.offers(1);
            expect(offer.pricePerKwh).to.equal(newPricePerKwh);
        });
    });

    describe("Trade Execution", function () {
        it("Should execute sell offer trade", async function () {
            const { energyTrading, solarToken, seller, buyer, feeCollector } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const totalPrice = ethers.parseEther("10"); // 100 * 0.1
            const deadline = (await time.latest()) + 3600;
            
            // Create sell offer
            await energyTrading.connect(seller).createOffer(
                0, // SELL
                energyAmount,
                pricePerKwh,
                deadline,
                "Grid-1",
                "Solar"
            );
            
            const sellerBalanceBefore = await solarToken.balanceOf(seller.address);
            const buyerBalanceBefore = await solarToken.balanceOf(buyer.address);
            
            // Accept offer
            await expect(
                energyTrading.connect(buyer).acceptOffer(1)
            ).to.emit(energyTrading, "TradeExecuted");
            
            // Check trade was created
            const trade = await energyTrading.trades(1);
            expect(trade.buyer).to.equal(buyer.address);
            expect(trade.seller).to.equal(seller.address);
            expect(trade.energyAmount).to.equal(energyAmount);
            expect(trade.totalPrice).to.equal(totalPrice);
        });

        it("Should execute buy offer trade", async function () {
            const { energyTrading, solarToken, seller, buyer } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            // Create buy offer
            await energyTrading.connect(buyer).createOffer(
                1, // BUY
                energyAmount,
                pricePerKwh,
                deadline,
                "Grid-1",
                "Solar"
            );
            
            // Accept offer (seller accepts buy offer)
            await expect(
                energyTrading.connect(seller).acceptOffer(1)
            ).to.emit(energyTrading, "TradeExecuted");
            
            const trade = await energyTrading.trades(1);
            expect(trade.buyer).to.equal(buyer.address);
            expect(trade.seller).to.equal(seller.address);
        });

        it("Should not allow creator to accept own offer", async function () {
            const { energyTrading, seller } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            await energyTrading.connect(seller).createOffer(
                0, // SELL
                energyAmount,
                pricePerKwh,
                deadline,
                "Grid-1",
                "Solar"
            );
            
            await expect(
                energyTrading.connect(seller).acceptOffer(1)
            ).to.be.revertedWithCustomError(energyTrading, "UnauthorizedAccess");
        });
    });

    describe("Escrow System", function () {
        it("Should release escrow to seller after delay", async function () {
            const { energyTrading, solarToken, seller, buyer, feeCollector } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const totalPrice = ethers.parseEther("10");
            const deadline = (await time.latest()) + 3600;
            
            // Create and execute trade
            await energyTrading.connect(seller).createOffer(0, energyAmount, pricePerKwh, deadline, "Grid-1", "Solar");
            await energyTrading.connect(buyer).acceptOffer(1);
            
            // Fast forward past escrow delay
            await time.increase(24 * 60 * 60 + 1); // 24 hours + 1 second
            
            const sellerBalanceBefore = await solarToken.balanceOf(seller.address);
            const feeCollectorBalanceBefore = await solarToken.balanceOf(feeCollector.address);
            
            // Release escrow
            await expect(
                energyTrading.releaseEscrow(1)
            ).to.emit(energyTrading, "EscrowReleased");
            
            // Check balances
            const fee = (totalPrice * BigInt(25)) / BigInt(10000); // 0.25% fee
            const sellerAmount = totalPrice - fee;
            
            expect(await solarToken.balanceOf(seller.address)).to.equal(sellerBalanceBefore + sellerAmount);
            expect(await solarToken.balanceOf(feeCollector.address)).to.equal(feeCollectorBalanceBefore + fee);
        });

        it("Should allow buyer to release escrow early", async function () {
            const { energyTrading, solarToken, seller, buyer } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            // Create and execute trade
            await energyTrading.connect(seller).createOffer(0, energyAmount, pricePerKwh, deadline, "Grid-1", "Solar");
            await energyTrading.connect(buyer).acceptOffer(1);
            
            // Buyer releases escrow immediately
            await expect(
                energyTrading.connect(buyer).releaseEscrow(1)
            ).to.emit(energyTrading, "EscrowReleased");
        });
    });

    describe("Dispute System", function () {
        it("Should allow trade participants to initiate dispute", async function () {
            const { energyTrading, seller, buyer } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            // Create and execute trade
            await energyTrading.connect(seller).createOffer(0, energyAmount, pricePerKwh, deadline, "Grid-1", "Solar");
            await energyTrading.connect(buyer).acceptOffer(1);
            
            // Initiate dispute
            await expect(
                energyTrading.connect(buyer).initiateDispute(1, "Quality issues")
            ).to.emit(energyTrading, "DisputeInitiated");
            
            const trade = await energyTrading.trades(1);
            expect(trade.disputeStatus).to.equal(1); // INITIATED
        });

        it("Should allow dispute resolver to resolve disputes", async function () {
            const { energyTrading, solarToken, seller, buyer, disputeResolver } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            // Create and execute trade
            await energyTrading.connect(seller).createOffer(0, energyAmount, pricePerKwh, deadline, "Grid-1", "Solar");
            await energyTrading.connect(buyer).acceptOffer(1);
            
            // Initiate dispute
            await energyTrading.connect(buyer).initiateDispute(1, "Quality issues");
            
            // Resolve dispute in favor of buyer
            await expect(
                energyTrading.connect(disputeResolver).resolveDispute(1, buyer.address, ethers.parseEther("5"))
            ).to.emit(energyTrading, "DisputeResolved");
            
            const trade = await energyTrading.trades(1);
            expect(trade.disputeStatus).to.equal(2); // RESOLVED
        });

        it("Should not allow non-participants to initiate dispute", async function () {
            const { energyTrading, seller, buyer, disputeResolver } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            // Create and execute trade
            await energyTrading.connect(seller).createOffer(0, energyAmount, pricePerKwh, deadline, "Grid-1", "Solar");
            await energyTrading.connect(buyer).acceptOffer(1);
            
            // Non-participant tries to initiate dispute
            await expect(
                energyTrading.connect(disputeResolver).initiateDispute(1, "Quality issues")
            ).to.be.revertedWithCustomError(energyTrading, "UnauthorizedAccess");
        });
    });

    describe("Trading Parameters", function () {
        it("Should allow admin to update trading parameters", async function () {
            const { energyTrading, owner } = await loadFixture(deployEnergyTradingFixture);
            
            const newFeePercentage = 50; // 0.5%
            const newMinAmount = ethers.parseEther("0.5");
            const newMaxAmount = ethers.parseEther("50000");
            const newEscrowDelay = 12 * 60 * 60; // 12 hours
            const newDisputeWindow = 5 * 24 * 60 * 60; // 5 days
            
            await expect(
                energyTrading.setTradingParameters(
                    newFeePercentage,
                    newMinAmount,
                    newMaxAmount,
                    newEscrowDelay,
                    newDisputeWindow
                )
            ).to.emit(energyTrading, "TradingParametersUpdated");
            
            expect(await energyTrading.tradingFeePercentage()).to.equal(newFeePercentage);
            expect(await energyTrading.minimumTradeAmount()).to.equal(newMinAmount);
            expect(await energyTrading.maximumTradeAmount()).to.equal(newMaxAmount);
        });
    });

    describe("View Functions", function () {
        it("Should return active offers", async function () {
            const { energyTrading, seller, buyer } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            // Create multiple offers
            await energyTrading.connect(seller).createOffer(0, energyAmount, pricePerKwh, deadline, "Grid-1", "Solar");
            await energyTrading.connect(buyer).createOffer(1, energyAmount, pricePerKwh, deadline, "Grid-1", "Wind");
            
            const activeOffers = await energyTrading.getActiveOffers(0, 10);
            expect(activeOffers.length).to.equal(2);
        });

        it("Should return user offers", async function () {
            const { energyTrading, seller } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            await energyTrading.connect(seller).createOffer(0, energyAmount, pricePerKwh, deadline, "Grid-1", "Solar");
            
            const userOffers = await energyTrading.getUserOffers(seller.address);
            expect(userOffers.length).to.equal(1);
            expect(userOffers[0]).to.equal(1);
        });

        it("Should return trading statistics", async function () {
            const { energyTrading, seller, buyer } = await loadFixture(deployEnergyTradingFixture);
            
            const energyAmount = ethers.parseEther("100");
            const pricePerKwh = ethers.parseEther("0.1");
            const deadline = (await time.latest()) + 3600;
            
            // Create and execute a trade
            await energyTrading.connect(seller).createOffer(0, energyAmount, pricePerKwh, deadline, "Grid-1", "Solar");
            await energyTrading.connect(buyer).acceptOffer(1);
            
            const stats = await energyTrading.getTradingStats();
            expect(stats.totalTrades).to.equal(1);
            expect(stats.totalVolume).to.equal(energyAmount);
        });
    });

    describe("Security", function () {
        it("Should pause and unpause trading", async function () {
            const { energyTrading, owner, seller } = await loadFixture(deployEnergyTradingFixture);
            
            // Pause trading
            await energyTrading.pauseTrading();
            
            // Should not be able to create offers when paused
            await expect(
                energyTrading.connect(seller).createOffer(
                    0,
                    ethers.parseEther("100"),
                    ethers.parseEther("0.1"),
                    (await time.latest()) + 3600,
                    "Grid-1",
                    "Solar"
                )
            ).to.be.revertedWithCustomError(energyTrading, "EnforcedPause");
            
            // Resume trading
            await energyTrading.resumeTrading();
            
            // Should be able to create offers again
            await expect(
                energyTrading.connect(seller).createOffer(
                    0,
                    ethers.parseEther("100"),
                    ethers.parseEther("0.1"),
                    (await time.latest()) + 3600,
                    "Grid-1",
                    "Solar"
                )
            ).to.not.be.reverted;
        });

        it("Should handle blacklisted users", async function () {
            const { energyTrading, owner, seller } = await loadFixture(deployEnergyTradingFixture);
            
            // Blacklist seller
            await energyTrading.blacklistUser(seller.address);
            
            // Should not be able to create offers when blacklisted
            await expect(
                energyTrading.connect(seller).createOffer(
                    0,
                    ethers.parseEther("100"),
                    ethers.parseEther("0.1"),
                    (await time.latest()) + 3600,
                    "Grid-1",
                    "Solar"
                )
            ).to.be.revertedWithCustomError(energyTrading, "UserIsBlacklisted");
        });
    });
});

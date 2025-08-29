const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const blockchainService = require("../services/BlockchainService");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// Send tokens to another user
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { to, amount, token } = req.body;

    if (!to || !amount) {
      return res.status(400).json({
        success: false,
        error: "Recipient address and amount are required"
      });
    }

    console.log(`💸 Processing token transfer: ${amount} ${token || 'ST'} from user ${user.id} to ${to}`);

    // Execute blockchain transaction
    const result = await blockchainService.transferTokens(
      user.id.toString(),
      to,
      amount
    );

    if (result.success) {
      res.json({
        success: true,
        transaction: {
          hash: result.data.transactionHash,
          from: result.data.from,
          to: result.data.to,
          amount: result.data.amount,
          gasUsed: result.data.gasUsed,
          timestamp: new Date().toISOString()
        },
        message: `Successfully sent ${amount} ST to ${to}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Transaction failed: " + result.error
      });
    }
  } catch (error) {
    console.error("❌ Send transaction error:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Get transaction history for a user
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = req.user;

    // Ensure user can only access their own transactions
    if (user.id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    console.log(`📊 Fetching transaction history for user: ${userId}`);

    // Get wallet data which includes transaction history
    const walletResult = await blockchainService.getUserWallet(userId);

    if (walletResult.success) {
      res.json({
        success: true,
        transactions: walletResult.data.transactions,
        userAddress: walletResult.data.address
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to fetch transactions: " + walletResult.error
      });
    }
  } catch (error) {
    console.error("❌ Transaction history error:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Get specific transaction details
router.get("/details/:txHash", authenticateToken, async (req, res) => {
  try {
    const txHash = req.params.txHash;
    
    console.log(`🔍 Fetching transaction details for: ${txHash}`);

    // In a real implementation, you would query the blockchain for transaction details
    // For now, we'll return a mock response
    res.json({
      success: true,
      transaction: {
        hash: txHash,
        status: "Confirmed",
        blockNumber: "12345",
        confirmations: 12,
        gasUsed: "21000",
        timestamp: new Date().toISOString(),
        message: "Transaction details would be fetched from blockchain"
      }
    });
  } catch (error) {
    console.error("❌ Transaction details error:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Create energy transaction (buy/sell)
router.post("/energy", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { type, offerId, energyAmount, pricePerKwh, location, energySource, duration } = req.body;

    if (!type || (type !== 'buy' && type !== 'sell')) {
      return res.status(400).json({
        success: false,
        error: "Transaction type must be 'buy' or 'sell'"
      });
    }

    console.log(`⚡ Processing energy ${type} transaction for user ${user.id}`);

    let result;

    if (type === 'sell') {
      if (!energyAmount || !pricePerKwh) {
        return res.status(400).json({
          success: false,
          error: "energyAmount and pricePerKwh are required for sell offers"
        });
      }

      result = await blockchainService.createSellOffer(user.id.toString(), {
        energyAmount,
        pricePerKwh,
        duration: duration || 24,
        location: location || "Grid-Zone-A",
        energySource: energySource || "Solar"
      });
    } else if (type === 'buy') {
      if (offerId && energyAmount) {
        // Accept existing offer
        result = await blockchainService.acceptOffer(
          user.id.toString(),
          offerId,
          energyAmount
        );
      } else if (energyAmount && pricePerKwh) {
        // Create buy offer
        result = await blockchainService.createBuyOffer(user.id.toString(), {
          energyAmount,
          pricePerKwh,
          duration: duration || 24,
          location: location || "Grid-Zone-A",
          energySource: energySource || "Any"
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "Either (offerId and energyAmount) or (energyAmount and pricePerKwh) are required for buy transactions"
        });
      }
    }

    if (result.success) {
      res.json({
        success: true,
        transaction: result.data,
        message: `Energy ${type} transaction completed successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Energy ${type} transaction failed: ` + result.error
      });
    }
  } catch (error) {
    console.error("❌ Energy transaction error:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

module.exports = router;

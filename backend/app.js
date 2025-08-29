const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/homescreen", require("./routes/HomeScreen"));
app.use("/api/auth", require("./routes/AuthRoutes"));
app.use("/api/community", require("./routes/CommunityScreenRoutes"));
app.use("/api/wallet", require("./routes/WalletRoutes"));
app.use("/api/energy", require("./routes/EnergyRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/buy", require("./routes/buyRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/goals", require("./routes/goalsRoutes"));
app.use("/api/settings", require("./routes/settingRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/sell", require("./routes/SellRoutes"));

module.exports = app;

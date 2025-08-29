
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// Add fetch for Node.js (if using Node.js < 18)
const fetch = require('node-fetch').default || require('node-fetch');

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

function getJsonData(filename) {
  const filePath = path.join(__dirname, '../../database/jsons/', filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return [];
  }
}

router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const realtimeArr = getJsonData('realtime.json');
  const batteryArr = getJsonData('battery.json');
  const carbonArr = getJsonData('carbon.json');
  const predictionsArr = getJsonData('predictions.json');
  const gridArr = getJsonData('grid.json');        // global
  const weatherArr = getJsonData('weather.json');  // global
  const historicalArr = getJsonData('historical.json'); 
  
  const payload = [
    {
      "deviceId": "DEVICE_001",
      "deviceType": "residential_small",
      "consumption": 500.2,
      "production": 2.1,
      "temperature": 25.5,
      "humidity": 0.6,
      "solarIrradiance": 600.0,
      "windSpeed": 3.2,
      "hour": 24,
      "dayOfWeek": 2,
      "month": 8,
      "isWeekend": false,
      "hasSmartMeter": true,
      "hasSolar": true
    }
  ]
  let energy_predictions = null;
  let pricing_predictions = null;
  
  try {
    if (process.env.AIML_BASE_URL) {
      const response = await fetch(`${process.env.AIML_BASE_URL}/predict/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.user.token || ''}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        energy_predictions = await response.json();
        console.log("Energy Predictions:", energy_predictions);
      } else {
        console.error("AI API response error:", response.status, response.statusText);
      }
    } else {
      console.log("AI_API_URL not configured, skipping AI predictions");
    }
  } catch (error) {
    console.error("Error calling AI API:", error.message);
    energy_predictions = null;
  }

  try {
    if (process.env.AIML_BASE_URL) {
      const response = await fetch(`${process.env.AIML_BASE_URL}/predict/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.user.token || ''}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        pricing_predictions = await response.json();
        console.log("Pricing Predictions:", pricing_predictions);
      } else {
        console.error("AI API response error:", response.status, response.statusText);
      }
    } else {
      console.log("AI_API_URL not configured, skipping AI predictions");
    }
  } catch (error) {
    console.error("Error calling AI API:", error.message);
    pricing_predictions = null;
  }

  console.log("Energy Predictions Result:", energy_predictions);
  console.log("Pricing Predictions Result:", pricing_predictions);
  
  const realTimeMetrics = realtimeArr.find(d => d.userId === userId);

  const battery = batteryArr.find(d => d.userId === userId);

  const carbonFootprint = carbonArr.find(d => d.userId === userId);

  const predictions = predictionsArr.find(d => d.userId === userId);

  const grid = gridArr[0];

  const weather = weatherArr.length > 0 ? weatherArr[0] : {
    location: 'Dhaka',
    temperature: '34°C',
    condition: 'Sunny',
    solarIrradiance: 950,
    prediction: 'High production expected until 4 PM.'
  };

  const historical = historicalArr.find(d => d.userId === userId) || {
    today: [1.2, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 3.8, 3.2, 2.5, 1.8, 1.0],
    week: [25, 28, 22, 30, 27, 29, 31],
    month: [100, 120, 110, 130, 125, 115, 140]
  };

  console.log("Energy Data fetched by user: ", userId);
  console.log("Energy Predictions Result:", energy_predictions);

  // Transform AI predictions into the format frontend expects
  const transformedPredictions = {
    price: pricing_predictions && pricing_predictions.success && pricing_predictions.predictions && pricing_predictions.predictions.length > 0
      ? pricing_predictions.predictions[0] 
      : 15, // fallback value
    energy: energy_predictions && energy_predictions.success && energy_predictions.predictions && energy_predictions.predictions.length > 0
      ? energy_predictions.predictions[0] 
      : 20, // fallback value
    anomalies: "normal", // default or you can add anomaly detection call
    nextHourProduction: energy_predictions && energy_predictions.success && energy_predictions.predictions && energy_predictions.predictions.length > 0
      ? (energy_predictions.predictions[0] * 1.1).toFixed(2) 
      : "22.0" // fallback value
  };

  console.log("Transformed Predictions:", transformedPredictions);

  res.json({
    success: true,
    predictions: transformedPredictions, // Add predictions at root level for frontend
    data: {
      realTimeMetrics,
      battery,
      carbonFootprint,
      predictions: transformedPredictions, // Also keep in data for compatibility
      grid,
      weather,
      historical,
      energyPredictions: energy_predictions
    }
  });
});

module.exports = router;

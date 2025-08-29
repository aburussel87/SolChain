#!/bin/bash

# SolChain Backend + Blockchain Startup Script
# This script starts the blockchain node, deploys contracts, and runs the backend

echo "🌞 Starting SolChain Backend with Blockchain Integration"
echo "======================================================="

# Function to check if a command was successful
check_success() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 completed successfully"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
check_success "Backend dependency installation"

cd ../blockchain
npm install
check_success "Blockchain dependency installation"

# Step 2: Start blockchain node in background
echo "🔗 Starting blockchain node..."
npx hardhat node > hardhat.log 2>&1 &
HARDHAT_PID=$!
echo "Blockchain node started with PID: $HARDHAT_PID"

# Wait for blockchain to start
echo "⏳ Waiting for blockchain to initialize..."
sleep 5

# Step 3: Deploy contracts
echo "📜 Deploying smart contracts..."
npm run deploy:local
check_success "Contract deployment"

# Step 4: Return to backend and start server
cd ../backend
echo "🚀 Starting backend server..."
echo ""
echo "Backend will start on http://localhost:3000"
echo "Blockchain node is running on http://localhost:8545"
echo ""
echo "To stop the blockchain node, run: kill $HARDHAT_PID"
echo ""

# Start the backend
npm run dev

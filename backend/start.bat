@echo off
REM SolChain Backend + Blockchain Startup Script for Windows
REM This script starts the blockchain node, deploys contracts, and runs the backend

echo 🌞 Starting SolChain Backend with Blockchain Integration
echo =======================================================

REM Step 1: Install dependencies
echo 📦 Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

echo 📦 Installing blockchain dependencies...
cd ..\blockchain
call npm install
if errorlevel 1 (
    echo ❌ Blockchain dependency installation failed
    pause
    exit /b 1
)
echo ✅ Blockchain dependencies installed

REM Step 2: Start blockchain node in background
echo 🔗 Starting blockchain node...
start "Hardhat Node" cmd /k "npx hardhat node"

REM Wait for blockchain to start
echo ⏳ Waiting for blockchain to initialize...
timeout /t 10 /nobreak > nul

REM Step 3: Deploy contracts
echo 📜 Deploying smart contracts...
call npm run deploy:local
if errorlevel 1 (
    echo ❌ Contract deployment failed
    pause
    exit /b 1
)
echo ✅ Contracts deployed successfully

REM Step 4: Return to backend and start server
cd ..\backend
echo 🚀 Starting backend server...
echo.
echo Backend will start on http://localhost:3000
echo Blockchain node is running on http://localhost:8545
echo.
echo Press Ctrl+C to stop the backend server
echo Close the "Hardhat Node" window to stop the blockchain
echo.

REM Start the backend
call npm run dev

pause

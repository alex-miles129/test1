@echo off
echo.
echo ================================================================
echo      🚀 TokenEstateX - Quick Start Script
echo ================================================================
echo.

REM Check if we're in the right directory
if not exist package.json (
    echo ❌ Error: package.json not found!
    echo Please run this script from the realtoken-project directory
    pause
    exit /b 1
)

echo ✅ Starting TokenEstateX complete setup...
echo.

REM Kill any existing node processes
echo 🧹 Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Check Node.js version
echo 🔧 Checking Node.js version...
node --version
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js from nodejs.org
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ npm install failed!
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies already installed
)

REM Create .env.local if not exists
if not exist .env.local (
    echo ⚙️ Creating environment configuration...
    echo NEXT_PUBLIC_CHAIN_ID=31337 > .env.local
    echo NEXT_PUBLIC_NETWORK_NAME="Hardhat Local" >> .env.local
    echo ✅ Environment file created
)

echo.
echo ================================================================
echo   🎉 Setup Complete! Now starting TokenEstateX...
echo ================================================================
echo.
echo 📋 INSTRUCTIONS:
echo   1. This will start the blockchain node
echo   2. Wait for "Started HTTP and WebSocket JSON-RPC server"
echo   3. Then open 2 more terminals and run:
echo      Terminal 2: npm run deploy:local
echo      Terminal 3: npm run dev
echo.
echo 🦊 METAMASK SETUP:
echo   Network: Hardhat Local
echo   RPC URL: http://127.0.0.1:8545
echo   Chain ID: 31337
echo   Import Account: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo.
echo ⏰ Starting blockchain in 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Starting Hardhat blockchain node...
echo ⚡ Keep this terminal running!
echo.

REM Start the hardhat node
npm run node
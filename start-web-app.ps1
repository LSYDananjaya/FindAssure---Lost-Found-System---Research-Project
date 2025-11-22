# Start Web Application Script
# This script helps you start both the backend and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Lost & Found - Web Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check if dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "web\node_modules")) {
    Write-Host "Installing web dependencies..." -ForegroundColor Yellow
    Set-Location "web"
    npm install
    Set-Location ".."
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# Check backend dependencies
if (-not (Test-Path "services\ai-question-service\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location "services\ai-question-service"
    npm install
    Set-Location "..\..\"
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Backend dependencies already installed" -ForegroundColor Green
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Backend will start in this window" -ForegroundColor White
Write-Host "2. Open a NEW PowerShell window" -ForegroundColor White
Write-Host "3. Run this command in the new window:" -ForegroundColor White
Write-Host ""
Write-Host '   cd "d:\.SLIIT\RP 2\web" ; npm run dev' -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Your browser will open automatically at http://localhost:5173" -ForegroundColor White
Write-Host ""

Write-Host "Starting backend service..." -ForegroundColor Yellow
Write-Host ""
Set-Location "services\ai-question-service"
npm start

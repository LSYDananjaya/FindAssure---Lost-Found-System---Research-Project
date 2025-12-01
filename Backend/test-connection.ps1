# Test FindAssure Backend Connectivity
Write-Host "Testing FindAssure Backend Connection..." -ForegroundColor Cyan
Write-Host ""

# Test localhost
Write-Host "1. Testing localhost (127.0.0.1:5000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test network IP
Write-Host "2. Testing network IP (192.168.113.106:5000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://192.168.113.106:5000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This likely means Windows Firewall is blocking the connection." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Cyan

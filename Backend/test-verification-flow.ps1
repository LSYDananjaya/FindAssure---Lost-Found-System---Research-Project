# Test Verification Flow with Unified Structure
# This script tests the new verification endpoint with the unified answer structure

Write-Host "Testing Verification Flow with Unified Structure" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Backend URL
$baseUrl = "http://localhost:5000/api"

# Test credentials (you need to have these users in your DB)
$ownerEmail = "owner@test.com"
$ownerPassword = "password123"

Write-Host "`nStep 1: Login as Owner..." -ForegroundColor Yellow

$loginBody = @{
    email = $ownerEmail
    password = $ownerPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit
}

Write-Host "`nStep 2: Get available found items..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $foundItems = Invoke-RestMethod -Uri "$baseUrl/items/found" -Method GET -Headers $headers
    Write-Host "✓ Found $($foundItems.Count) items" -ForegroundColor Green
    
    if ($foundItems.Count -eq 0) {
        Write-Host "No found items available. Please create a found item first." -ForegroundColor Red
        exit
    }
    
    $foundItem = $foundItems[0]
    Write-Host "Using item: $($foundItem.category) - $($foundItem.description.Substring(0, [Math]::Min(50, $foundItem.description.Length)))..." -ForegroundColor Gray
    Write-Host "Questions count: $($foundItem.questions.Count)" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Failed to get found items: $_" -ForegroundColor Red
    exit
}

Write-Host "`nStep 3: Submit verification with unified structure..." -ForegroundColor Yellow

# Build owner answers in the new unified format
$ownerAnswers = @()
for ($i = 0; $i -lt $foundItem.questions.Count; $i++) {
    $ownerAnswers += @{
        questionId = $i
        answer = "Owner's answer for question $($i + 1): This is a test answer"
        videoKey = "default_video_placeholder"
    }
}

$verificationBody = @{
    foundItemId = $foundItem._id
    ownerAnswers = $ownerAnswers
} | ConvertTo-Json -Depth 10

Write-Host "Request body structure:" -ForegroundColor Gray
Write-Host $verificationBody -ForegroundColor Gray

try {
    $verification = Invoke-RestMethod -Uri "$baseUrl/items/verification" -Method POST -Body $verificationBody -ContentType "application/json" -Headers $headers
    Write-Host "✓ Verification created successfully!" -ForegroundColor Green
    Write-Host "Verification ID: $($verification._id)" -ForegroundColor Gray
    Write-Host "Status: $($verification.status)" -ForegroundColor Gray
    Write-Host "Answers count: $($verification.answers.Count)" -ForegroundColor Gray
    
    Write-Host "`nSample answer structure:" -ForegroundColor Yellow
    $verification.answers[0] | ConvertTo-Json | Write-Host -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Verification creation failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Response)" -ForegroundColor Red
    exit
}

Write-Host "`n✓ All tests passed! Unified structure is working correctly." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

# Test script for Claude API
Write-Host "🧪 Testing Claude API Question Generation..." -ForegroundColor Cyan
Write-Host ""

$body = @{
    category = "Electronics"
    description = "Black iPhone 13 Pro with blue case"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/questions/generate" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Generated Questions:" -ForegroundColor Yellow
    Write-Host "===================" -ForegroundColor Yellow
    
    $questionNumber = 1
    foreach ($question in $response.data.questions) {
        Write-Host "$questionNumber. $question" -ForegroundColor White
        $questionNumber++
    }
    
    Write-Host ""
    Write-Host "✅ API is working correctly!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        $errorData = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host $errorData | ConvertTo-Json -Depth 10
    }
}

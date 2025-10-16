# Admin Dashboard API Test Script
# Make sure the dev server is running before executing this script

$baseUrl = "http://localhost:4002"
$adminPhone = "09923182082"
$adminPassword = "Admin@2024Strong"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Admin Dashboard APIs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Admin Login (to get session cookie)
Write-Host "1. Testing Admin Login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/credentials-login" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body (@{ identifier = $adminPhone; password = $adminPassword } | ConvertTo-Json) `
        -SessionVariable session `
        -ErrorAction Stop
    
    Write-Host "✓ Admin login successful" -ForegroundColor Green
    Write-Host "Response: $($loginResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Admin login failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Get Admin Stats
Write-Host "2. Testing GET /api/admin/students (for stats)..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-WebRequest -Uri "$baseUrl/api/admin/students?page=1&pageSize=1" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop
    
    Write-Host "✓ Stats fetched successfully" -ForegroundColor Green
    Write-Host "Response: $($statsResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Stats fetch failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: List Students
Write-Host "3. Testing GET /api/admin/students..." -ForegroundColor Yellow
try {
    $studentsResponse = Invoke-WebRequest -Uri "$baseUrl/api/admin/students?page=1&pageSize=5" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop
    
    $studentsData = $studentsResponse.Content | ConvertFrom-Json
    Write-Host "✓ Students listed successfully" -ForegroundColor Green
    Write-Host "Total Students: $($studentsData.total)" -ForegroundColor Gray
    Write-Host "Page: $($studentsData.page)/$($studentsData.totalPages)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Students list failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: List Reports
Write-Host "4. Testing GET /api/admin/reports..." -ForegroundColor Yellow
try {
    $reportsResponse = Invoke-WebRequest -Uri "$baseUrl/api/admin/reports?status=PENDING&page=1&pageSize=5" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop
    
    $reportsData = $reportsResponse.Content | ConvertFrom-Json
    Write-Host "✓ Reports listed successfully" -ForegroundColor Green
    Write-Host "Total Pending Reports: $($reportsData.total)" -ForegroundColor Gray
    Write-Host "Page: $($reportsData.page)/$($reportsData.totalPages)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Reports list failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 5: List Challenges
Write-Host "5. Testing GET /api/admin/challenges..." -ForegroundColor Yellow
try {
    $challengesResponse = Invoke-WebRequest -Uri "$baseUrl/api/admin/challenges?page=1&pageSize=5" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop
    
    $challengesData = $challengesResponse.Content | ConvertFrom-Json
    Write-Host "✓ Challenges listed successfully" -ForegroundColor Green
    Write-Host "Total Challenges: $($challengesData.total)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Challenges list failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 6: Create a Challenge
Write-Host "6. Testing POST /api/admin/challenges (Create)..." -ForegroundColor Yellow
try {
    $newChallenge = @{
        title = "Test Challenge - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        description = "This is a test challenge created by automated script"
        isActive = $true
        startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        endDate = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
    }
    
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/api/admin/challenges" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body ($newChallenge | ConvertTo-Json) `
        -WebSession $session `
        -ErrorAction Stop
    
    $createdChallenge = ($createResponse.Content | ConvertFrom-Json).challenge
    Write-Host "✓ Challenge created successfully" -ForegroundColor Green
    Write-Host "Challenge ID: $($createdChallenge.id)" -ForegroundColor Gray
    
    # Store for cleanup
    $script:testChallengeId = $createdChallenge.id
} catch {
    Write-Host "✗ Challenge creation failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 7: List Videos
Write-Host "7. Testing GET /api/admin/videos..." -ForegroundColor Yellow
try {
    $videosResponse = Invoke-WebRequest -Uri "$baseUrl/api/admin/videos?page=1&pageSize=5" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop
    
    $videosData = $videosResponse.Content | ConvertFrom-Json
    Write-Host "✓ Videos listed successfully" -ForegroundColor Green
    Write-Host "Total Videos: $($videosData.total)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Videos list failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 8: Create a Video
Write-Host "8. Testing POST /api/admin/videos (Create)..." -ForegroundColor Yellow
try {
    $newVideo = @{
        title = "Test Video - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        category = "Test"
        videoUrl = "https://example.com/test-video.mp4"
    }
    
    $createVideoResponse = Invoke-WebRequest -Uri "$baseUrl/api/admin/videos" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body ($newVideo | ConvertTo-Json) `
        -WebSession $session `
        -ErrorAction Stop
    
    $createdVideo = ($createVideoResponse.Content | ConvertFrom-Json).video
    Write-Host "✓ Video created successfully" -ForegroundColor Green
    Write-Host "Video ID: $($createdVideo.id)" -ForegroundColor Gray
    
    # Store for cleanup
    $script:testVideoId = $createdVideo.id
} catch {
    Write-Host "✗ Video creation failed: $_" -ForegroundColor Red
}

Write-Host ""

# Cleanup: Delete test items
if ($script:testChallengeId) {
    Write-Host "9. Cleaning up: Deleting test challenge..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "$baseUrl/api/admin/challenges/$($script:testChallengeId)" `
            -Method DELETE `
            -WebSession $session `
            -ErrorAction Stop | Out-Null
        Write-Host "✓ Test challenge deleted" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to delete test challenge: $_" -ForegroundColor Red
    }
}

if ($script:testVideoId) {
    Write-Host "10. Cleaning up: Deleting test video..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "$baseUrl/api/admin/videos/$($script:testVideoId)" `
            -Method DELETE `
            -WebSession $session `
            -ErrorAction Stop | Out-Null
        Write-Host "✓ Test video deleted" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to delete test video: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan


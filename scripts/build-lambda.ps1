# PowerShell script for Windows
$ErrorActionPreference = "Stop"

Write-Host "Building Lambda functions..."

# Lambda関数のディレクトリリスト
$LambdaDirs = @(
    "lambda/websocket-connect",
    "lambda/websocket-disconnect",
    "lambda/websocket-join-group",
    "lambda/websocket-leave-group",
    "lambda/websocket-send-message",
    "lambda/broadcast-message"
)

# 各Lambda関数をビルド
foreach ($dir in $LambdaDirs) {
    Write-Host "Building $dir..."
    
    Push-Location $dir
    
    # package.jsonが存在するか確認
    if (-not (Test-Path "package.json")) {
        Write-Error "Error: package.json not found in $dir"
        exit 1
    }
    
    # 依存関係をインストール
    npm install --production=false
    
    # TypeScriptをビルド
    if (Test-Path "tsconfig.json") {
        npm run build
    } else {
        Write-Warning "Warning: tsconfig.json not found in $dir, skipping build"
    }
    
    Pop-Location
}

Write-Host "All Lambda functions built successfully!"


# PowerShell script for Windows
param(
    [string]$Environment = "dev",
    [string]$AwsRegion = $env:AWS_REGION,
    [string]$DatabaseUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"

# 環境変数の確認
if (-not $AwsRegion) {
    Write-Error "Error: AWS_REGION environment variable is not set"
    exit 1
}

if (-not $DatabaseUrl) {
    Write-Error "Error: DATABASE_URL environment variable is not set"
    exit 1
}

$StackName = "websocket-api-$Environment"

Write-Host "Deploying WebSocket API for environment: $Environment"
Write-Host "Stack name: $StackName"

# Lambda関数をビルド
Write-Host "Building Lambda functions..."
# Windows環境ではPowerShellスクリプトを使用
if (Test-Path "scripts/build-lambda.ps1") {
    & powershell -ExecutionPolicy Bypass -File scripts/build-lambda.ps1
} else {
    # Git Bashが利用可能な場合
    & bash scripts/build-lambda.sh
}
if ($LASTEXITCODE -ne 0) {
    Write-Error "Lambda build failed"
    exit 1
}

# SAM CLIがインストールされているか確認
$samCommand = Get-Command sam -ErrorAction SilentlyContinue
if (-not $samCommand) {
    Write-Error "SAM CLI is not installed. Please install it first."
    Write-Host ""
    Write-Host "Installation options:"
    Write-Host "  1. Chocolatey: choco install aws-sam-cli"
    Write-Host "  2. Download installer from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    Write-Host "  3. Python: pip install aws-sam-cli"
    exit 1
}

# SAMビルド
Write-Host "Building SAM application..."
sam build --template-file infrastructure/websocket-api.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Error "SAM build failed"
    exit 1
}

# SAMデプロイ
Write-Host "Deploying SAM application..."
sam deploy `
    --stack-name $StackName `
    --capabilities CAPABILITY_IAM `
    --parameter-overrides "Environment=$Environment" "DatabaseUrl=$DatabaseUrl" `
    --region $AwsRegion `
    --no-confirm-changeset `
    --no-fail-on-empty-changeset

if ($LASTEXITCODE -ne 0) {
    Write-Error "SAM deploy failed"
    exit 1
}

# 出力値を取得
Write-Host "Getting stack outputs..."
$Outputs = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $AwsRegion `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

# WebSocket APIエンドポイントを取得
$WebSocketEndpoint = ($Outputs | Where-Object { $_.OutputKey -eq "WebSocketApiEndpoint" }).OutputValue
$BroadcastLambdaArn = ($Outputs | Where-Object { $_.OutputKey -eq "BroadcastMessageLambdaArn" }).OutputValue

Write-Host ""
Write-Host "Deployment completed successfully!"
Write-Host ""
Write-Host "WebSocket API Endpoint: $WebSocketEndpoint"
Write-Host "Broadcast Lambda ARN: $BroadcastLambdaArn"
Write-Host ""
Write-Host "Please set the following environment variables in AWS Amplify:"
Write-Host "  NEXT_PUBLIC_WEBSOCKET_ENDPOINT=$WebSocketEndpoint"
Write-Host "  BROADCAST_MESSAGE_LAMBDA_ARN=$BroadcastLambdaArn"


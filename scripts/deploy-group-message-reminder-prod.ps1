# PowerShell script for deploying Group Message Reminder Lambda function for PRODUCTION environment

$ErrorActionPreference = "Stop"

Write-Host "Deploying Group Message Reminder Lambda function for PRODUCTION environment..." -ForegroundColor Green

# 環境変数の確認
if (-not $env:DATABASE_URL) {
    Write-Host "Error: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL to production database connection string" -ForegroundColor Yellow
    exit 1
}

if (-not $env:SES_FROM_EMAIL) {
    Write-Host "Error: SES_FROM_EMAIL environment variable is not set" -ForegroundColor Red
    Write-Host "Please set SES_FROM_EMAIL to production SES sender email address" -ForegroundColor Yellow
    exit 1
}

$env:AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-northeast-1" }
$env:ENVIRONMENT = "prod"

Write-Host "Environment: $env:ENVIRONMENT" -ForegroundColor Cyan
Write-Host "AWS Region: $env:AWS_REGION" -ForegroundColor Cyan
Write-Host "SES From Email: $env:SES_FROM_EMAIL" -ForegroundColor Cyan

# 確認プロンプト
$confirm = Read-Host "Are you sure you want to deploy to PRODUCTION? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 1
}

# Lambda関数をビルド
Write-Host "Building Lambda function..." -ForegroundColor Yellow
npm run lambda:build

# SAMビルド
Write-Host "Building SAM template..." -ForegroundColor Yellow
sam build --template-file infrastructure/group-message-reminder.yaml

# SAMデプロイ
Write-Host "Deploying to AWS..." -ForegroundColor Yellow
sam deploy `
  --stack-name group-message-reminder-prod `
  --capabilities CAPABILITY_IAM `
  --parameter-overrides `
    Environment=prod `
    DatabaseUrl="$env:DATABASE_URL" `
    SesFromEmail="$env:SES_FROM_EMAIL" `
  --region "$env:AWS_REGION" `
  --resolve-s3

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Lambda function ARN: Check CloudFormation outputs" -ForegroundColor Cyan
Write-Host "EventBridge Schedules:" -ForegroundColor Cyan
Write-Host "  - prod-group-message-reminder-morning"
Write-Host "  - prod-group-message-reminder-noon"
Write-Host "  - prod-group-message-reminder-evening"
Write-Host "  - prod-group-message-reminder-night"

# PowerShell script for deploying Group Message Reminder Lambda function for STAGING environment

$ErrorActionPreference = "Stop"

Write-Host "Deploying Group Message Reminder Lambda function for STAGING environment..." -ForegroundColor Green

# 環境変数の確認
if (-not $env:DATABASE_URL) {
    Write-Host "Error: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL to staging database connection string" -ForegroundColor Yellow
    exit 1
}

if (-not $env:SES_FROM_EMAIL) {
    Write-Host "Error: SES_FROM_EMAIL environment variable is not set" -ForegroundColor Red
    Write-Host "Please set SES_FROM_EMAIL to staging SES sender email address" -ForegroundColor Yellow
    exit 1
}

$env:AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-northeast-1" }
$env:ENVIRONMENT = "staging"

Write-Host "Environment: $env:ENVIRONMENT" -ForegroundColor Cyan
Write-Host "AWS Region: $env:AWS_REGION" -ForegroundColor Cyan
Write-Host "SES From Email: $env:SES_FROM_EMAIL" -ForegroundColor Cyan

# Lambda関数をビルド
Write-Host "Building Lambda function..." -ForegroundColor Yellow
npm run lambda:build

# SAMビルド
Write-Host "Building SAM template..." -ForegroundColor Yellow
sam build --template-file infrastructure/group-message-reminder.yaml

# SAMデプロイ
Write-Host "Deploying to AWS..." -ForegroundColor Yellow
sam deploy `
  --stack-name group-message-reminder-staging `
  --capabilities CAPABILITY_IAM `
  --parameter-overrides `
    Environment=staging `
    DatabaseUrl="$env:DATABASE_URL" `
    SesFromEmail="$env:SES_FROM_EMAIL" `
  --region "$env:AWS_REGION" `
  --no-confirm-changeset `
  --no-fail-on-empty-changeset

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Lambda function ARN: Check CloudFormation outputs" -ForegroundColor Cyan
Write-Host "EventBridge Schedules:" -ForegroundColor Cyan
Write-Host "  - staging-group-message-reminder-morning"
Write-Host "  - staging-group-message-reminder-noon"
Write-Host "  - staging-group-message-reminder-evening"
Write-Host "  - staging-group-message-reminder-night"

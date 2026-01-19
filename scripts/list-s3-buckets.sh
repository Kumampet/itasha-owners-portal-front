#!/bin/bash
# 既存のS3バケットをリストアップするスクリプト

set -e

PROFILE=${1:-Itanavi-Lambda-Deploy-local}
REGION=${2:-ap-northeast-1}

echo "Listing existing S3 buckets..."
echo "Profile: $PROFILE"
echo "Region: $REGION"
echo ""

# AWS CLIのパスを取得
if command -v aws &> /dev/null; then
  AWS_CMD="aws"
elif [ -f "/c/Program Files/Amazon/AWSCLIV2/aws.exe" ]; then
  AWS_CMD="/c/Program Files/Amazon/AWSCLIV2/aws.exe"
else
  echo "Error: AWS CLI not found"
  exit 1
fi

# バケットをリストアップ
echo "Available S3 buckets:"
"$AWS_CMD" s3 ls --profile "$PROFILE" --region "$REGION" 2>&1 || {
  echo ""
  echo "Failed to list buckets. This may be due to insufficient permissions."
  echo "You can manually specify a bucket name if you know it."
  exit 1
}

echo ""
echo "To use one of these buckets for SAM deployment, run:"
echo "  export SAM_S3_BUCKET=bucket-name"
echo "  npm run lambda:deploy:staging"

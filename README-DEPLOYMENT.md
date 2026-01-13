# WebSocket API デプロイメント

## 概要

このプロジェクトでは、AWS API Gateway WebSocket APIをAWS SAMを使用してデプロイします。

## ローカル環境でのデプロイ

詳細は `docs/websocket-local-deployment.md` を参照してください。

### クイックスタート

```bash
# 環境変数を設定
export AWS_REGION=ap-northeast-1
export DATABASE_URL="your-database-connection-string"
export ENVIRONMENT=dev

# デプロイ実行
npm run websocket:deploy
```

## CI/CDでのデプロイ

mainブランチへのマージ時に自動デプロイされます。

### GitHub Actions設定

`.github/workflows/deploy-websocket.yml` を参照してください。

### 必要なシークレット

GitHubリポジトリのSettings > Secrets and variables > Actionsで以下を設定：

- `AWS_ROLE_TO_ASSUME`: AWS IAMロールのARN（OIDC認証用）
- `AWS_REGION`: AWSリージョン（デフォルト: ap-northeast-1）
- `DATABASE_URL`: RDSデータベース接続文字列

### 手動デプロイ（GitHub Actions）

GitHub Actionsの「Actions」タブから「Deploy WebSocket API」ワークフローを手動実行できます。

## 環境変数の設定

デプロイ後、AWS Amplifyコンソールで以下の環境変数を設定してください：

- `NEXT_PUBLIC_WEBSOCKET_ENDPOINT`: WebSocket APIエンドポイント
- `BROADCAST_MESSAGE_LAMBDA_ARN`: Broadcast Lambda関数のARN

これらの値は、デプロイ完了時に出力されます。

## トラブルシューティング

詳細は `docs/websocket-deployment-guide.md` の「トラブルシューティング」セクションを参照してください。


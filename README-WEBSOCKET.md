# WebSocket実装ガイド

## 概要

このプロジェクトでは、AWS Amplify環境でWebSocket機能を実装するため、AWS API Gateway WebSocket APIを使用しています。

## アーキテクチャ

- **開発環境**: Socket.ioサーバー（`server.ts`）
- **本番環境**: AWS API Gateway WebSocket API + Lambda関数

## ファイル構成

### Lambda関数
- `lambda/websocket-connect/` - WebSocket接続処理
- `lambda/websocket-disconnect/` - WebSocket切断処理
- `lambda/websocket-join-group/` - 団体ルーム参加処理
- `lambda/websocket-leave-group/` - 団体ルーム退出処理
- `lambda/websocket-send-message/` - メッセージ送信処理
- `lambda/broadcast-message/` - メッセージブロードキャスト処理

### インフラストラクチャ
- `infrastructure/websocket-api.yaml` - SAMテンプレート（API Gateway + Lambda + DynamoDB）

### クライアント側
- `src/lib/websocket-amplify.ts` - AWS API Gateway WebSocket API用クライアント
- `src/lib/websocket.ts` - Socket.io用クライアント（開発環境用）

## 環境変数

### クライアント側（Next.js）
- `NEXT_PUBLIC_WEBSOCKET_ENDPOINT`: WebSocket APIエンドポイント

### サーバー側（Lambda）
- `DATABASE_URL`: RDSデータベース接続文字列
- `CONNECTIONS_TABLE`: DynamoDB接続テーブル名
- `GROUP_ROOMS_TABLE`: DynamoDB団体ルームテーブル名
- `WEBSOCKET_API_ENDPOINT`: WebSocket APIエンドポイント（Management API用）

### API Route
- `BROADCAST_MESSAGE_LAMBDA_ARN`: broadcast-message Lambda関数のARN

## デプロイ手順

詳細は `docs/websocket-deployment-guide.md` を参照してください。

## 開発環境での動作

開発環境では、`npm run dev`でSocket.ioサーバーが起動します。

## 本番環境での動作

本番環境（AWS Amplify）では、AWS API Gateway WebSocket APIが使用されます。

## コスト

- **無料枠**: 100万メッセージ/月まで無料
- **超過分**: $1/100万メッセージ
- **接続時間**: 無料


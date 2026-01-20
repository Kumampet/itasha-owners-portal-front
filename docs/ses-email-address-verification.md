# SESメールアドレス検証ガイド

AWS SES（Simple Email Service）でメールアドレスを検証する方法を説明します。

## エラーについて

以下のエラーが発生した場合、送信先のメールアドレスがSESで検証されていません：

```
MessageRejected: Email address is not verified. The following identities failed the check in region AP-NORTHEAST-1: itashaownersnavi@gmail.com
```

## SESサンドボックス環境について

SESのサンドボックス環境では、以下の制限があります：

1. **送信元メールアドレスの検証が必要**
   - 送信元（From）のメールアドレスまたはドメインを検証する必要があります

2. **送信先メールアドレスの検証が必要**
   - 送信先（To）のメールアドレスも検証する必要があります
   - 本番環境に移行すると、この制限は解除されます

## メールアドレスの検証方法

### 方法1: AWS CLIで検証リクエストを送信

```bash
# メールアドレスの検証リクエストを送信
aws ses verify-email-identity \
  --email-address itashaownersnavi@gmail.com \
  --profile admin \
  --region ap-northeast-1
```

### 方法2: AWSコンソールで検証

1. AWS SESコンソールにアクセス
   - https://console.aws.amazon.com/ses/
   - リージョン: `ap-northeast-1`（東京）を選択

2. 「Verified identities」をクリック

3. 「Create identity」をクリック

4. 「Email address」を選択

5. メールアドレスを入力（例: `itashaownersnavi@gmail.com`）

6. 「Create identity」をクリック

7. メールアドレスに送信された確認メールを開く

8. メール内の確認リンクをクリック

9. 検証が完了すると、ステータスが「Verified」になります

## 検証状態の確認

### AWS CLIで確認

```bash
# 検証状態を確認
aws ses get-identity-verification-attributes \
  --identities itashaownersnavi@gmail.com \
  --profile admin \
  --region ap-northeast-1 \
  --output table
```

### 期待される出力

```
----------------------------------------------------------------------------
|                     GetIdentityVerificationAttributes                    |
+--------------------------------------------------------------------------+
||                         VerificationAttributes                         ||
|+------------------------------------------------------------------------+|
|||                    itashaownersnavi@gmail.com                       |||
||+---------------------+------------------------------------------------+||
||| VerificationStatus  |               VerificationToken                ||
||+---------------------+------------------------------------------------+||
|||  Success            |  [検証トークン]                                 |||
||+---------------------+------------------------------------------------+||
```

## 検証メールが届かない場合

1. **迷惑メールフォルダを確認**
   - AWS SESからのメールが迷惑メールに分類されている可能性があります

2. **メールアドレスの確認**
   - 入力したメールアドレスが正しいか確認してください

3. **再送信**
   ```bash
   # 検証メールを再送信
   aws ses verify-email-identity \
     --email-address itashaownersnavi@gmail.com \
     --profile admin \
     --region ap-northeast-1
   ```

4. **検証トークンを手動で設定**
   - DNSレコードを設定して検証することもできますが、メールアドレスの場合は通常メールでの確認が簡単です

## 本番環境への移行

サンドボックス環境の制限を解除するには、AWSサポートにリクエストを送信する必要があります。

### 本番環境への移行リクエスト

1. AWS SESコンソールにアクセス
2. 「Account dashboard」をクリック
3. 「Request production access」をクリック
4. フォームに必要事項を記入：
   - **Mail Type**: Transactional（トランザクションメール）
   - **Website URL**: https://itasha-owners-navi.link
   - **Use case description**: ユーザーに未読メッセージのリマインダーを送信するため
   - **Compliance**: 必要に応じて記入
5. 「Submit」をクリック

### 本番環境移行のメリット

- 送信先メールアドレスの検証が不要
- 送信量の制限が緩和される（1日あたり最大200,000通）
- 送信速度の制限が緩和される（1秒あたり最大14通）

### 本番環境移行の注意点

- スパムやバウンス率が高いと、アカウントが一時停止される可能性があります
- 適切なメール送信プラクティスに従う必要があります

## テスト用メールアドレスの検証

テスト用のメールアドレス（例: `itashaownersnavi@gmail.com`）を検証する場合：

```bash
# テスト用メールアドレスの検証
aws ses verify-email-identity \
  --email-address itashaownersnavi@gmail.com \
  --profile admin \
  --region ap-northeast-1
```

検証メールが届いたら、メール内のリンクをクリックして検証を完了してください。

## 関連ドキュメント

- [SES Email Address Verification](https://docs.aws.amazon.com/ses/latest/dg/verify-email-addresses.html)
- [SESサンドボックス環境](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)

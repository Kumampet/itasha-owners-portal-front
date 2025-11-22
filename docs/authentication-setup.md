# 認証設定ガイド

このアプリケーションはGoogleアカウントとX（Twitter）アカウントでのログインをサポートしています。

## 必要な環境変数

`.env.local`ファイルをプロジェクトルート（`package.json`と同じディレクトリ）に作成し、以下の環境変数を設定してください：

```env
# Database
DATABASE_URL="mysql://user:password@host:port/database"

# NextAuth.js
AUTH_SECRET="your-secret-key-here"
# または
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"

# Twitter/X OAuth
TWITTER_CLIENT_ID="abcdefghijklmnopqrstuvwxyz123456"
TWITTER_CLIENT_SECRET="abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnop"
```

**重要**:
- `.env.local`ファイルは`.gitignore`に含まれているため、Gitにコミットされません
- 値は必ずダブルクォート（`"`）で囲んでください
- 値の前後に空白や改行を入れないでください
- 環境変数を変更したら、開発サーバーを再起動してください

## Google OAuth設定手順（詳細）

### ステップ1: Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成または既存のプロジェクトを選択
3. プロジェクト名を入力（例: "Itasha Owners Portal"）

### ステップ2: OAuth同意画面を設定

**重要**: OAuth同意画面を設定しないと認証が失敗します。

1. 左側メニューから「APIとサービス」→「OAuth同意画面」を選択
2. ユーザータイプを選択：
   - **外部**: 一般ユーザーがアクセス可能（推奨）
   - **内部**: Google Workspace内のみ
3. 「作成」をクリック
4. アプリ情報を入力：
   - **アプリ名**: 痛車オーナーズポータル（任意）
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **デベロッパーの連絡先情報**: あなたのメールアドレス
5. 「保存して次へ」をクリック
6. スコープ画面で「保存して次へ」をクリック（デフォルトでOK）
7. テストユーザー画面で「保存して次へ」をクリック（本番環境では不要）
8. 概要画面で「ダッシュボードに戻る」をクリック

### ステップ3: OAuth 2.0 クライアント IDを作成

1. 「APIとサービス」→「認証情報」に移動
2. 上部の「+ 認証情報を作成」→「OAuth 2.0 クライアント ID」を選択
3. アプリケーションの種類を「ウェブアプリケーション」に設定
4. **名前**を入力（例: "Itasha Portal Web Client"）
5. **承認済みの JavaScript 生成元**に以下を追加：
   - 開発環境: `http://localhost:3000`
   - 本番環境: `https://main.da1pjhpif1fug.amplifyapp.com`（AmplifyのURLに置き換えてください）
6. **承認済みのリダイレクト URI**に以下を追加（**重要**）：
   - 開発環境: `http://localhost:3000/api/auth/callback/google`
   - 本番環境: `https://main.da1pjhpif1fug.amplifyapp.com/api/auth/callback/google`（AmplifyのURLに置き換えてください）
   - **注意**: 
     - 末尾のスラッシュ（`/`）は不要です
     - 本番環境のURLは実際のAmplifyアプリのURLに置き換えてください
     - 複数の環境がある場合は、すべてのURLを追加してください
7. 「作成」をクリック
8. **クライアントID**と**クライアントシークレット**が表示されます
   - これらをコピーして環境変数に設定してください

### ステップ4: 環境変数を設定

`.env.local`ファイルに以下を追加：

```env
GOOGLE_CLIENT_ID="あなたのクライアントID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="あなたのクライアントシークレット"
```

**注意事項**:
- クライアントIDとクライアントシークレットは完全にコピーしてください（前後の空白や改行がないこと）
- 環境変数名は大文字小文字を区別します
- `.env.local`ファイルを変更したら、開発サーバーを再起動してください

### ステップ5: 環境変数の確認

環境変数が正しく読み込まれているか確認するには、一時的に以下のコードを追加して確認できます：

```typescript
// 一時的な確認用（本番環境では削除すること）
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "設定済み" : "未設定");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "設定済み" : "未設定");
```

**注意**: この確認後は必ず削除してください。シークレット情報をログに出力しないでください。

### ステップ6: 動作確認

1. 開発サーバーを再起動: `npm run dev`
2. ブラウザで `http://localhost:3000/app/auth` にアクセス
3. 「Googleでログイン」ボタンをクリック
4. Googleの認証画面が表示されれば成功です

### よくあるエラーと対処法

- **エラー 401: invalid_client**
  - ✅ 環境変数が正しく設定されているか確認（`.env.local`ファイルがプロジェクトルートにあるか）
  - ✅ `.env.local`ファイルの値に余分な空白や改行がないか確認（特にクォートの有無）
  - ✅ 開発サーバーを再起動（環境変数の変更は再起動が必要）
  - ✅ クライアントIDとクライアントシークレットが正しいか確認（Google Cloud Consoleから再確認）
  - ✅ 環境変数名が正確か確認（`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`）
  - ✅ `.env.local`ファイルの形式が正しいか確認（`KEY="value"`の形式）

- **リダイレクトURI不一致エラー**
  - ✅ Google Cloud Consoleの「承認済みのリダイレクト URI」に正確なURLが登録されているか確認
  - ✅ `http://localhost:3000/api/auth/callback/google` が正確に登録されているか確認（末尾のスラッシュなし）
  - ✅ プロトコル（`http://`）が正しいか確認
  - ✅ ポート番号（`:3000`）が正しいか確認

- **OAuth同意画面が設定されていない**
  - ✅ Google Cloud Consoleで「OAuth同意画面」が設定されているか確認
  - ✅ テストユーザーが追加されているか確認（開発環境の場合）

## X（Twitter）OAuth設定手順（詳細）

### ステップ1: Twitter Developer Portalにアクセス

1. [Twitter Developer Portal](https://developer.twitter.com/)にアクセス
2. Twitterアカウントでログイン
3. 開発者アカウントの申請が必要な場合は申請を完了

### ステップ2: プロジェクトとアプリを作成

1. 左側メニューから「Projects & Apps」を選択
2. 「Create Project」をクリック
3. プロジェクト名を入力（例: "Itasha Owners Portal"）
4. 「Use case」を選択（例: "Making a bot" または "Exploring the API"）
5. 「Next」をクリック
6. アプリ名を入力（例: "Itasha Portal Web App"）
7. 「Complete」をクリック

### ステップ3: User authentication settingsを設定

1. 作成したアプリを選択
2. 「Settings」タブをクリック
3. 「User authentication settings」セクションで「Set up」をクリック
4. 以下の設定を行います：
   - **App permissions**: `Read` を選択
   - **Type of App**: `Web App` を選択
   - **App info**:
     - **App name**: 痛車オーナーズポータル（任意）
     - **Website URL**: 
       - 開発環境: `http://localhost:3000`
       - 本番環境: `https://your-domain.com`
   - **Callback URI / Redirect URL**（**重要**）:
     - 開発環境: `http://localhost:3000/api/auth/callback/twitter`
     - 本番環境: `https://your-domain.com/api/auth/callback/twitter`
     - **注意**: 末尾のスラッシュ（`/`）は不要です
   - **Website URL**: 上記と同じURL
5. 「Save」をクリック

### ステップ4: Client ID and Client Secretを生成

1. 「Keys and tokens」タブをクリック
2. 「OAuth 2.0 Client ID and Client Secret」セクションで「Generate」をクリック
3. **Client ID**と**Client Secret**が表示されます
   - **重要**: Client Secretは一度しか表示されません。必ずコピーして安全に保管してください
4. これらをコピーして環境変数に設定してください

### ステップ5: 環境変数を設定

`.env.local`ファイルに以下を追加：

```env
TWITTER_CLIENT_ID="あなたのクライアントID"
TWITTER_CLIENT_SECRET="あなたのクライアントシークレット"
```

**注意事項**:
- Client IDとClient Secretは完全にコピーしてください（前後の空白や改行がないこと）
- Client Secretは一度しか表示されないため、紛失した場合は再生成が必要です
- 環境変数名は大文字小文字を区別します
- `.env.local`ファイルを変更したら、開発サーバーを再起動してください

### ステップ6: 環境変数の確認

環境変数が正しく読み込まれているか確認するには、一時的に以下のコードを追加して確認できます：

```typescript
// 一時的な確認用（本番環境では削除すること）
console.log("TWITTER_CLIENT_ID:", process.env.TWITTER_CLIENT_ID ? "設定済み" : "未設定");
console.log("TWITTER_CLIENT_SECRET:", process.env.TWITTER_CLIENT_SECRET ? "設定済み" : "未設定");
```

**注意**: この確認後は必ず削除してください。シークレット情報をログに出力しないでください。

### ステップ7: 動作確認

1. 開発サーバーを再起動: `npm run dev`
2. ブラウザで `http://localhost:3000/app/auth` にアクセス
3. 「X（Twitter）でログイン」ボタンをクリック
4. Twitterの認証画面が表示されれば成功です

### よくあるエラーと対処法

- **エラー 401: invalid_client**
  - ✅ 環境変数が正しく設定されているか確認（`.env.local`ファイルがプロジェクトルートにあるか）
  - ✅ `.env.local`ファイルの値に余分な空白や改行がないか確認（特にクォートの有無）
  - ✅ 開発サーバーを再起動（環境変数の変更は再起動が必要）
  - ✅ Client IDとClient Secretが正しいか確認（Twitter Developer Portalから再確認）
  - ✅ 環境変数名が正確か確認（`TWITTER_CLIENT_ID`、`TWITTER_CLIENT_SECRET`）
  - ✅ `.env.local`ファイルの形式が正しいか確認（`KEY="value"`の形式）

- **リダイレクトURI不一致エラー**
  - ✅ Twitter Developer Portalの「Callback URI / Redirect URL」に正確なURLが登録されているか確認
  - ✅ `http://localhost:3000/api/auth/callback/twitter` が正確に登録されているか確認（末尾のスラッシュなし）
  - ✅ プロトコル（`http://`）が正しいか確認
  - ✅ ポート番号（`:3000`）が正しいか確認

- **Client Secretが見つからない**
  - ✅ Client Secretは一度しか表示されません
  - ✅ 紛失した場合は「Keys and tokens」タブで「Regenerate」をクリックして再生成してください
  - ✅ 再生成後、環境変数も更新してください

## AUTH_SECRETの生成

以下のコマンドでランダムなシークレットを生成できます：

```bash
openssl rand -base64 32
```

または、Node.jsを使用する場合：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## トラブルシューティング

### 環境変数が読み込まれない場合

1. `.env.local`ファイルがプロジェクトルートにあるか確認
2. ファイル名が正確か確認（`.env.local`、`.env`ではない）
3. 環境変数の形式が正しいか確認（`KEY="value"`）
4. 開発サーバーを再起動（`Ctrl+C`で停止してから`npm run dev`で再起動）

### 認証エラーが発生する場合

1. **Google OAuth**
   - Google Cloud ConsoleでOAuth同意画面が設定されているか確認
   - 承認済みのリダイレクトURIが正確に設定されているか確認
   - クライアントIDとクライアントシークレットが正しいか確認

2. **Twitter OAuth**
   - Twitter Developer PortalでUser authentication settingsが設定されているか確認
   - Callback URIが正確に設定されているか確認
   - Client IDとClient Secretが正しいか確認

### デバッグ方法

一時的に以下のコードを`src/auth.ts`の先頭に追加して、環境変数が読み込まれているか確認できます：

```typescript
// デバッグ用（本番環境では削除すること）
if (process.env.NODE_ENV === "development") {
  console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✓ 設定済み" : "✗ 未設定");
  console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✓ 設定済み" : "✗ 未設定");
  console.log("TWITTER_CLIENT_ID:", process.env.TWITTER_CLIENT_ID ? "✓ 設定済み" : "✗ 未設定");
  console.log("TWITTER_CLIENT_SECRET:", process.env.TWITTER_CLIENT_SECRET ? "✓ 設定済み" : "✗ 未設定");
}
```

**注意**: このデバッグコードは本番環境にデプロイする前に必ず削除してください。

## AWS Amplifyでの環境変数設定

Amplifyコンソールで以下の環境変数を設定してください：

- `DATABASE_URL`
- `AUTH_SECRET` または `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `NEXTAUTH_URL`（オプション、Amplifyでは自動検出されますが、明示的に設定することも可能）

設定場所: Amplify Console → App settings → Environment variables

**重要**: 
- 本番環境のリダイレクトURIもAmplifyのURLに合わせてGoogle Cloud ConsoleとTwitter Developer Portalで設定してください
- 本番環境のURL例: `https://main.da1pjhpif1fug.amplifyapp.com`
- Google Cloud Consoleの「承認済みのリダイレクト URI」に以下を追加:
  - `https://main.da1pjhpif1fug.amplifyapp.com/api/auth/callback/google`
- Twitter Developer Portalの「Callback URI / Redirect URL」に以下を追加:
  - `https://main.da1pjhpif1fug.amplifyapp.com/api/auth/callback/twitter`


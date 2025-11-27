/**
 * ローカル環境でLambda関数をテストするスクリプト
 * 
 * 使用方法:
 * 1. .env.local ファイルを作成して環境変数を設定
 * 2. npm run test を実行
 * 
 * または:
 * node test-local.js
 */

import { handler } from './index.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// .env.local ファイルを読み込む
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// プロジェクトルートの .env.local を読み込む
const envPath = join(__dirname, '../../.env.local');
const result = dotenv.config({ path: envPath });

// デバッグ情報
console.log('=== Lambda関数ローカルテスト ===');
console.log('.env.local ファイルパス:', envPath);
if (result.error) {
  console.warn('警告: .env.local ファイルの読み込みに失敗しました:', result.error.message);
  console.warn('プロジェクトルートに .env.local ファイルが存在するか確認してください。');
} else {
  console.log('.env.local ファイルを読み込みました');
}

// 環境変数を設定（.env.local から読み込まれる）
// ローカル環境のデフォルト値を設定
if (!process.env.NOTIFY_API_URL) {
  process.env.NOTIFY_API_URL = 'http://localhost:3000/api/reminders/notify';
  console.warn('NOTIFY_API_URL が設定されていません。デフォルト値（ローカル）を使用します。');
}

console.log('NOTIFY_API_URL:', process.env.NOTIFY_API_URL);
console.log('REMINDER_NOTIFY_API_KEY:', process.env.REMINDER_NOTIFY_API_KEY ? `設定済み（長さ: ${process.env.REMINDER_NOTIFY_API_KEY.length}）` : '未設定');
if (!process.env.REMINDER_NOTIFY_API_KEY) {
  console.warn('警告: REMINDER_NOTIFY_API_KEY が設定されていません。');
  console.warn('プロジェクトルートの .env.local に以下を追加してください:');
  console.warn('  REMINDER_NOTIFY_API_KEY=your-api-key-here');
}
console.log('');

// テストイベント
// 実際のリマインダーIDを指定するか、データベースに存在するリマインダーIDを使用してください
const testEvent = {
  reminderId: process.argv[2] || 'test-reminder-id-local' // コマンドライン引数でリマインダーIDを指定可能
};

if (testEvent.reminderId === 'test-reminder-id-local') {
  console.warn('警告: テスト用のリマインダーIDを使用しています。');
  console.warn('実際のリマインダーIDを指定する場合は、以下のように実行してください:');
  console.warn('  npm run test <実際のリマインダーID>');
  console.warn('例: npm run test clx1234567890abcdef');
  console.warn('');
}

// Lambda関数を実行
handler(testEvent)
  .then((result) => {
    console.log('');
    console.log('=== 実行結果 ===');
    console.log(JSON.stringify(result, null, 2));

    // 404エラーの場合は、認証は成功しているがリマインダーが見つからない
    const body = JSON.parse(result.body);
    if (body.error && body.error.includes('404')) {
      console.log('');
      console.log('✅ 認証は成功しています（401エラーが発生していません）');
      console.log('⚠️  リマインダーが見つかりませんでした。');
      console.log('   実際のリマインダーIDを指定してテストしてください:');
      console.log('   npm run test <実際のリマインダーID>');
    } else if (result.statusCode === 200) {
      console.log('');
      console.log('✅ テスト成功！通知が正常に送信されました。');
    }

    process.exit(result.statusCode === 200 ? 0 : 1);
  })
  .catch((error) => {
    console.error('');
    console.error('=== エラー ===');
    console.error(error);
    process.exit(1);
  });


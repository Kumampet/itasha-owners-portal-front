/**
 * NextAuth.jsのセッションをクリアするスクリプト
 * AUTH_SECRETが変更された場合など、古いセッションを削除するために使用
 */

// 環境変数を読み込む（.env と .env.local の両方から）
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require("dotenv");
import path from "path";

// .env ファイルを読み込む（存在する場合）
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// .env.local ファイルを読み込む（存在する場合、後から読み込んだ値が優先される）
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: false });

import { prisma } from "@/lib/prisma";

async function clearSessions() {
  try {
    console.log("🗑️  NextAuth.jsのセッションをクリア中...");

    // セッションテーブルをクリア
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`✅ ${deletedSessions.count}件のセッションを削除しました`);

    // アカウントテーブルもクリア（必要に応じて）
    // const deletedAccounts = await prisma.account.deleteMany({});
    // console.log(`✅ ${deletedAccounts.count}件のアカウントを削除しました`);

    // 検証トークンテーブルもクリア（必要に応じて）
    // const deletedTokens = await prisma.verificationToken.deleteMany({});
    // console.log(`✅ ${deletedTokens.count}件の検証トークンを削除しました`);

    console.log("✨ セッションのクリアが完了しました");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearSessions();


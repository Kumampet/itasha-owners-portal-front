/**
 * NextAuth.jsのセッションをクリアするスクリプト
 * AUTH_SECRETが変更された場合など、古いセッションを削除するために使用
 */

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


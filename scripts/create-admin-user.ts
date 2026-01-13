import { prisma } from "../src/lib/prisma";

async function main() {
  const email = "kumampet@gmail.com";

  // 既存ユーザーを確認
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // 既存ユーザーを管理者に更新
    await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
      },
    });
    console.log(`既存ユーザーを管理者に更新しました: ${email}`);
    console.log(`注意: このユーザーはGoogleまたはX認証でログインする必要があります。`);
  } else {
    console.error(`エラー: メールアドレス ${email} で登録されているユーザーが見つかりません。`);
    console.error(`まず、一般アプリでGoogleまたはX認証でログインしてから、このスクリプトを実行してください。`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


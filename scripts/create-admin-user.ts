import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = "kumampet@gmail.com";
  const password = "dass0707?";
  const hashedPassword = await bcrypt.hash(password, 10);

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
        password: hashedPassword,
      },
    });
    console.log(`既存ユーザーを管理者に更新しました: ${email}`);
  } else {
    // 新規ユーザーを作成
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ADMIN",
        name: "管理者",
      },
    });
    console.log(`管理者ユーザーを作成しました: ${email}`);
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


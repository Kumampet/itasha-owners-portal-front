import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = "kumampet@gmail.com";
  const password = "dass0707?";

  console.log("=== 管理者ユーザー確認 ===");
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
      is_organizer: true,
      must_change_password: true,
    },
  });

  if (!user) {
    console.log("❌ ユーザーが見つかりません");
    return;
  }

  console.log("✅ ユーザーが見つかりました");
  console.log("ID:", user.id);
  console.log("Email:", user.email);
  console.log("Name:", user.name);
  console.log("Role:", user.role);
  console.log("Is Organizer:", user.is_organizer);
  console.log("Must Change Password:", user.must_change_password);
  console.log("Password exists:", !!user.password);
  console.log("Password length:", user.password?.length || 0);

  if (user.password) {
    // パスワードの検証テスト
    const isValid = await bcrypt.compare(password, user.password);
    console.log("Password verification:", isValid ? "✅ 正しい" : "❌ 間違っている");
    
    if (!isValid) {
      console.log("\n=== パスワード再設定を試みます ===");
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: "ADMIN",
        },
      });
      console.log("✅ パスワードを再設定しました");
      
      // 再度検証
      const updatedUser = await prisma.user.findUnique({
        where: { email },
        select: { password: true },
      });
      if (updatedUser?.password) {
        const isValidAfterUpdate = await bcrypt.compare(password, updatedUser.password);
        console.log("Password verification after update:", isValidAfterUpdate ? "✅ 正しい" : "❌ 間違っている");
      }
    }
  } else {
    console.log("\n=== パスワードが設定されていません。設定します ===");
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log("✅ パスワードを設定しました");
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


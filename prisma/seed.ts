import { prisma } from "../src/lib/prisma";

// ユーザーが提供したイベントデータ
const seedEvents = [
  {
    name: "未来の痛車イベント #1",
    theme: "Next-Gen Showcase",
    description:
      "最新デザインの痛車とコラボブースが集結。エントリー枠が少ないため事前リマインダー推奨。",
    original_url: "https://example.com/events/future-1",
    event_date: new Date("2025-06-01T09:00:00+09:00"),
    entry_start_at: new Date("2025-03-15T21:00:00+09:00"),
    payment_due_at: new Date("2025-05-10T23:59:00+09:00"),
    approval_status: "APPROVED",
  },
  {
    name: "過去の痛車ミーティング",
    theme: "Retro Painters",
    description:
      "クラシックモデル中心の小規模ミーティング。遠征勢の併せ募集が盛ん。",
    original_url: "https://example.com/events/retro-meetup",
    event_date: new Date("2024-11-12T10:00:00+09:00"),
    entry_start_at: new Date("2024-09-01T12:00:00+09:00"),
    payment_due_at: new Date("2024-10-25T23:59:00+09:00"),
    approval_status: "APPROVED",
  },
];

async function main() {
  console.info("⏳ Seeding database with demo events...");

  // 1. ユーザー（主催者）の作成と取得
  // イベントデータに必要な organizer_user_id を確保するため
  const organizerUser = await prisma.user.upsert({
    where: { email: "organizer@itasha-portal.com" },
    update: {},
    create: {
      email: "organizer@itasha-portal.com",
      is_organizer: true,
      role: "ADMIN",
      custom_profile_url: "organizer",
    },
  });

  // 2. イベントデータの投入
  for (const eventData of seedEvents) {
    // 主催者IDをイベントデータに追加 (リレーションを満たすため)
    const eventWithOrganizer = {
      ...eventData,
      organizer_user_id: organizerUser.id,
    };

    // Prismaモデル名 'Event' を使用して upsert を実行
    await prisma.event.upsert({
      where: { original_url: eventData.original_url },
      update: eventWithOrganizer,
      create: eventWithOrganizer,
    });
  }

  // 3. 実行結果の確認
  const createdEvents = await prisma.event.findMany({
    where: { original_url: { in: seedEvents.map(e => e.original_url) } },
  });

  console.info(`✅ Seeded ${createdEvents.length} events.`);
}

main()
  .catch((error) => {
    console.error("❌ Failed to seed database", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

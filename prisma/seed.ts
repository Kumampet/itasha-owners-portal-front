/**
 * ローカル／検証用サンプルデータ投入（現行 Prisma スキーマに準拠）
 *
 * 前提: DATABASE_URL（`.env` / `.env.local` に記載するか、シェルで export）
 * 件数: 環境変数 SEED_EVENT_COUNT（既定 30）
 *
 * 実行: npm run db:seed
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import type { Prisma, PrismaClient } from "@prisma/client";

// Next.js と同様に .env のあと .env.local で上書き（このファイルより先に prisma を import しない）
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

const DESCRIPTION_MAX = 200;

const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const cities = [
  "中央区", "港区", "新宿区", "渋谷区", "世田谷区", "横浜市", "名古屋市", "大阪市", "福岡市", "札幌市",
];

const venueNames = [
  "幕張メッセ", "東京ビッグサイト", "インテックス大阪", "ポートメッセなごや", "パシフィコ横浜",
];

const eventNameTemplates = [
  "痛車フェス {n}",
  "痛車ミーティング {n}",
  "痛車祭 {n}",
  "痛車ショー {n}",
  "痛車ナイト {n}",
];

const descriptionTemplates = [
  "最新の痛車デザインが集まるイベントです。エントリーは先着順です。",
  "遠征・併せ歓迎のミーティング形式。撮影エリアあり。",
  "初心者から上級者まで参加可能な交流イベントです。",
  "展示と物販を中心とした大規模フェス。駐車場は事前予約推奨。",
];

const tagNames = ["痛車", "オフ会", "展示", "撮影", "遠征歓迎", "初心者OK", "コスプレ", "物販"];

const GROUP_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomElement<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function truncateDescription(text: string): string {
  if (text.length <= DESCRIPTION_MAX) return text;
  return text.slice(0, DESCRIPTION_MAX - 1) + "…";
}

function randomFutureDate(daysFromNow: number, daysRange: number): Date {
  const now = new Date();
  const days = daysFromNow + Math.floor(Math.random() * daysRange);
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
  return date;
}

async function uniqueGroupCode(db: PrismaClient): Promise<string> {
  for (let attempt = 0; attempt < 80; attempt++) {
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += GROUP_CODE_CHARS[Math.floor(Math.random() * GROUP_CODE_CHARS.length)]!;
    }
    const existing = await db.group.findUnique({ where: { group_code: code } });
    if (!existing) return code;
  }
  throw new Error("group_code の生成に失敗しました");
}

async function clearEventGraph(db: PrismaClient) {
  await db.groupMessageRead.deleteMany({});
  await db.groupMessageReaction.deleteMany({});
  await db.groupMessage.deleteMany({});
  await db.userGroup.deleteMany({});
  await db.group.deleteMany({});
  await db.userEvent.deleteMany({});
  await db.eventFollow.deleteMany({});
  await db.eventTag.deleteMany({});
  await db.reminder.deleteMany({});
  await db.eventEntry.deleteMany({});
  await db.event.deleteMany({});
  await db.tag.deleteMany({});
}

async function main(db: PrismaClient) {
  const eventCount = Math.min(
    500,
    Math.max(1, parseInt(process.env.SEED_EVENT_COUNT || "30", 10) || 30)
  );

  console.info("⏳ イベント関連の既存データを削除しています…");
  await clearEventGraph(db);
  console.info("✅ 削除完了");

  const organizer = await db.user.upsert({
    where: { email: "organizer@itasha-portal.com" },
    update: { role: "ADMIN", display_name: "ローカル主催者" },
    create: {
      email: "organizer@itasha-portal.com",
      role: "ADMIN",
      custom_profile_url: "local-organizer",
      display_name: "ローカル主催者",
    },
  });

  const driverA = await db.user.upsert({
    where: { email: "local.driver.a@example.com" },
    update: { display_name: "サンプルドライバーA" },
    create: {
      email: "local.driver.a@example.com",
      role: "USER",
      custom_profile_url: "local-driver-a",
      display_name: "サンプルドライバーA",
    },
  });

  const driverB = await db.user.upsert({
    where: { email: "local.driver.b@example.com" },
    update: { display_name: "サンプルドライバーB" },
    create: {
      email: "local.driver.b@example.com",
      role: "USER",
      custom_profile_url: "local-driver-b",
      display_name: "サンプルドライバーB",
    },
  });

  const leader = await db.user.upsert({
    where: { email: "local.group.leader@example.com" },
    update: { display_name: "団体リーダー" },
    create: {
      email: "local.group.leader@example.com",
      role: "USER",
      custom_profile_url: "local-group-leader",
      display_name: "団体リーダー",
    },
  });

  for (const u of [organizer, driverA, driverB, leader]) {
    await db.userNotificationSettings.upsert({
      where: { user_id: u.id },
      update: {},
      create: {
        user_id: u.id,
        browser_notification_enabled: false,
        email_notification_enabled: true,
        group_message_unread_notification_enabled: true,
      },
    });
  }

  const tags = await Promise.all(
    tagNames.map((name) =>
      db.tag.create({
        data: { name, usage_count: 1 },
      })
    )
  );

  const emptyUrls = [] as Prisma.InputJsonValue;
  const approvalStatuses = ["DRAFT", "PENDING", "APPROVED"] as const;
  const createdEventIds: string[] = [];

  console.info(`⏳ イベント ${eventCount} 件とエントリー枠を作成しています…`);

  for (let i = 1; i <= eventCount; i++) {
    const name = randomElement(eventNameTemplates).replace("{n}", String(i));
    const eventDate = randomFutureDate(7, 400);
    const entryStartAt = new Date(eventDate);
    entryStartAt.setDate(entryStartAt.getDate() - 21);
    const paymentDueAt = new Date(eventDate);
    paymentDueAt.setDate(paymentDueAt.getDate() - 7);

    const event = await db.event.create({
      data: {
        name,
        description: truncateDescription(randomElement(descriptionTemplates)),
        event_date: eventDate,
        approval_status: randomElement([...approvalStatuses]),
        prefecture: randomElement(prefectures),
        city: randomElement(cities),
        venue_name: Math.random() > 0.25 ? randomElement(venueNames) : null,
        postal_code: Math.random() > 0.35 ? `${100 + Math.floor(Math.random() * 800)}-${1000 + Math.floor(Math.random() * 9000)}` : null,
        street_address: Math.random() > 0.3 ? `${1 + Math.floor(Math.random() * 4)}丁目${1 + Math.floor(Math.random() * 15)}番` : null,
        official_urls: emptyUrls,
        keywords: ["痛車", "イベント"] as Prisma.InputJsonValue,
        created_by_user_id: organizer.id,
        entry_selection_method: "FIRST_COME",
        max_participants: Math.random() > 0.5 ? 50 + Math.floor(Math.random() * 200) : null,
        entries: {
          create: [
            {
              entry_number: 1,
              entry_start_at: entryStartAt,
              entry_deadline_at: new Date(eventDate.getTime() - 86400000 * 3),
              payment_due_at: paymentDueAt,
              payment_due_type: "ABSOLUTE",
            },
          ],
        },
      },
    });
    createdEventIds.push(event.id);
  }

  const approvedIds = (
    await db.event.findMany({
      where: { id: { in: createdEventIds }, approval_status: "APPROVED" },
      select: { id: true },
    })
  ).map((e: { id: string }) => e.id);

  const graphBaseIds = approvedIds.length > 0 ? approvedIds : createdEventIds;

  console.info("⏳ タグ・フォロー・参加・団体・メッセージを作成しています…");

  for (const eventId of graphBaseIds) {
    const tagPick = [...tags].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
    for (const tag of tagPick) {
      await db.eventTag.create({
        data: { event_id: eventId, tag_id: tag.id },
      });
    }
  }

  const followTargets = graphBaseIds.slice(0, Math.min(12, graphBaseIds.length));
  for (const eventId of followTargets) {
    await db.eventFollow.create({
      data: { user_id: driverA.id, event_id: eventId },
    });
  }

  const participateIds = graphBaseIds.slice(0, Math.min(8, graphBaseIds.length));
  for (const eventId of participateIds) {
    await db.userEvent.create({
      data: {
        user_id: driverA.id,
        event_id: eventId,
        status: "INTERESTED",
      },
    });
    await db.userEvent.create({
      data: {
        user_id: driverB.id,
        event_id: eventId,
        status: "INTERESTED",
      },
    });
  }

  if (graphBaseIds.length >= 2) {
    const e1 = graphBaseIds[0]!;
    const e2 = graphBaseIds[1]!;

    const group1 = await db.group.create({
      data: {
        event_id: e1,
        name: "ローカルテスト団体アルファ",
        theme: "アニメ",
        max_members: 20,
        leader_user_id: leader.id,
        group_code: await uniqueGroupCode(db),
        group_description: "シード用のテスト団体です。",
      },
    });

    const group2 = await db.group.create({
      data: {
        event_id: e2,
        name: "ローカルテスト団体ベータ",
        theme: "ゲーム",
        max_members: 15,
        leader_user_id: leader.id,
        group_code: await uniqueGroupCode(db),
      },
    });

    await db.userGroup.createMany({
      data: [
        { user_id: leader.id, group_id: group1.id, event_id: e1, status: "JOINED" },
        { user_id: driverA.id, group_id: group1.id, event_id: e1, status: "JOINED" },
        { user_id: driverB.id, group_id: group1.id, event_id: e1, status: "INTERESTED" },
        { user_id: leader.id, group_id: group2.id, event_id: e2, status: "JOINED" },
        { user_id: driverA.id, group_id: group2.id, event_id: e2, status: "INTERESTED" },
      ],
    });

    await db.userEvent.upsert({
      where: { user_id_event_id: { user_id: leader.id, event_id: e1 } },
      create: {
        user_id: leader.id,
        event_id: e1,
        group_id: group1.id,
        status: "INTERESTED",
      },
      update: { group_id: group1.id },
    });
    await db.userEvent.updateMany({
      where: { user_id: driverA.id, event_id: e1 },
      data: { group_id: group1.id },
    });
    await db.userEvent.upsert({
      where: { user_id_event_id: { user_id: leader.id, event_id: e2 } },
      create: {
        user_id: leader.id,
        event_id: e2,
        group_id: group2.id,
        status: "INTERESTED",
      },
      update: { group_id: group2.id },
    });

    const msg1 = await db.groupMessage.create({
      data: {
        group_id: group1.id,
        sender_id: leader.id,
        content: "ローカルシードからのテストメッセージです。募集概要は追って共有します。",
        is_announcement: true,
      },
    });

    await db.groupMessage.create({
      data: {
        group_id: group1.id,
        sender_id: driverA.id,
        content: "参加よろしくお願いします！",
        is_announcement: false,
      },
    });

    await db.groupMessageRead.create({
      data: { message_id: msg1.id, user_id: driverA.id },
    });

    await db.groupMessageReaction.create({
      data: { message_id: msg1.id, user_id: driverA.id, emoji: "👍" },
    });

    const firstReminderEvent = participateIds[0];
    if (firstReminderEvent) {
      const ev = await db.event.findUnique({
        where: { id: firstReminderEvent },
        select: { id: true, name: true, event_date: true },
      });
      if (ev) {
        await db.reminder.create({
          data: {
            user_id: driverA.id,
            event_id: ev.id,
            reminder_data: {
              type: "event_date",
              datetime: ev.event_date.toISOString(),
              label: "イベント開催日",
              event_id: ev.id,
              event_name: ev.name,
            },
          },
        });
      }
    }
  }

  const [eventTotal, tagTotal, groupTotal] = await Promise.all([
    db.event.count(),
    db.tag.count(),
    db.group.count(),
  ]);

  console.info("✅ シード完了");
  console.info(`   イベント: ${eventTotal} / タグ: ${tagTotal} / 団体: ${groupTotal}`);
  console.info("   ユーザー（upsert）: organizer@itasha-portal.com, local.driver.a@example.com, local.driver.b@example.com, local.group.leader@example.com");
}

function printDbConnectionHints(err: unknown) {
  const msg = err instanceof Error ? `${err.message} ${err.cause ?? ""}` : String(err);
  if (
    msg.includes("pool timeout") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("45028")
  ) {
    console.error(
      "\n--- MySQL 接続のヒント ---\n" +
        "・DB が起動しているか: docker compose -f docker-compose.mysql.yml up -d\n" +
        "・DATABASE_URL のホストは localhost より 127.0.0.1 を推奨（IPv6 の差で繋がらないことがあります）\n" +
        "・初回は: npx prisma migrate deploy\n" +
        "・起動直後だけ遅い場合: .env に DATABASE_CONNECT_TIMEOUT_MS=30000\n" +
        "・MySQL Workbench で同じ接続情報が使えるか確認\n"
    );
  }
}

void (async () => {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      "DATABASE_URL が設定されていません。\n" +
        "プロジェクトルートに `.env` または `.env.local` を作成し、例えば次の 1 行を書いてください。\n\n" +
        'DATABASE_URL="mysql://itasha:itasha_local_dev@127.0.0.1:3306/itasha_local"\n'
    );
    process.exit(1);
  }

  const { prisma } = await import("../src/lib/prisma");
  try {
    await prisma.$connect();
    await main(prisma);
  } catch (error) {
    console.error("❌ シードに失敗しました", error);
    printDbConnectionHints(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();

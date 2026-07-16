/**
 * ローカル／検証用サンプルデータ投入（SQLite/Drizzle版）
 *
 * 実行: npm run db:seed
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  events,
  eventEntries,
  groups,
  groupMessages,
  groupMessageReads,
  groupMessageReactions,
  tags,
  eventTags,
  eventFollows,
  eventSubmissions,
  reminders,
  userNotificationSettings,
  pushSubscriptions,
  contactSubmissions,
  organizerApplications,
  userEvents,
  userGroups,
} from "../src/db/schema";
import { createSampleEventsWithEntries } from "../src/lib/seed-sample-events";

// Next.js と同様に .env のあと .env.local で上書き
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

const SEED_DEFAULT_ADMIN_EMAIL = "itashaownersnavi@gmail.com";
const tagNames = ["痛車", "オフ会", "展示", "撮影", "遠征歓迎", "初心者OK", "コスプレ", "物販"];
const GROUP_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function uniqueGroupCode(drizzleDb: typeof db): Promise<string> {
  for (let attempt = 0; attempt < 80; attempt++) {
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += GROUP_CODE_CHARS[Math.floor(Math.random() * GROUP_CODE_CHARS.length)]!;
    }
    const existing = await drizzleDb
      .select()
      .from(groups)
      .where(eq(groups.groupCode, code))
      .get();
    if (!existing) return code;
  }
  throw new Error("group_code の生成に失敗しました");
}

async function clearEventGraph(drizzleDb: typeof db) {
  // 外部キーの依存を考慮し、末尾テーブルから削除
  await drizzleDb.delete(groupMessageReads);
  await drizzleDb.delete(groupMessageReactions);
  await drizzleDb.delete(groupMessages);
  await drizzleDb.delete(userGroups);
  await drizzleDb.delete(groups);
  await drizzleDb.delete(userEvents);
  await drizzleDb.delete(eventFollows);
  await drizzleDb.delete(eventTags);
  await drizzleDb.delete(reminders);
  await drizzleDb.delete(eventEntries);
  await drizzleDb.delete(events);
  await drizzleDb.delete(tags);
}

// ユーザーの upsert ヘルパー
async function upsertUser(
  drizzleDb: typeof db,
  id: string,
  email: string,
  role: string,
  customProfileUrl: string,
  displayName: string
) {
  const existing = await drizzleDb
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existing) {
    await drizzleDb
      .update(users)
      .set({ role, displayName, updatedAt: new Date().toISOString() })
      .where(eq(users.email, email));
    return existing;
  } else {
    const newUser = {
      id,
      email,
      role,
      customProfileUrl,
      displayName,
      isBanned: false,
      isProfilePublic: false,
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await drizzleDb.insert(users).values(newUser);
    return newUser;
  }
}

// 通知設定の upsert ヘルパー
async function upsertNotificationSettings(drizzleDb: typeof db, userId: string) {
  const existing = await drizzleDb
    .select()
    .from(userNotificationSettings)
    .where(eq(userNotificationSettings.userId, userId))
    .get();

  if (!existing) {
    await drizzleDb.insert(userNotificationSettings).values({
      id: crypto.randomUUID(),
      userId,
      browserNotificationEnabled: false,
      emailNotificationEnabled: true,
      groupMessageUnreadNotificationEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

async function main(drizzleDb: typeof db) {
  const eventCount = Math.min(
    500,
    Math.max(1, parseInt(process.env.SEED_EVENT_COUNT || "50", 10) || 50)
  );

  console.info("⏳ イベント関連の既存データを削除しています…");
  await clearEventGraph(drizzleDb);
  console.info("✅ 削除完了");

  const organizer = await upsertUser(
    drizzleDb,
    crypto.randomUUID(),
    "organizer@itasha-portal.com",
    "ADMIN",
    "local-organizer",
    "ローカル主催者"
  );

  const defaultAdminGoogle = await upsertUser(
    drizzleDb,
    crypto.randomUUID(),
    SEED_DEFAULT_ADMIN_EMAIL,
    "ADMIN",
    "itashaownersnavi-admin",
    "管理者（Google）"
  );

  const driverA = await upsertUser(
    drizzleDb,
    crypto.randomUUID(),
    "local.driver.a@example.com",
    "USER",
    "local-driver-a",
    "サンプルドライバーA"
  );

  const driverB = await upsertUser(
    drizzleDb,
    crypto.randomUUID(),
    "local.driver.b@example.com",
    "USER",
    "local-driver-b",
    "サンプルドライバーB"
  );

  const leader = await upsertUser(
    drizzleDb,
    crypto.randomUUID(),
    "local.group.leader@example.com",
    "USER",
    "local-group-leader",
    "団体リーダー"
  );

  for (const u of [organizer, defaultAdminGoogle, driverA, driverB, leader]) {
    await upsertNotificationSettings(drizzleDb, u.id);
  }

  const createdTags: any[] = [];
  for (const name of tagNames) {
    const tagId = crypto.randomUUID();
    await drizzleDb.insert(tags).values({
      id: tagId,
      name,
      usageCount: 1,
    });
    createdTags.push({ id: tagId, name });
  }

  console.info(`⏳ イベント ${eventCount} 件とエントリー枠を作成しています…`);
  const createdEventIds = await createSampleEventsWithEntries(drizzleDb, {
    count: eventCount,
    createdByUserId: organizer.id,
    nameNumberStart: 1,
  });

  // 複数日開催・開催中サンプル
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(Date.now() + jstOffset);
  const todayJST = new Date(new Date(Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate())).getTime() - jstOffset);
  const yesterdayJST = new Date(todayJST.getTime() - 86400000);
  const dayAfterTomorrowJST = new Date(todayJST.getTime() + 2 * 86400000);

  const ongoingEventId = crypto.randomUUID();
  await drizzleDb.insert(events).values({
    id: ongoingEventId,
    name: "【サンプル】全国痛車オーナーズフェスタ（複数日開催・開催中）",
    description: "複数日開催イベントの「開催中」バッジ確認用サンプルデータです。昨日から始まり明後日まで開催されます。",
    eventDate: yesterdayJST.toISOString(),
    eventEndDate: dayAfterTomorrowJST.toISOString(),
    isMultiDay: true,
    approvalStatus: "APPROVED",
    prefecture: "東京都",
    city: "江東区",
    venueName: "東京ビッグサイト",
    officialUrls: JSON.stringify([]),
    keywords: JSON.stringify(["痛車", "複数日", "開催中"]),
    createdByUserId: organizer.id,
    entrySelectionMethod: "FIRST_COME",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  createdEventIds.push(ongoingEventId);

  // 承認済みイベントの抽出
  const approvedEvents = await drizzleDb
    .select({ id: events.id })
    .from(events)
    .where(eq(events.approvalStatus, "APPROVED"));
  const approvedIds = approvedEvents.map((e: any) => e.id);
  const graphBaseIds = approvedIds.length > 0 ? approvedIds : createdEventIds;

  console.info("⏳ タグ・フォロー・参加・団体・メッセージを作成しています…");

  for (const eventId of graphBaseIds) {
    const tagPick = [...createdTags].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
    for (const tag of tagPick) {
      await drizzleDb.insert(eventTags).values({
        eventId,
        tagId: tag.id,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const followTargets = graphBaseIds.slice(0, Math.min(12, graphBaseIds.length));
  for (const eventId of followTargets) {
    await drizzleDb.insert(eventFollows).values({
      userId: driverA.id,
      eventId,
      followedAt: new Date().toISOString(),
    });
  }

  const participateIds = graphBaseIds.slice(0, Math.min(8, graphBaseIds.length));
  for (const eventId of participateIds) {
    await drizzleDb.insert(userEvents).values({
      userId: driverA.id,
      eventId,
      status: "INTERESTED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await drizzleDb.insert(userEvents).values({
      userId: driverB.id,
      eventId,
      status: "INTERESTED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  if (graphBaseIds.length >= 2) {
    const e1 = graphBaseIds[0]!;
    const e2 = graphBaseIds[1]!;

    const group1Id = crypto.randomUUID();
    const group1Code = await uniqueGroupCode(drizzleDb);
    await drizzleDb.insert(groups).values({
      id: group1Id,
      eventId: e1,
      name: "ローカルテスト団体アルファ",
      theme: "アニメ",
      maxMembers: 20,
      leaderUserId: leader.id,
      groupCode: group1Code,
      groupDescription: "シード用のテスト団体です。",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const group2Id = crypto.randomUUID();
    const group2Code = await uniqueGroupCode(drizzleDb);
    await drizzleDb.insert(groups).values({
      id: group2Id,
      eventId: e2,
      name: "ローカルテスト団体ベータ",
      theme: "ゲーム",
      maxMembers: 15,
      leaderUserId: leader.id,
      groupCode: group2Code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await drizzleDb.insert(userGroups).values([
      { userId: leader.id, groupId: group1Id, eventId: e1, status: "JOINED", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { userId: driverA.id, groupId: group1Id, eventId: e1, status: "JOINED", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { userId: driverB.id, groupId: group1Id, eventId: e1, status: "INTERESTED", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { userId: leader.id, groupId: group2Id, eventId: e2, status: "JOINED", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { userId: driverA.id, groupId: group2Id, eventId: e2, status: "INTERESTED", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ]);

    // userEvents の更新 (leader の group_id 紐付け)
    const existingLeaderEvent1 = await drizzleDb.select().from(userEvents).where(eq(userEvents.userId, leader.id)).where(eq(userEvents.eventId, e1)).get();
    if (existingLeaderEvent1) {
      await drizzleDb.update(userEvents).set({ groupId: group1Id }).where(eq(userEvents.userId, leader.id)).where(eq(userEvents.eventId, e1));
    } else {
      await drizzleDb.insert(userEvents).values({
        userId: leader.id,
        eventId: e1,
        groupId: group1Id,
        status: "INTERESTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await drizzleDb.update(userEvents).set({ groupId: group1Id }).where(eq(userEvents.userId, driverA.id)).where(eq(userEvents.eventId, e1));

    const existingLeaderEvent2 = await drizzleDb.select().from(userEvents).where(eq(userEvents.userId, leader.id)).where(eq(userEvents.eventId, e2)).get();
    if (existingLeaderEvent2) {
      await drizzleDb.update(userEvents).set({ groupId: group2Id }).where(eq(userEvents.userId, leader.id)).where(eq(userEvents.eventId, e2));
    } else {
      await drizzleDb.insert(userEvents).values({
        userId: leader.id,
        eventId: e2,
        groupId: group2Id,
        status: "INTERESTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const msg1Id = crypto.randomUUID();
    await drizzleDb.insert(groupMessages).values({
      id: msg1Id,
      groupId: group1Id,
      senderId: leader.id,
      content: "ローカルシードからのテストメッセージです。募集概要は追って共有します。",
      isAnnouncement: true,
      createdAt: new Date().toISOString(),
    });

    await drizzleDb.insert(groupMessages).values({
      id: crypto.randomUUID(),
      groupId: group1Id,
      senderId: driverA.id,
      content: "参加よろしくお願いします！",
      isAnnouncement: false,
      createdAt: new Date().toISOString(),
    });

    await drizzleDb.insert(groupMessageReads).values({
      id: crypto.randomUUID(),
      messageId: msg1Id,
      userId: driverA.id,
      readAt: new Date().toISOString(),
    });

    await drizzleDb.insert(groupMessageReactions).values({
      id: crypto.randomUUID(),
      messageId: msg1Id,
      userId: driverA.id,
      emoji: "👍",
      createdAt: new Date().toISOString(),
    });

    const firstReminderEvent = participateIds[0];
    if (firstReminderEvent) {
      const ev = await drizzleDb
        .select({ id: events.id, name: events.name, eventDate: events.eventDate })
        .from(events)
        .where(eq(events.id, firstReminderEvent))
        .get();
      if (ev) {
        await drizzleDb.insert(reminders).values({
          id: crypto.randomUUID(),
          userId: driverA.id,
          eventId: ev.id,
          reminderData: JSON.stringify({
            type: "event_date",
            datetime: ev.eventDate,
            label: "イベント開催日",
            event_id: ev.id,
            event_name: ev.name,
          }),
          notified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // カウント集計
  const [{ count: eventTotal }] = await drizzleDb.select({ count: sql`count(*)` }).from(events);
  const [{ count: tagTotal }] = await drizzleDb.select({ count: sql`count(*)` }).from(tags);
  const [{ count: groupTotal }] = await drizzleDb.select({ count: sql`count(*)` }).from(groups);

  console.info("✅ シード完了");
  console.info(`   イベント: ${eventTotal} / タグ: ${tagTotal} / 団体: ${groupTotal}`);
  console.info(
    `   ユーザー: organizer@itasha-portal.com, ${SEED_DEFAULT_ADMIN_EMAIL}（ADMIN）, local.driver.a@example.com, local.driver.b@example.com, local.group.leader@example.com`
  );
}

void (async () => {
  try {
    await main(db);
  } catch (error) {
    console.error("❌ シードに失敗しました", error);
    process.exitCode = 1;
  }
})();

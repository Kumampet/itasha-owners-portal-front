import { prisma } from "../src/lib/prisma";

// 日本の都道府県リスト
const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

// 市区町村のサンプル
const cities = [
  "中央区", "港区", "新宿区", "渋谷区", "世田谷区", "品川区", "大田区",
  "目黒区", "杉並区", "練馬区", "北区", "板橋区", "足立区", "葛飾区",
  "江戸川区", "横浜市", "川崎市", "相模原市", "千葉市", "さいたま市",
  "名古屋市", "京都市", "大阪市", "神戸市", "福岡市", "仙台市", "札幌市"
];

// 会場名のサンプル
const venueNames = [
  "幕張メッセ", "東京ビッグサイト", "インテックス大阪", "ポートメッセなごや",
  "幕張海浜公園", "お台場", "横浜赤レンガ倉庫", "さいたまスーパーアリーナ",
  "名古屋港ガーデンふ頭", "神戸ポートアイランド", "福岡国際センター",
  "パシフィコ横浜", "東京ドーム", "代々木公園", "駒沢オリンピック公園",
  "調布市グリーンホール", "川崎市産業振興会館", "千葉ポートパーク",
  "船橋アリーナ", "柏の葉アリーナ", "つくばエキスポセンター"
];

// イベント名のテンプレート
const eventNameTemplates = [
  "痛車フェス {number}",
  "痛車ミーティング {number}",
  "痛車イベント {number}",
  "痛車祭 {number}",
  "痛車パレード {number}",
  "痛車ショー {number}",
  "痛車カスタムフェス {number}",
  "痛車コレクション {number}",
  "痛車ワールド {number}",
  "痛車エキスポ {number}",
  "痛車グランプリ {number}",
  "痛車ナイト {number}",
  "痛車サミット {number}",
  "痛車コンテスト {number}",
  "痛車ラリー {number}"
];

// テーマのサンプル
const themes = [
  "アニメ", "ゲーム", "VTuber", "アイドル", "声優", "アニソン",
  "痛車カスタム", "コスプレ", "同人誌", "フィギュア", "グッズ",
  "音楽", "ダンス", "ライブ", "トークショー", "サイン会",
  "撮影会", "展示会", "即売会", "交流会", "オフ会"
];

// 説明文のテンプレート
const descriptionTemplates = [
  "最新の痛車デザインとコラボブースが集結する大規模イベントです。エントリー枠が少ないため事前リマインダー推奨。",
  "クラシックモデル中心の小規模ミーティング。遠征勢の併せ募集が盛んに行われます。",
  "痛車愛好家が集まる交流イベント。展示エリアと撮影エリアを設けています。",
  "全国から痛車オーナーが集結する大型イベント。各種コンテストも開催予定。",
  "痛車カスタムの技術を競うコンテスト形式のイベント。審査員による厳正な審査が行われます。",
  "初心者から上級者まで楽しめる痛車イベント。ワークショップやセミナーも開催。",
  "痛車とコスプレのコラボイベント。撮影会やサイン会も同時開催予定。",
  "痛車オーナー同士の交流を目的としたオフ会形式のイベント。",
  "最新の痛車カスタム技術を紹介する展示会。メーカー展示ブースも多数。",
  "痛車文化を広めるための啓蒙イベント。一般の方も参加可能です。"
];

// ランダムな要素を選択する関数
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// ランダムな日付を生成（未来の日付）
function randomFutureDate(daysFromNow: number = 0, daysRange: number = 365): Date {
  const now = new Date();
  const days = daysFromNow + Math.floor(Math.random() * daysRange);
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
  return date;
}

// ランダムな郵便番号を生成
function randomPostalCode(): string {
  return `${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ランダムな番地を生成
function randomStreetAddress(): string {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const chome = Math.floor(1 + Math.random() * 5);
  const banchi = Math.floor(1 + Math.random() * 20);
  return `${chome}丁目${banchi}番${randomElement(numbers)}号`;
}

// 100個のイベントデータを生成
function generateEvents(count: number) {
  const events = [];
  const usedUrls = new Set<string>();

  for (let i = 1; i <= count; i++) {
    const eventName = randomElement(eventNameTemplates).replace("{number}", String(i));
    const baseUrl = `https://example.com/events/${i}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    let originalUrl = baseUrl;
    let urlCounter = 1;
    
    // ユニークなURLを生成
    while (usedUrls.has(originalUrl)) {
      originalUrl = `${baseUrl}-${urlCounter}`;
      urlCounter++;
    }
    usedUrls.add(originalUrl);

    const eventDate = randomFutureDate(7, 365);
    const entryStartAt = randomFutureDate(-30, 60);
    const paymentDueAt = new Date(eventDate);
    paymentDueAt.setDate(paymentDueAt.getDate() - 7);

    const prefecture = randomElement(prefectures);
    const city = randomElement(cities);
    const venueName = randomElement(venueNames);

    events.push({
      name: eventName,
      theme: randomElement(themes),
      description: randomElement(descriptionTemplates),
      original_url: originalUrl,
      event_date: eventDate,
      entry_start_at: entryStartAt < eventDate ? entryStartAt : null,
      payment_due_at: paymentDueAt < eventDate ? paymentDueAt : null,
      postal_code: Math.random() > 0.3 ? randomPostalCode() : null,
      prefecture: prefecture,
      city: city,
      street_address: Math.random() > 0.2 ? randomStreetAddress() : null,
      venue_name: Math.random() > 0.3 ? venueName : null,
      official_urls: [],
      approval_status: randomElement(["DRAFT", "PENDING", "APPROVED", "REJECTED"]),
    });
  }

  return events;
}

async function main() {
  console.info("⏳ 既存のイベントデータを削除中...");

  // 関連テーブルからも削除（外部キー制約のため順序が重要）
  await prisma.eventTag.deleteMany({});
  await prisma.eventFollow.deleteMany({});
  await prisma.userEvent.deleteMany({});
  await prisma.groupMessage.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.reminder.deleteMany({});
  
  // イベントデータを削除
  const deletedCount = await prisma.event.deleteMany({});
  console.info(`✅ ${deletedCount.count}件のイベントを削除しました。`);

  console.info("⏳ 100個のサンプルイベントを生成中...");

  // イベント登録者ユーザーを取得または作成
  const createdByUser = await prisma.user.upsert({
    where: { email: "organizer@itasha-portal.com" },
    update: {},
    create: {
      email: "organizer@itasha-portal.com",
      role: "ADMIN",
      custom_profile_url: "organizer",
    },
  });

  // 100個のイベントデータを生成
  const events = generateEvents(100);

  // イベントを一括作成
  let createdCount = 0;
  for (const eventData of events) {
    try {
      await prisma.event.create({
        data: {
          ...eventData,
          created_by_user_id: createdByUser.id,
        },
      });
      createdCount++;
    } catch (error) {
      console.error(`❌ イベント作成エラー: ${eventData.name}`, error);
    }
  }

  console.info(`✅ ${createdCount}個のイベントを作成しました。`);

  // 作成結果を確認
  const totalEvents = await prisma.event.count();
  console.info(`📊 データベース内のイベント総数: ${totalEvents}件`);
}

main()
  .catch((error) => {
    console.error("❌ データベースのシード処理に失敗しました", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

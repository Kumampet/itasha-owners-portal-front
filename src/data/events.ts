export type EventInfo = {
  slug: string;
  name: string;
  location: string;
  date: string;
  entryStart: string;
  entryDeadline: string;
  description: string;
  summary: string;
  tags: string[];
  coverImage: string;
  officialUrl: string;
  xUrl?: string;
  isFollowed?: boolean;
  isRegistered?: boolean;
};

export const mockEvents: EventInfo[] = [
  {
    slug: "itasha-fes-odaiba-2025",
    name: "痛GふぇすたNEXT in お台場 2025",
    location: "東京都 お台場特設会場",
    date: "2025-03-16",
    entryStart: "2024-12-01",
    entryDeadline: "2025-02-10",
    description:
      "国内最大級の痛車イベント。エントリー開始直後の枠争奪戦を避けるため、自動リマインド必須。併せ募集も活発。",
    summary:
      "エントリー枠争いが激しいため、気になるイベントに登録しておくことでプッシュ通知とメールで機会損失を防ぐ。",
    tags: ["大型", "屋外", "撮影可"],
    coverImage:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    officialUrl: "https://example.com/itasha-fes-odaiba-2025",
    xUrl: "https://x.com/itasha_fes",
    isFollowed: true,
    isRegistered: true,
  },
  {
    slug: "cosplay-road-trip-kyoto",
    name: "痛車×コスプレ巡礼 in 京都嵐山",
    location: "京都府 嵐山エリア",
    date: "2025-04-26",
    entryStart: "2025-01-05",
    entryDeadline: "2025-03-31",
    description:
      "京都の観光地を巡る痛車パレード企画。定員が少ないため、早期エントリーが推奨。",
    summary:
      "観光地コースのため、駐車枠が限られる小規模イベント。気になるリストに入れて枠確保を狙う。",
    tags: ["小規模", "交流", "関西"],
    coverImage:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
    officialUrl: "https://example.com/cosplay-road-trip-kyoto",
    xUrl: "https://x.com/kyoto_itasha",
    isFollowed: true,
  },
  {
    slug: "local-meetup-tokachi",
    name: "十勝痛車ミーティング",
    location: "北海道 帯広市 特設駐車場",
    date: "2025-05-10",
    entryStart: "2025-02-01",
    entryDeadline: "2025-04-20",
    description:
      "地元ショップ主催の地域密着型イベント。初参加でも歓迎されるアットホームさが魅力。",
    summary:
      "遠征組のための併せ機能や、現地ショップ情報を共有予定。気になる登録で最新情報を逃さない。",
    tags: ["ローカル", "北海道", "初心者歓迎"],
    coverImage:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
    officialUrl: "https://example.com/local-meetup-tokachi",
  },
];



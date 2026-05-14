/** トップ／about で共有するサービス概要文言 */
export type ServiceOverviewItem = {
  /** アンカー用（ASCII） */
  id: string;
  title: string;
  /** トップの概要カード用（短縮） */
  summary: string;
  /** about 詳細ページ用本文（段落単位） */
  detailParagraphs: string[];
};

export const SERVICE_OVERVIEW_ITEMS = [
  {
    id: "owner-portal",
    title: "無料で利用できる痛車オーナーのためのポータルサイト",
    summary:
      "イベント情報の確認や、イベント参加時の団体管理などを無料でサポート。自分だけのリマインダーでイベントに関わる締め切りも管理できます。",
    detailParagraphs: [
      "イベント情報の確認や、イベント参加時の団体管理などを無料でサポートします！自分だけのリマインダー機能でイベントに関わる締め切りも管理できます。\n\n次に参加したいイベントを見つけたり、参加するイベントで団体を組むときのコミュニケーションの支援を提供します。",
    ],
  },
  {
    id: "event-catalog",
    title: "どこよりもたくさんのイベントを掲載",
    summary:
      "日本全国の痛車イベントをくまなく掲載しています。みなさまからの情報提供もお待ちしております。イベント掲載も無料です。",
    detailParagraphs: [
      "日本全国の痛車イベントをくまなく掲載中です。イベントの規模に関わらず情報を掲載しています。\nまた、みなさまからの情報提供もお待ちしております。イベント掲載はもちろん無料です。\nイベントの掲載は<a href=\"/app/event-submission\">イベント掲載依頼</a>フォームからご依頼ください。",
    ],
  },
  {
    id: "quiet-platform",
    title: "競争のない静かなプラットフォーム",
    summary:
      "痛車オーナーの痛車ライフを支えるためのインフラとしての機能を提供します。",
    detailParagraphs: [
      "当サービスは痛車オーナーの痛車ライフを支えるためのインフラとしての機能を提供します。",
    ],
  },
  {
    id: "organizer",
    title: "イベント主催者向け機能も提供",
    summary:
      "イベント主催者アカウントへの申請で権限を付与いたします。ご自身が運営するイベントを自ら掲載することもできます。",
    detailParagraphs: [
      "イベント主催者アカウントも申請いただければ権限を付与いたします。ご自身が運営するイベントを自ら掲載することも可能です。\n\nご希望の方は<a href=\"/app/contact\">お問い合わせ</a>フォームからご依頼ください。",
    ],
  },
] as const satisfies readonly ServiceOverviewItem[];

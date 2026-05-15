export type SiteNavIconKey =
  | "events"
  | "about"
  | "event-submission"
  | "contact";

/** ドロワー用 SVG（公開ナビと同一キー） */
export type SiteNavDrawerIconKey = SiteNavIconKey;

export type SiteNavItem = {
  href: string;
  label: string;
  key: string;
  /** スマホドロワー用 SVG（{@link SiteNavDrawerIcon}） */
  icon: SiteNavIconKey;
};

/** オーガナイザー管理画面のパス・ラベル（マイページのカードからのみ遷移） */
export const SITE_NAV_ORGANIZER_ITEM: {
  href: string;
  label: string;
  key: string;
} = {
  href: "/admin/dashboard",
  label: "オーガナイザー機能",
  key: "admin",
};

/**
 * ヘッダー／スマホドロワーに出すグローバルナビ（公開導線のみ）
 */
export const SITE_NAV_ITEMS: SiteNavItem[] = [
  { href: "/events", label: "イベント一覧", key: "events", icon: "events" },
  { href: "/about", label: "サービス概要", key: "about", icon: "about" },
  {
    href: "/app/event-submission",
    label: "イベント掲載依頼",
    key: "event-submission",
    icon: "event-submission",
  },
  { href: "/app/contact", label: "お問い合わせ", key: "contact", icon: "contact" },
];

export function resolveSiteNavActiveKey(pathname: string): string {
  const normalized = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length === 0) return "";

  if (segments[0] === "events") {
    return "events";
  }

  if (segments[0] === "about") {
    return "about";
  }

  if (segments[0] === "admin") {
    return "admin";
  }

  if (segments[0] === "app" && segments.length > 1) {
    if (segments[1] === "mypage") {
      return "mypage";
    }
    return segments[1];
  }

  if (segments[0] === "app") {
    return "mypage";
  }

  return segments[0];
}

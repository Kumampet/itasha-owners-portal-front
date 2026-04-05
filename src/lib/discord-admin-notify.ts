/**
 * 管理者向け Discord 通知（Incoming Webhook）。
 *
 * 種別ごとの URL（優先）:
 * - DISCORD_WEBHOOK_EVENT_APPROVAL … イベント承認依頼（PENDING）・承認済み（APPROVED）
 * - DISCORD_WEBHOOK_CONTACT … お問い合わせ
 * - DISCORD_WEBHOOK_COMMON_NOTIFY … イベント掲載依頼
 * - DISCORD_WEBHOOK_ORGANIZER_APPLICATION … オーガナイザー申請
 *
 * 上記が未設定のときのみ DISCORD_ADMIN_WEBHOOK_URL をフォールバックとして使用。
 * すべて未設定の場合は no-op。
 *
 * メンションするロール（任意・複数可）:
 * - DISCORD_NOTIFY_ROLE_IDS … カンマ区切り（例: 111,222,333）
 * - DISCORD_NOTIFY_ROLE_ID … 1件だけのとき用（DISCORD_NOTIFY_ROLE_IDS 未設定時のみ）
 * いずれも未設定ならメンションなし（embed のみ）。
 */

function discordNotifyRoleIds(): string[] {
  const multi = process.env.DISCORD_NOTIFY_ROLE_IDS?.trim();
  if (multi) {
    return multi
      .split(",")
      .map((s) => s.trim())
      .filter((id) => id.length > 0);
  }
  const single = process.env.DISCORD_NOTIFY_ROLE_ID?.trim();
  return single ? [single] : [];
}

function webhookUrl(...envKeys: string[]): string | undefined {
  for (const k of envKeys) {
    const v = process.env[k]?.trim();
    if (v) {
      return v;
    }
  }
  return undefined;
}

function getPublicBaseUrl(): string | null {
  const authBase = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (authBase?.trim()) {
    return authBase.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }
  return null;
}

function adminPath(path: string): string {
  const base = getPublicBaseUrl();
  if (!base) {
    return path;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function truncateField(s: string, max = 1000): string {
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max - 1)}…`;
}

type DiscordEmbed = {
  title: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  url?: string;
};

async function sendAdminEmbed(
  embed: DiscordEmbed,
  targetUrl: string | undefined
): Promise<void> {
  if (!targetUrl) {
    return;
  }
  const roleIds = discordNotifyRoleIds();
  type WebhookBody = {
    embeds: Array<DiscordEmbed & { color: number }>;
    content?: string;
    allowed_mentions?: { parse: []; roles: string[] };
  };
  const payload: WebhookBody = {
    embeds: [{ ...embed, color: embed.color ?? 0x5865f2 }],
  };
  if (roleIds.length > 0) {
    payload.content = roleIds.map((id) => `<@&${id}>`).join(" ");
    payload.allowed_mentions = {
      parse: [],
      roles: roleIds,
    };
  }
  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[DiscordAdmin] webhook failed:", res.status, text);
    }
  } catch (e) {
    console.error("[DiscordAdmin] webhook error:", e);
  }
}

/** オーガナイザーによるイベントの承認申請（PENDING） */
export function notifyDiscordEventApprovalRequested(payload: {
  eventId: string;
  eventName: string;
  eventDateLabel?: string | null;
}): void {
  const { eventId, eventName, eventDateLabel } = payload;
  const url = adminPath(`/admin/events/${eventId}`);
  void sendAdminEmbed(
    {
      title: "イベント承認依頼",
      description: truncateField(
        `**${eventName}** が承認待ちになりました。`,
        4096
      ),
      url: getPublicBaseUrl() ? url : undefined,
      fields: [
        { name: "イベントID", value: truncateField(eventId, 256), inline: true },
        ...(eventDateLabel
          ? [{ name: "開催日", value: truncateField(eventDateLabel, 256), inline: true }]
          : []),
        { name: "管理画面", value: truncateField(url, 1024) },
      ],
    },
    webhookUrl("DISCORD_WEBHOOK_EVENT_APPROVAL", "DISCORD_ADMIN_WEBHOOK_URL")
  );
}

/** 管理者によるイベント承認（APPROVED） */
export function notifyDiscordEventApproved(payload: {
  eventId: string;
  eventName: string;
  eventDateLabel?: string | null;
}): void {
  const { eventId, eventName, eventDateLabel } = payload;
  const url = adminPath(`/admin/events/${eventId}`);
  void sendAdminEmbed(
    {
      title: "イベント承認済み",
      description: truncateField(
        `**${eventName}** が承認され、公開対象になりました。`,
        4096
      ),
      color: 0x57f287,
      url: getPublicBaseUrl() ? url : undefined,
      fields: [
        { name: "イベントID", value: truncateField(eventId, 256), inline: true },
        ...(eventDateLabel
          ? [{ name: "開催日", value: truncateField(eventDateLabel, 256), inline: true }]
          : []),
        { name: "管理画面", value: truncateField(url, 1024) },
      ],
    },
    webhookUrl("DISCORD_WEBHOOK_EVENT_APPROVAL", "DISCORD_ADMIN_WEBHOOK_URL")
  );
}

/** お問い合わせフォーム送信 */
export function notifyDiscordContactReceived(payload: {
  id: string;
  title: string;
  name: string;
  email: string;
  content: string;
}): void {
  const { id, title, name, email, content } = payload;
  const listUrl = adminPath("/admin/contacts");
  void sendAdminEmbed(
    {
      title: "お問い合わせ",
      fields: [
        { name: "お問い合わせID", value: truncateField(id, 256), inline: true },
        { name: "件名", value: truncateField(title), inline: false },
        { name: "お名前", value: truncateField(name, 256), inline: true },
        { name: "メール", value: truncateField(email, 256), inline: true },
        { name: "内容", value: truncateField(content), inline: false },
        { name: "一覧", value: truncateField(listUrl) },
      ],
    },
    webhookUrl("DISCORD_WEBHOOK_CONTACT", "DISCORD_ADMIN_WEBHOOK_URL")
  );
}

/** イベント掲載依頼フォーム */
export function notifyDiscordEventListingRequest(payload: {
  id: string;
  name: string;
  submitterEmail: string | null;
  originalUrl: string | null;
}): void {
  const { id, name, submitterEmail, originalUrl } = payload;
  const listUrl = adminPath("/admin/submissions");
  void sendAdminEmbed(
    {
      title: "イベント掲載依頼",
      fields: [
        { name: "イベント名", value: truncateField(name), inline: false },
        { name: "依頼ID", value: truncateField(id, 256), inline: true },
        ...(submitterEmail
          ? [{ name: "送信者メール", value: truncateField(submitterEmail, 256), inline: true }]
          : []),
        ...(originalUrl
          ? [{ name: "公式URL", value: truncateField(originalUrl, 1024), inline: false }]
          : []),
        { name: "管理画面", value: truncateField(listUrl) },
      ],
    },
    webhookUrl("DISCORD_WEBHOOK_COMMON_NOTIFY", "DISCORD_ADMIN_WEBHOOK_URL")
  );
}

/** オーガナイザー登録申請 */
export function notifyDiscordOrganizerApplication(payload: {
  id: string;
  displayName: string;
  email: string;
}): void {
  const { id, displayName, email } = payload;
  const listUrl = adminPath("/admin/organizer-applications");
  void sendAdminEmbed(
    {
      title: "オーガナイザー申請",
      fields: [
        { name: "表示名", value: truncateField(displayName, 256), inline: true },
        { name: "メール", value: truncateField(email, 256), inline: true },
        { name: "申請ID", value: truncateField(id, 256), inline: true },
        { name: "管理画面", value: truncateField(listUrl) },
      ],
    },
    webhookUrl(
      "DISCORD_WEBHOOK_ORGANIZER_APPLICATION",
      "DISCORD_ADMIN_WEBHOOK_URL"
    )
  );
}

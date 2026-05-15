import type { SVGProps } from "react";

const stroke = {
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 2,
};

export type OutlineIcon24Props = SVGProps<SVGSVGElement>;

function baseProps(className: string | undefined): OutlineIcon24Props {
  return {
    className: className ?? "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };
}

/** イベントカレンダー */
export function IconCalendar(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

/** サービス概要・情報 */
export function IconInformationCircle(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/** 追加・新規作成 */
export function IconPlus(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path {...stroke} d="M12 4v16m8-8H4" />
    </svg>
  );
}

/** メール・お問い合わせ */
export function IconEnvelope(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

/** ダッシュボード・集計 */
export function IconChartBar(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}

/** ユーザー一覧 */
export function IconUsers(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

/** 文書・掲載依頼など */
export function IconDocumentText(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

/** 団体・グループ */
export function IconRectangleGroup(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M2.25 7.125A2.625 2.625 0 014.875 4.5h2.25a2.625 2.625 0 012.625 2.625V9.75a2.625 2.625 0 01-2.625 2.625H4.875A2.625 2.625 0 012.25 9.75V7.125zm12 0A2.625 2.625 0 0116.875 4.5h2.25a2.625 2.625 0 012.625 2.625V9.75a2.625 2.625 0 01-2.625 2.625h-2.25a2.625 2.625 0 01-2.625-2.625V7.125zm-12 9A2.625 2.625 0 014.875 16.5h2.25a2.625 2.625 0 012.625 2.625v2.25A2.625 2.625 0 017.125 24h-2.25A2.625 2.625 0 012.25 21.375v-2.25zm12 0a2.625 2.625 0 012.625-2.625h2.25a2.625 2.625 0 012.625 2.625v2.25a2.625 2.625 0 01-2.625 2.625h-2.25a2.625 2.625 0 01-2.625-2.625v-2.25z"
      />
    </svg>
  );
}

/** 申請・クリップボード */
export function IconClipboardDocumentList(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h2m-2 4h2"
      />
    </svg>
  );
}

/** 戻る */
export function IconArrowLeft(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
}

/** プロフィール・基本情報（ユーザー上半身） */
export function IconUserCircle(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

/** ウォッチ・閲覧 */
export function IconEye(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        {...stroke}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

/** 複数メンバー・団体 */
export function IconUserGroup(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

/** 時計・リマインダー */
export function IconClock(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/** ベル・通知設定 */
export function IconBell(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

/** オーガナイザー・管理機能（スパークル＋ユーザー） */
export function IconSparklesUser(props: OutlineIcon24Props) {
  const { className, ...rest } = props;
  return (
    <svg {...baseProps(className)} {...rest}>
      <path
        {...stroke}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        {...stroke}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

"use client";

import type { ReactNode } from "react";
import { LinkCard } from "@/components/link-card";
import { CardTitle, CardContent } from "@/components/card";

const linkBaseClass =
  "h-full hover:-translate-y-0.5 hover:shadow-md";

const iconCircleBase =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mb-3 sm:h-14 sm:w-14";

const bodyRowClass =
  "flex items-center gap-3 sm:flex-col sm:items-center sm:text-center";

const textColumnClass = "flex-1 min-w-0 sm:flex-none";

export type MyPageMenuCardProps = {
  href: string;
  title: string;
  description: ReactNode;
  /** アイコン円の背景・リングなど（ベースサイズ／角丸以外） */
  iconShellClassName: string;
  icon: ReactNode;
  /** 右上の通知ドット（団体チャットの未読など） */
  showUnreadDot?: boolean;
  /** LinkCard に渡す追加 className（例: `relative`） */
  linkClassName?: string;
};

export function MyPageMenuCard({
  href,
  title,
  description,
  iconShellClassName,
  icon,
  showUnreadDot = false,
  linkClassName = "",
}: MyPageMenuCardProps) {
  const mergedLinkClass = `${linkBaseClass} ${linkClassName}`.trim();

  return (
    <LinkCard href={href} heightFull className={mergedLinkClass}>
      {showUnreadDot ? (
        <span
          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"
          title="新着メッセージあり"
        />
      ) : null}
      <div className={bodyRowClass}>
        <div className={`${iconCircleBase} ${iconShellClassName}`.trim()}>
          {icon}
        </div>
        <div className={textColumnClass}>
          <CardTitle className="mb-1 sm:mb-2">{title}</CardTitle>
          <CardContent>
            {typeof description === "string" ? (
              <p className="text-xs text-muted-foreground sm:text-sm">
                {description}
              </p>
            ) : (
              description
            )}
          </CardContent>
        </div>
      </div>
    </LinkCard>
  );
}

"use client";

import Link from "next/link";

import { Card, CardTitle, CardContent } from "@/components/card";
import { MyPageMenuCard } from "@/components/my-page-menu-card";
import {
  IconBell,
  IconCalendar,
  IconClock,
  IconEye,
  IconPlus,
  IconSparklesUser,
  IconUserCircle,
  IconUserGroup,
} from "@/components/icons";
import { SITE_NAV_ORGANIZER_ITEM } from "@/config/site-nav";

const menuIconClass =
  "h-6 w-6 opacity-90 sm:h-7 sm:w-7";

type MyPageMenuPanelProps = {
  hasUnreadMessages: boolean;
  showOrganizerMenu: boolean;
};

export function MyPageMenuPanel({
  hasUnreadMessages,
  showOrganizerMenu,
}: MyPageMenuPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* メニューグリッド（2列）。イベント一覧は公開サービス共通のカレンダービューへ。 */}
      <MyPageMenuCard
        href="/app/profile/edit"
        title="基本情報"
        description="プロフィールなどの情報を編集できます。"
        iconShellClassName="bg-accent-mint/10 ring-1 ring-border/60"
        icon={
          <IconUserCircle
            className={`${menuIconClass} text-accent-mint`}
            aria-hidden
          />
        }
      />

      <MyPageMenuCard
        href="/events"
        title="イベント一覧"
        description="公開中の痛車イベントを日付順などで一覧・詳細確認できます。"
        iconShellClassName="bg-blue-500/10 ring-1 ring-border/60"
        icon={
          <IconCalendar
            className={`${menuIconClass} text-blue-400/90`}
            aria-hidden
          />
        }
      />

      <MyPageMenuCard
        href="/app/watchlist"
        title="ウォッチリスト"
        description="ウォッチリストに追加したイベントを管理できます。"
        iconShellClassName="bg-sky-500/10 ring-1 ring-border/60"
        icon={
          <IconEye
            className={`${menuIconClass} text-sky-400/90`}
            aria-hidden
          />
        }
      />

      <MyPageMenuCard
        href="/app/groups"
        title="団体管理"
        description="併せメンバーの募集状況や一斉連絡ポリシーを確認・運用できます。"
        iconShellClassName="bg-violet-500/12 ring-1 ring-border/60"
        linkClassName="relative"
        showUnreadDot={hasUnreadMessages}
        icon={
          <IconUserGroup
            className={`${menuIconClass} text-violet-400/90`}
            aria-hidden
          />
        }
      />

      <MyPageMenuCard
        href="/app/reminder"
        title="リマインダー管理"
        description="エントリー済みイベントの締切・集合時間・支払期日をまとめて確認。"
        iconShellClassName="bg-orange-500/10 ring-1 ring-border/60"
        icon={
          <IconClock
            className={`${menuIconClass} text-orange-400/90`}
            aria-hidden
          />
        }
      />

      <MyPageMenuCard
        href="/app/notification-settings"
        title="通知設定"
        description="各種通知の設定を行えます。"
        iconShellClassName="bg-amber-500/10 ring-1 ring-border/60"
        icon={
          <IconBell
            className={`${menuIconClass} text-amber-400/90`}
            aria-hidden
          />
        }
      />

      <MyPageMenuCard
        href="/app/event-submission"
        title="イベント掲載依頼"
        description="イベント情報をご提供いただくことで、より多くの参加者に知っていただけます。"
        iconShellClassName="bg-accent-rose/12 ring-1 ring-border/60"
        icon={
          <IconPlus
            className={`${menuIconClass} text-accent-rose opacity-90`}
            aria-hidden
          />
        }
      />

      {/* オーガナイザー機能（admin/organizerのみ） */}
      {showOrganizerMenu ? (
        <MyPageMenuCard
          href={SITE_NAV_ORGANIZER_ITEM.href}
          title={SITE_NAV_ORGANIZER_ITEM.label}
          description="イベント管理やユーザー管理、情報提供フォームの処理などができます。"
          iconShellClassName="bg-indigo-500/10 ring-1 ring-border/60"
          icon={
            <IconSparklesUser
              className={`${menuIconClass} text-indigo-400/90`}
              aria-hidden
            />
          }
        />
      ) : (
        <Card variant="muted">
          <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
            {/* オーガナイザー機能アイコン（無効状態） */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card-elevated ring-1 ring-border/60 sm:mb-3 sm:h-14 sm:w-14">
              <IconSparklesUser
                className="h-6 w-6 text-muted-foreground sm:h-7 sm:w-7"
                aria-hidden
              />
            </div>
            <div className="flex-1 min-w-0 sm:flex-none">
              <CardTitle className="mb-1 sm:mb-2">{SITE_NAV_ORGANIZER_ITEM.label}</CardTitle>
              <CardContent>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  イベントの作成・管理や参加者の管理など、イベント主催者向けの機能です。
                </p>
                <p className="mt-2 text-xs text-muted sm:text-sm">
                  ご希望のイベント主催者は
                  <Link
                    href="/app/organizer-application"
                    className="font-semibold text-accent-mint hover:text-accent-mint underline"
                  >
                    オーガナイザー登録申請
                  </Link>
                  から申請ください。
                </p>
              </CardContent>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

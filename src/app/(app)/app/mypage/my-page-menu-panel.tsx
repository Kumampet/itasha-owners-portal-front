"use client";

import Link from "next/link";

import { Card, CardTitle, CardContent } from "@/components/card";
import { MyPageMenuCard } from "@/components/my-page-menu-card";
import { SITE_NAV_ORGANIZER_ITEM } from "@/config/site-nav";

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
                    <svg
                        className="h-6 w-6 text-accent-mint opacity-90 sm:h-7 sm:w-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                }
            />

            <MyPageMenuCard
                href="/events"
                title="イベント一覧"
                description="公開中の痛車イベントを日付順などで一覧・詳細確認できます。"
                iconShellClassName="bg-blue-500/10 ring-1 ring-border/60"
                icon={
                    <svg
                        className="h-6 w-6 text-blue-400/90 sm:h-7 sm:w-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                }
            />

            <MyPageMenuCard
                href="/app/watchlist"
                title="ウォッチリスト"
                description="ウォッチリストに追加したイベントを管理できます。"
                iconShellClassName="bg-sky-500/10 ring-1 ring-border/60"
                icon={
                    <svg
                        className="h-6 w-6 text-sky-400/90 sm:h-7 sm:w-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
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
                    <svg
                        className="h-6 w-6 text-violet-400/90 sm:h-7 sm:w-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                }
            />

            <MyPageMenuCard
                href="/app/reminder"
                title="リマインダー管理"
                description="エントリー済みイベントの締切・集合時間・支払期日をまとめて確認。"
                iconShellClassName="bg-orange-500/10 ring-1 ring-border/60"
                icon={
                    <svg
                        className="h-6 w-6 text-orange-400/90 sm:h-7 sm:w-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                }
            />

            <MyPageMenuCard
                href="/app/notification-settings"
                title="通知設定"
                description="各種通知の設定を行えます。"
                iconShellClassName="bg-amber-500/10 ring-1 ring-border/60"
                icon={
                    <svg
                        className="h-6 w-6 text-amber-400/90 sm:h-7 sm:w-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                    </svg>
                }
            />

            <MyPageMenuCard
                href="/app/event-submission"
                title="イベント掲載依頼"
                description="イベント情報をご提供いただくことで、より多くの参加者に知っていただけます。"
                iconShellClassName="bg-accent-rose/12 ring-1 ring-border/60"
                icon={
                    <svg
                        className="h-6 w-6 text-accent-rose opacity-90 sm:h-7 sm:w-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
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
                        <svg
                            className="h-6 w-6 text-indigo-400/90 sm:h-7 sm:w-7"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    }
                />
            ) : (
                <Card variant="muted">
                    <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
                        {/* オーガナイザー機能アイコン（無効状態） */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card-elevated ring-1 ring-border/60 sm:mb-3 sm:h-14 sm:w-14">
                            <svg
                                className="h-6 w-6 text-muted-foreground sm:h-7 sm:w-7"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
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

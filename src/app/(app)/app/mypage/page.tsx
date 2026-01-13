"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { LinkCard } from "@/components/link-card";
import { Card, CardTitle, CardContent } from "@/components/card";
import { LoadingSpinner } from "@/components/loading-spinner";

// 団体管理リンクカード（通知バッジ付き）
function GroupManagementLinkCard() {
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

    useEffect(() => {
        const fetchUnreadCounts = async () => {
            try {
                const res = await fetch("/api/groups/unread-count");
                if (!res.ok) return;
                const data = await res.json();
                // いずれかの団体に未読メッセージがあるかチェック
                const hasUnread = Object.values(data).some((hasUnread: unknown) => hasUnread === true);
                setHasUnreadMessages(hasUnread);
            } catch (error) {
                console.error("Failed to fetch unread counts:", error);
            }
        };

        fetchUnreadCounts();
        // 定期的に未読数をチェック（10秒ごと）
        const interval = setInterval(fetchUnreadCounts, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <LinkCard href="/app/groups" className="hover:-translate-y-0.5 hover:shadow-md relative">
            {hasUnreadMessages && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" title="新着メッセージあり"></span>
            )}
            <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
                {/* 団体管理アイコン */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 sm:mb-3 sm:h-14 sm:w-14">
                    <svg
                        className="h-6 w-6 text-purple-600 sm:h-7 sm:w-7"
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
                </div>
                <div className="flex-1 min-w-0 sm:flex-none">
                    <CardTitle className="mb-1 sm:mb-2">団体管理</CardTitle>
                    <CardContent>
                        <p className="text-xs text-zinc-600 sm:text-sm">
                            併せメンバーの募集状況や一斉連絡ポリシーを確認・運用できます。
                        </p>
                    </CardContent>
                </div>
            </div>
        </LinkCard>
    );
}

type Reminder = {
    id: string;
    event: {
        id: string;
        name: string;
        event_date: Date | null;
        original_url: string | null;
    } | null;
    type: string;
    datetime: string;
    label: string;
    note: string | null;
    notified: boolean;
    notified_at: Date | null;
    created_at: Date;
};

export default function MyPage() {
    const { data: session, status } = useSession();
    const isLoading = status === "loading";
    const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
    const [isLoadingReminders, setIsLoadingReminders] = useState(true);

    // TODO: 通知設定機能を削除しました。将来的に再実装する場合は、初回ログイン時に通知設定をチェックするロジックを追加してください。

    // 72時間以内のリマインダーを取得
    useEffect(() => {
        if (!session?.user?.id) {
            setIsLoadingReminders(false);
            return;
        }

        // タイトルを設定
        document.title = "マイページ | 痛車オーナーズナビ | いたなび！";

        const fetchUpcomingReminders = async () => {
            try {
                const response = await fetch("/api/reminders");
                if (!response.ok) {
                    throw new Error("Failed to fetch reminders");
                }
                const reminders: Reminder[] = await response.json();

                // 現在日時から72時間以内のリマインダーをフィルタリング
                const now = new Date();
                const threeDaysLater = new Date(now.getTime() + 72 * 60 * 60 * 1000);

                const upcoming = reminders.filter((reminder) => {
                    const reminderDate = new Date(reminder.datetime);
                    return reminderDate >= now && reminderDate <= threeDaysLater;
                });

                // 日時が近い順にソート
                upcoming.sort((a, b) => {
                    const dateA = new Date(a.datetime).getTime();
                    const dateB = new Date(b.datetime).getTime();
                    return dateA - dateB;
                });

                setUpcomingReminders(upcoming);
            } catch (error) {
                console.error("Error fetching reminders:", error);
            } finally {
                setIsLoadingReminders(false);
            }
        };

        fetchUpcomingReminders();
    }, [session?.user?.id]);

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${month}/${day} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    };

    return (
        <main className="flex-1">
            <section className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
                <header>
                    <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        マイページ
                    </h1>
                    {/* ユーザー情報表示領域（固定サイズでレイアウトシフトを防止） */}
                    <div className="mt-1 min-h-[20px]">
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <LoadingSpinner size="xs" />
                                <span className="text-xs text-zinc-500">読み込み中...</span>
                            </div>
                        ) : session ? (
                            <p className="text-xs text-zinc-600 sm:text-sm">
                                {session.user?.name && (
                                    <span className="font-medium">{session.user.name}</span>
                                )}
                                {session.user?.name && session.user?.email && " / "}
                                {session.user?.email && (
                                    <span className="text-zinc-500">{session.user.email}</span>
                                )}
                            </p>
                        ) : null}
                    </div>
                    <p className="mt-2 text-xs text-zinc-600 sm:text-sm">
                        自分専用のリマインダー一覧やフォロー中イベント、公開プロフィール設定を
                        行う画面です。
                    </p>
                </header>

                {/* 近日中のリマインダーセクション */}
                <Card>
                    <CardTitle>近日中のリマインダー</CardTitle>
                    <CardContent>
                        {isLoadingReminders ? (
                            <div className="mt-3 flex items-center gap-2">
                                <LoadingSpinner size="sm" />
                                <span className="text-xs text-zinc-500">読み込み中...</span>
                            </div>
                        ) : upcomingReminders.length === 0 ? (
                            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                                直近3日間（72時間）以内のリマインダーはありません。イベントをフォローすると、ここに
                                エントリー開始・締切・集合時間などが表示されます。
                            </p>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {upcomingReminders.map((reminder) => (
                                    <li key={reminder.id} className="border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-zinc-900 sm:text-sm">
                                                    {reminder.label}
                                                </p>
                                                {reminder.event && (
                                                    <p className="mt-0.5 text-xs text-zinc-600 sm:text-sm">
                                                        {reminder.event.name}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {formatDateTime(reminder.datetime)}
                                                </p>
                                            </div>
                                            {reminder.event && (
                                                <Link
                                                    href={`/events/${reminder.event.id}`}
                                                    className="ml-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 whitespace-nowrap"
                                                >
                                                    詳細 →
                                                </Link>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* 基本情報、リマインダー管理、団体管理、オーガナイザー機能（2列グリッド） */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <LinkCard href="/app/profile/edit" className="hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
                            {/* 基本情報アイコン */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 sm:mb-3 sm:h-14 sm:w-14">
                                <svg
                                    className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7"
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
                            </div>
                            <div className="flex-1 min-w-0 sm:flex-none">
                                <CardTitle className="mb-1 sm:mb-2">基本情報</CardTitle>
                                <CardContent>
                                    <p className="text-xs text-zinc-600 sm:text-sm">
                                        プロフィールなどの情報を編集できます。
                                    </p>
                                </CardContent>
                            </div>
                        </div>
                    </LinkCard>

                    <LinkCard href="/app/watchlist" className="hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
                            {/* ウォッチリストアイコン */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mb-3 sm:h-14 sm:w-14">
                                <svg
                                    className="h-6 w-6 text-blue-600 sm:h-7 sm:w-7"
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
                            </div>
                            <div className="flex-1 min-w-0 sm:flex-none">
                                <CardTitle className="mb-1 sm:mb-2">ウォッチリスト</CardTitle>
                                <CardContent>
                                    <p className="text-xs text-zinc-600 sm:text-sm">
                                        ウォッチリストに追加したイベントを管理できます。
                                    </p>
                                </CardContent>
                            </div>
                        </div>
                    </LinkCard>

                    <GroupManagementLinkCard />

                    <LinkCard href="/app/reminder" className="hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
                            {/* リマインダー管理アイコン */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mb-3 sm:h-14 sm:w-14">
                                <svg
                                    className="h-6 w-6 text-orange-600 sm:h-7 sm:w-7"
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
                            </div>
                            <div className="flex-1 min-w-0 sm:flex-none">
                                <CardTitle className="mb-1 sm:mb-2">リマインダー管理</CardTitle>
                                <CardContent>
                                    <p className="text-xs text-zinc-600 sm:text-sm">
                                        エントリー済みイベントの締切・集合時間・支払期日をまとめて確認。
                                    </p>
                                </CardContent>
                            </div>
                        </div>
                    </LinkCard>

                    <Card variant="muted">
                        <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
                            {/* 通知設定アイコン（無効状態） */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 sm:mb-3 sm:h-14 sm:w-14">
                                <svg
                                    className="h-6 w-6 text-zinc-400 sm:h-7 sm:w-7"
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
                            </div>
                            <div className="flex-1 min-w-0 sm:flex-none">
                                <CardTitle className="mb-1 sm:mb-2 text-zinc-400">通知設定</CardTitle>
                                <CardContent>
                                    <p className="text-xs text-zinc-400 sm:text-sm">
                                        各種通知の設定を行えます。
                                    </p>
                                    <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
                                        現在準備中です。
                                    </p>
                                </CardContent>
                            </div>
                        </div>
                    </Card>

                    <LinkCard href="/app/event-submission" className="hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
                            {/* イベント掲載依頼アイコン */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 sm:mb-3 sm:h-14 sm:w-14">
                                <svg
                                    className="h-6 w-6 text-pink-600 sm:h-7 sm:w-7"
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
                            </div>
                            <div className="flex-1 min-w-0 sm:flex-none">
                                <CardTitle className="mb-1 sm:mb-2">イベント掲載依頼</CardTitle>
                                <CardContent>
                                    <p className="text-xs text-zinc-600 sm:text-sm">
                                        イベント情報をご提供いただくことで、より多くの参加者に知っていただけます。
                                    </p>
                                </CardContent>
                            </div>
                        </div>
                    </LinkCard>

                    {/* オーガナイザー機能（admin/organizerのみ） */}
                    {(session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER") ? (
                        <LinkCard href="/admin/dashboard" className="hover:-translate-y-0.5 hover:shadow-md">
                            <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
                                {/* オーガナイザー機能アイコン */}
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mb-3 sm:h-14 sm:w-14">
                                    <svg
                                        className="h-6 w-6 text-indigo-600 sm:h-7 sm:w-7"
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
                                    <CardTitle className="mb-1 sm:mb-2">オーガナイザー機能</CardTitle>
                                    <CardContent>
                                        <p className="text-xs text-zinc-600 sm:text-sm">
                                            イベント管理やユーザー管理、情報提供フォームの処理などができます。
                                        </p>
                                    </CardContent>
                                </div>
                            </div>
                        </LinkCard>
                    ) : (
                        <Card variant="muted">
                            <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
                                {/* オーガナイザー機能アイコン（無効状態） */}
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 sm:mb-3 sm:h-14 sm:w-14">
                                    <svg
                                        className="h-6 w-6 text-zinc-400 sm:h-7 sm:w-7"
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
                                    <CardTitle className="mb-1 sm:mb-2">オーガナイザー機能</CardTitle>
                                    <CardContent>
                                        <p className="text-xs text-zinc-600 sm:text-sm">
                                            イベントの作成・管理や参加者の管理など、イベント主催者向けの機能です。
                                        </p>
                                        <p className="mt-2 text-xs text-zinc-500 sm:text-sm">
                                            ご希望のイベント主催者は
                                            <Link
                                                href="/app/organizer-application"
                                                className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
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
            </section>
        </main>
    );
}


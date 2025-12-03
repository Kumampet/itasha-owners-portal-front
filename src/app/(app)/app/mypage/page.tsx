"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { PWAInstallCard } from "@/components/pwa-install-card";
import { LinkCard } from "@/components/link-card";
import { Card, CardTitle, CardContent } from "@/components/card";
import { LoadingSpinner } from "@/components/loading-spinner";

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

                {/* PWAインストール案内（スマホのみ） */}
                <PWAInstallCard />

                {/* 基本情報、リマインダー管理、団体管理、オーガナイザー機能（2x2グリッド） */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <LinkCard href="/app/profile/edit">
                        <CardTitle>基本情報</CardTitle>
                        <CardContent className="mt-1">
                            <p className="text-xs text-zinc-700 sm:text-sm">
                                プロフィールなどの情報を編集できるようにします。
                            </p>
                        </CardContent>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            詳細を見る →
                        </p>
                    </LinkCard>

                    <LinkCard href="/app/watchlist">
                        <CardTitle>ウォッチリスト</CardTitle>
                        <CardContent className="mt-1">
                            <p className="text-xs text-zinc-700 sm:text-sm">
                                ウォッチリストに追加したイベント管理できます。
                            </p>
                        </CardContent>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            詳細を見る →
                        </p>
                    </LinkCard>

                    <LinkCard href="/app/groups">
                        <CardTitle>団体管理</CardTitle>
                        <CardContent className="mt-1">
                            <p className="text-xs text-zinc-700 sm:text-sm">
                                併せメンバーの募集状況や一斉連絡ポリシーを確認し、
                                マイページからまとめて運用できます。
                            </p>
                        </CardContent>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            詳細を見る →
                        </p>
                    </LinkCard>

                    <LinkCard href="/app/reminder">
                        <CardTitle>リマインダー管理</CardTitle>
                        <CardContent className="mt-1">
                            <p className="text-xs text-zinc-700 sm:text-sm">
                                エントリー済みイベントの
                                締切・集合時間・支払期日をまとめて確認。
                            </p>
                        </CardContent>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            詳細を見る →
                        </p>
                    </LinkCard>

                    {/* TODO: 通知設定機能を削除しました。将来的に再実装する場合は、ここに通知設定へのリンクを追加してください。 */}
                    <LinkCard href="/app/event-submission">
                        <CardTitle>イベント掲載依頼</CardTitle>
                        <CardContent className="mt-1">
                            <p className="text-xs text-zinc-700 sm:text-sm">
                                イベント情報をご提供いただくことで、より多くの参加者にイベントを知っていただくことができます。
                            </p>
                        </CardContent>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            フォームを開く →
                        </p>
                    </LinkCard>

                    {/* オーガナイザー機能（admin/organizerのみ） */}
                    {(session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER") ? (
                        <LinkCard href="/admin/dashboard">
                            <CardTitle>オーガナイザー機能</CardTitle>
                            <CardContent className="mt-1">
                                <p className="text-xs text-zinc-700 sm:text-sm">
                                    イベント管理やユーザー管理、情報提供フォームの処理など、
                                    オーガナイザー向けの機能を利用できます。
                                </p>
                            </CardContent>
                            <p className="mt-3 text-xs font-semibold text-emerald-600">
                                詳細を見る →
                            </p>
                        </LinkCard>
                    ) : (
                        <Card variant="muted">
                            <CardTitle>オーガナイザー機能</CardTitle>
                            <CardContent className="mt-1">
                                <p className="text-xs text-zinc-700 sm:text-sm">
                                    イベントの作成・管理や参加者の管理など、イベント主催者向けの機能です。
                                </p>
                            </CardContent>
                            <p className="mt-2 text-xs text-zinc-600 sm:text-sm">
                                ご希望のイベント主催者はお問い合わせフォームからお問い合わせください。
                            </p>
                        </Card>
                    )}
                </div>
            </section>
        </main>
    );
}


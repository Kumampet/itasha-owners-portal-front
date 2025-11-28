"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
// TODO: 通知設定機能を削除しました。将来的に再実装する場合は、useRouterをインポートして使用してください。
import { DisplayNameModal } from "@/components/display-name-modal";
import { PWAInstallCard } from "@/components/pwa-install-card";
// TODO: 通知設定機能を削除しました。将来的に再実装する場合は、shouldRedirectToNotificationSettingsをインポートして使用してください。

type Reminder = {
    id: string;
    event: {
        id: string;
        name: string;
        theme: string | null;
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
    const { data: session, status, update } = useSession();
    const isLoading = status === "loading";
    const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState(false);
    const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
    const [isLoadingReminders, setIsLoadingReminders] = useState(true);

    // TODO: 通知設定機能を削除しました。将来的に再実装する場合は、初回ログイン時に通知設定をチェックするロジックを追加してください。

    // 72時間以内のリマインダーを取得
    useEffect(() => {
        if (!session?.user?.id) {
            setIsLoadingReminders(false);
            return;
        }

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
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
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
                <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
                    <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                        近日中のリマインダー
                    </h2>
                    {isLoadingReminders ? (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
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
                </section>

                {/* PWAインストール案内（スマホのみ） */}
                <PWAInstallCard />

                {/* 基本情報、リマインダー管理、団体管理、オーガナイザー機能（2x2グリッド） */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            基本情報
                        </h2>
                        <div className="mt-3 space-y-3">
                            <div>
                                <h3 className="text-xs font-medium text-zinc-700 sm:text-sm">
                                    表示名
                                </h3>
                                {session?.user?.displayName ? (
                                    <div className="mt-1 flex items-center justify-between">
                                        <p className="text-xs text-zinc-900 sm:text-sm">
                                            {session.user.displayName}
                                        </p>
                                        <button
                                            onClick={() => setIsDisplayNameModalOpen(true)}
                                            className="text-xs text-emerald-600 hover:text-emerald-700 sm:text-sm"
                                        >
                                            編集
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-1">
                                        <p className="text-xs text-zinc-500 sm:text-sm">
                                            未設定（ログインしたアカウントの名前を使用）
                                        </p>
                                        <button
                                            onClick={() => setIsDisplayNameModalOpen(true)}
                                            className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 sm:text-sm"
                                        >
                                            表示名を設定 →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-zinc-700 sm:text-sm">
                            プロフィールなどの情報を表示し、編集できるようにします。
                        </p>
                    </section>

                    <Link
                        href="/app/watchlist"
                        className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 sm:p-5"
                    >
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            ウォッチリスト
                        </h2>
                        <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                            気になるイベントをまとめて管理します。
                            ウォッチリストに追加したイベントのリマインダーが自動的に設定されます。
                        </p>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            詳細を見る →
                        </p>
                    </Link>

                    <Link
                        href="/app/event-submission"
                        className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 sm:p-5"
                    >
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            イベント掲載依頼
                        </h2>
                        <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                            イベント情報をご提供いただくことで、より多くの参加者にイベントを知っていただくことができます。
                        </p>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            フォームを開く →
                        </p>
                    </Link>

                    <Link
                        href="/app/reminder"
                        className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 sm:p-5"
                    >
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            リマインダー管理
                        </h2>
                        <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                            エントリー済みイベントの
                            締切・集合時間・支払期日をまとめて確認。
                        </p>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            詳細を見る →
                        </p>
                    </Link>

                    {/* TODO: 通知設定機能を削除しました。将来的に再実装する場合は、ここに通知設定へのリンクを追加してください。 */}

                    <Link
                        href="/app/groups"
                        className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 sm:p-5"
                    >
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            団体（併せ）管理
                        </h2>
                        <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                            併せメンバーの募集状況や一斉連絡ポリシーを確認し、
                            マイページからまとめて運用できます。
                        </p>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            詳細を見る →
                        </p>
                    </Link>

                    {/* オーガナイザー機能（admin/organizerのみ） */}
                    {(session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER") ? (
                        <Link
                            href="/admin/dashboard"
                            className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 sm:p-5"
                        >
                            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                                オーガナイザー機能
                            </h2>
                            <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                                イベント管理やユーザー管理、情報提供フォームの処理など、
                                オーガナイザー向けの機能を利用できます。
                            </p>
                            <p className="mt-3 text-xs font-semibold text-emerald-600">
                                詳細を見る →
                            </p>
                        </Link>
                    ) : (
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                                オーガナイザー機能
                            </h2>
                            <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                                イベントの作成・管理や参加者の管理など、イベント主催者向けの機能です。
                            </p>
                            <p className="mt-2 text-xs text-zinc-600 sm:text-sm">
                                ご希望のイベント主催者はお問い合わせフォームからお問い合わせください。
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <DisplayNameModal
                isOpen={isDisplayNameModalOpen}
                onClose={() => setIsDisplayNameModalOpen(false)}
                onSave={async (displayName: string) => {
                    try {
                        const response = await fetch("/api/user/display-name", {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ displayName }),
                        });

                        if (!response.ok) {
                            throw new Error("Failed to save display name");
                        }

                        // セッションを更新
                        await update();
                        setIsDisplayNameModalOpen(false);
                    } catch (error) {
                        console.error("Failed to save display name:", error);
                        throw error;
                    }
                }}
                onLater={() => setIsDisplayNameModalOpen(false)}
                initialDisplayName={session?.user?.displayName || null}
                showLaterButton={false}
            />
        </main>
    );
}


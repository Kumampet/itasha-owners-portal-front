"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
    MyPageReminderPanel,
    type MyPageReminder,
} from "@/components/my-page-reminder-panel";
import { MyPageEmailRequiredModal } from "@/components/my-page-email-required-modal";
import { MyPageMenuPanel } from "./my-page-menu-panel";

// ユーザー情報表示コンポーネント
function UserInfoDisplay({
    session,
    isEmailRequired
}: {
    session: {
        user?: {
            displayName?: string | null;
            name?: string | null;
            email?: string | null;
        } | null;
    } | null;
    isEmailRequired: boolean;
}) {
    const userName = session?.user?.displayName || session?.user?.name;
    const userEmail = session?.user?.email?.trim() || "";

    return (
        <>
            {userName && (
                <span className="font-medium">{userName}</span>
            )}
            <span className="text-muted"> / </span>
            {userEmail && (
                <span className="text-muted">{userEmail}</span>
            )}
            {isEmailRequired && (
                <span className="text-red-600">（メールアドレス未設定）</span>
            )}
        </>
    );
}

export default function MyPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const isLoading = status === "loading";
    const [upcomingReminders, setUpcomingReminders] = useState<MyPageReminder[]>([]);
    const [isLoadingReminders, setIsLoadingReminders] = useState(true);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

    useEffect(() => {
        const fetchUnreadCounts = async () => {
            try {
                const res = await fetch("/api/groups/unread-count");
                if (!res.ok) return;
                const data = await res.json();
                const hasUnread = Object.values(data).some((hasUnreadFlag: unknown) => hasUnreadFlag === true);
                setHasUnreadMessages(hasUnread);
            } catch (error) {
                console.error("Failed to fetch unread counts:", error);
            }
        };

        fetchUnreadCounts();
        const interval = setInterval(fetchUnreadCounts, 10000);
        return () => clearInterval(interval);
    }, []);

    // メールアドレスが未設定（nullまたは空文字列）かどうかを判定
    const sessionEmail = session?.user?.email?.trim() ?? "";
    const isEmailRequired = sessionEmail === "";

    // URLパラメータに_refreshがある場合、セッションを強制的に再取得（キャッシュを無視）
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refreshParam = params.get("_refresh");

        if (refreshParam) {
            // セッションを強制的に再取得（キャッシュを無視）
            update().then(() => {
                // URLパラメータを削除（履歴に残さない）
                const newUrl = window.location.pathname;
                window.history.replaceState({}, "", newUrl);
            }).catch((error) => {
                console.error("[MyPage] Error updating session:", error);
            });
        }
    }, [update, router]);

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
                const reminders: MyPageReminder[] = await response.json();

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

    return (
        <main className="flex-1">
            {/* メールアドレス未設定モーダル */}
            <MyPageEmailRequiredModal open={isEmailRequired && !isLoading} />

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
                                <span className="text-xs text-muted">読み込み中...</span>
                            </div>
                        ) : session ? (
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                <UserInfoDisplay session={session} isEmailRequired={isEmailRequired} />
                            </p>
                        ) : null}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                        自分専用のリマインダー一覧やフォロー中イベント、公開プロフィール設定を
                        行う画面です。
                    </p>
                </header>

                {/* リマインダー一覧 */}
                <MyPageReminderPanel
                    isLoadingReminders={isLoadingReminders}
                    reminders={upcomingReminders}
                />

                {/* メニューパネル */}
                <MyPageMenuPanel
                    hasUnreadMessages={hasUnreadMessages}
                    showOrganizerMenu={
                        session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER"
                    }
                />
            </section>
        </main>
    );
}


"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { DisplayNameModal } from "@/components/display-name-modal";

export default function MyPage() {
    const { data: session, status, update } = useSession();
    const isLoading = status === "loading";
    const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState(false);

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

                {/* 今日とこれからの予定セクション */}
                <div className="space-y-4">
                    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            本日のリマインダー
                        </h2>
                        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                            まだデータは登録されていません。イベントをフォローすると、ここに
                            エントリー開始・締切・集合時間などが表示されます。
                        </p>
                    </section>

                    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            近日中のイベント
                        </h2>
                        <ul className="mt-2 space-y-2 text-xs text-zinc-700 sm:text-sm">
                            <li>・イベントを登録すると、ここに3件まで表示されます。</li>
                            <li>・エントリー開始前にはプッシュ通知とメールでお知らせします。</li>
                            <li>・支払期限前には、併せのメンバーにも共有できるようにします。</li>
                        </ul>
                    </section>
                </div>

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
                            認証基盤（Cognito）連携後、ここにメールアドレスやプロフィールURLなどの
                            情報を表示し、編集できるようにします。
                        </p>
                    </section>

                    <Link
                        href="/app/reminder"
                        className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 sm:p-5"
                    >
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            リマインダー管理
                        </h2>
                        <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                            気になるイベントやエントリー済みイベントの
                            締切・集合時間・支払期日をまとめて確認。
                        </p>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            詳細を見る →
                        </p>
                    </Link>

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
                                オーガナイザー権限が必要です。
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


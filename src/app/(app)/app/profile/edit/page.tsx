"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";

// マイページへのリダイレクトタイムアウト時間（ミリ秒）
const REDIRECT_TIMEOUT_MS = 2000;
const REDIRECT_TIMEOUT_SECONDS = REDIRECT_TIMEOUT_MS / 1000;

export default function ProfileEditPage() {
    const { data: session, status, update } = useSession();
    const isLoading = status === "loading";
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    
    // メールアドレスが未設定（nullまたは空文字列）かどうかを判定
    const isEmailRequired = !session?.user?.email || session.user.email.trim() === "";

    useEffect(() => {
        document.title = "プロフィール編集 | 痛車オーナーズナビ | いたなび！";
    }, []);

    // セッションから初期値を設定
    useEffect(() => {
        if (session?.user?.displayName) {
            setDisplayName(session.user.displayName);
        }
        if (session?.user?.email && session.user.email.trim() !== "") {
            // メールアドレスを設定
            setEmail(session.user.email);
        } else {
            // メールアドレスが未設定の場合は空文字列
            setEmail("");
        }
    }, [session?.user?.displayName, session?.user?.email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        // メールアドレスが必須の場合、バリデーション
        if (isEmailRequired && !email.trim()) {
            setError("メールアドレスを入力してください");
            return;
        }

        if (email.trim()) {
            // メールアドレスの形式チェック
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                setError("有効なメールアドレスを入力してください");
                return;
            }
        }

        // 表示名が入力されている場合のみ、文字数チェック
        if (displayName.trim()) {
            // 全角50文字以内に制限
            const charCount = Array.from(displayName.trim()).length;
            if (charCount > 50) {
                setError("表示名は全角50文字以内で入力してください");
                return;
            }
        }

        setSaving(true);
        try {
            // メールアドレスを更新（変更がある場合のみ、キャッシュを無視）
            if (email.trim() && email.trim() !== session?.user?.email) {
                const emailResponse = await fetch("/api/user/email", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: email.trim() }),
                    cache: "no-store", // キャッシュを無視
                });

                if (!emailResponse.ok) {
                    const data = await emailResponse.json();
                    throw new Error(data.error || "メールアドレスの保存に失敗しました");
                }
            }

            // 表示名を更新（常に更新する。空の場合はnullを送信、キャッシュを無視）
            const response = await fetch("/api/user/display-name", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ displayName: displayName.trim() || null }),
                cache: "no-store", // キャッシュを無視
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "表示名の保存に失敗しました");
            }

            // セッションを更新（キャッシュを無視して再取得）
            // NextAuthのupdate()は内部的にキャッシュを無視するが、確実にするためURLパラメータを追加
            await update();
            
            setSuccess(true);
            
            // タイムアウト後にマイページに戻る（キャッシュ回避用のタイムスタンプを追加）
            setTimeout(() => {
                // キャッシュを無視するため、タイムスタンプをURLパラメータに追加
                const timestamp = Date.now();
                window.location.href = `/app/mypage?_refresh=${timestamp}`;
            }, REDIRECT_TIMEOUT_MS);
        } catch (error) {
            console.error("Failed to save profile:", error);
            setError(
                error instanceof Error ? error.message : "保存に失敗しました"
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="flex-1">
            <section className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-zinc-500">読み込み中...</span>
                    </div>
                ) : (
                    <>
                        <header>
                            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                基本情報の変更
                            </h1>
                            <p className="mt-2 text-xs text-zinc-600 sm:text-sm">
                                プロフィールなどの情報を表示し、編集できます。
                            </p>
                        </header>

                        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                                        保存しました。{REDIRECT_TIMEOUT_SECONDS}秒後にマイページに戻ります...
                                    </div>
                                )}

                                {/* メールアドレス設定（Xログインの場合は必須） */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        メールアドレス
                                        {isEmailRequired && <span className="text-red-500"> *</span>}
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@email.com"
                                        required={isEmailRequired}
                                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                    />
                                    {isEmailRequired && (
                                        <p className="mt-1 text-xs text-red-600">
                                            メールアドレスの登録が必要です。
                                        </p>
                                    )}
                                    {!isEmailRequired && session?.user?.email && (
                                        <p className="mt-1 text-xs text-zinc-500">
                                            現在のメールアドレス: {session.user.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="displayName"
                                        className="block text-sm font-medium text-zinc-700 mb-2"
                                    >
                                        表示名（任意、全角50文字以内）
                                    </label>
                                    <input
                                        id="displayName"
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // 全角50文字以内に制限
                                            const charCount = Array.from(value).length;
                                            if (charCount <= 50) {
                                                setDisplayName(value);
                                            }
                                        }}
                                        placeholder="例: 痛車太郎"
                                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                        maxLength={50}
                                    />
                                    <p className="mt-1 text-xs text-zinc-500">
                                        {Array.from(displayName).length} / 50文字
                                    </p>
                                    <p className="mt-2 text-xs text-zinc-600">
                                        団体チャットなどで表示される表示名（ニックネーム）を設定できます。
                                        実名を公開したくない場合でも、この表示名で参加できます。
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-600">
                                        未設定の場合はログインしたアカウントの名前を使用します。
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        as="link"
                                        href="/app/mypage"
                                        variant="secondary"
                                        size="md"
                                        rounded="md"
                                    >
                                        キャンセル
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                        rounded="md"
                                        disabled={saving || (isEmailRequired && !email.trim())}
                                    >
                                        {saving ? "保存中..." : "保存"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}


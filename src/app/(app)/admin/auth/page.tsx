"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("メールアドレスまたはパスワードが正しくありません。");
        setIsLoading(false);
        return;
      }

      if (!result?.ok) {
        setError("ログインに失敗しました。もう一度お試しください。");
        setIsLoading(false);
        return;
      }

      // セッションを更新してmustChangePasswordを取得
      try {
        const sessionRes = await fetch("/api/auth/session");
        
        if (!sessionRes.ok) {
          throw new Error("Failed to fetch session");
        }
        
        const sessionData = await sessionRes.json();

        // 初回ログイン時はパスワード変更ページにリダイレクト
        if (sessionData?.user?.mustChangePassword) {
          router.push("/admin/change-password");
          router.refresh();
        } else {
          // callbackUrlが指定されている場合はそれを使用、なければダッシュボードへ
          const redirectUrl = callbackUrl || "/admin/dashboard";
          router.push(redirectUrl);
          router.refresh();
        }
        // リダイレクト後はsetIsLoading(false)を呼ばない（ページ遷移するため）
      } catch (sessionError) {
        console.error("Failed to fetch session:", sessionError);
        // セッション取得に失敗した場合でも、ログインは成功している可能性があるため
        // ダッシュボードにリダイレクトを試みる
        const redirectUrl = callbackUrl || "/admin/dashboard";
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("ログインに失敗しました。もう一度お試しください。");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            管理画面ログイン
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            メールアドレスとパスワードでログインしてください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700"
            >
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700"
            >
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminAuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 mx-auto"></div>
            <p className="mt-2 text-sm text-zinc-600">読み込み中...</p>
          </div>
        </div>
      </div>
    }>
      <AdminAuthForm />
    </Suspense>
  );
}


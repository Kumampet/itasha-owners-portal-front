"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";

function AuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app/mypage";
  const [isLoading, setIsLoading] = useState<string | null>(null);


  const handleSignIn = async (provider: "google" | "twitter") => {
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(null);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">
            ログイン / 新規登録
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            痛車オーナーズポータルにログインして、イベント管理を始めましょう
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSignIn("google")}
            disabled={isLoading !== null}
            className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading === "google" ? "ログイン中..." : "Googleでログイン"}
          </button>
          <button
            onClick={() => handleSignIn("twitter")}
            disabled={isLoading !== null}
            className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading === "twitter" ? "ログイン中..." : "X（Twitter）でログイン"}
          </button>
        </div>

        <div className="text-center text-xs text-zinc-500">
          <p>
            ログインすることで、
            <Link href="/terms" className="underline hover:text-zinc-700">
              利用規約
            </Link>
            および
            <Link href="/privacy" className="underline hover:text-zinc-700">
              プライバシーポリシー
            </Link>
            に同意したものとみなされます。
          </p>
        </div>

        <div className="pt-4 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-600 underline hover:text-zinc-900"
          >
            トップページに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-zinc-900">
              ログイン / 新規登録
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              読み込み中...
            </p>
          </div>
        </div>
      </main>
    }>
      <AuthForm />
    </Suspense>
  );
}


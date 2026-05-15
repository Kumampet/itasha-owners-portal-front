"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { Button } from "@/components/button";

function AuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app/mypage";
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // 招待リンクからのアクセスかどうかを判定
  const isFromInviteLink = callbackUrl.includes("/app/groups/join");


  const handleSignIn = async (provider: "google" | "twitter") => {
    setIsLoading(provider);
    try {
      // NextAuth.js v5では、signIn関数はデフォルトでリダイレクトを実行しますが、
      // ローカル環境で問題が発生する場合があるため、redirect: falseにして手動でリダイレクト
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false, // リダイレクトを無効化して手動で制御
      });

      // リダイレクトが発生しない場合（エラーなど）のフォールバック
      if (result?.error) {
        console.error("Sign in error:", result.error);
        setIsLoading(null);
      } else if (result?.ok && result?.url) {
        // 認証URLが返された場合、手動でリダイレクト
        window.location.href = result.url;
      } else if (result?.ok) {
        // リダイレクトURLが返されない場合でも、リダイレクトを試みる
        // NextAuth.js v5では、signIn関数が成功した場合、自動的にリダイレクトされるはずですが、
        // ローカル環境で問題が発生する場合があるため、手動でリダイレクト
        window.location.href = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }
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
          {isFromInviteLink && (
            <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm text-emerald-800">
                団体への招待リンクからアクセスされました。<br />
                ログインを行っていただくと、団体への加入が可能になります。
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            variant="secondary"
            size="md"
            rounded="full"
            fullWidth
            onClick={() => handleSignIn("google")}
            disabled={isLoading !== null}
          >
            {isLoading === "google" ? "接続中..." : "Googleで利用する"}
          </Button>
          <Button
            variant="secondary"
            size="md"
            rounded="full"
            fullWidth
            onClick={() => handleSignIn("twitter")}
            disabled={isLoading !== null}
          >
            {isLoading === "twitter" ? "接続中..." : "Xアカウントで利用する"}
          </Button>
        </div>

        <div className="text-center text-xs text-zinc-500">
          <p>
            ログインすることで、
            <Link href="/term" className="underline hover:text-zinc-700">
              利用規約
            </Link>
            および
            <Link href="/privacy-policy" className="underline hover:text-zinc-700">
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


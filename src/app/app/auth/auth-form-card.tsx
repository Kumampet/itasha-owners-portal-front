"use client";

import Link from "next/link";
import { Button } from "@/components/button";

export type AuthFormCardProps = {
  isFromInviteLink: boolean;
  isLoading: string | null;
  onGoogle: () => void;
  onTwitter: () => void;
};

export function AuthFormCard({
  isFromInviteLink,
  isLoading,
  onGoogle,
  onTwitter,
}: AuthFormCardProps) {
  return (
    <div className="w-full space-y-7 rounded-2xl border border-border bg-card p-7 shadow-xl shadow-black/25 sm:p-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          ログイン / 新規登録
        </h1>
        <p className="text-sm text-muted-foreground">
          ご利用のアカウントでサインインしてください。
        </p>
      </div>

      {isFromInviteLink && (
        <div className="rounded-xl border border-accent-mint/30 bg-accent-mint/10 px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground">
            団体への招待リンクからアクセスされました。
            <br />
            ログイン後、団体への加入が可能になります。
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Button
          variant="secondary"
          size="md"
          rounded="full"
          fullWidth
          onClick={onGoogle}
          disabled={isLoading !== null}
        >
          {isLoading === "google" ? "接続中..." : "Googleで利用する"}
        </Button>
        <Button
          variant="secondary"
          size="md"
          rounded="full"
          fullWidth
          onClick={onTwitter}
          disabled={isLoading !== null}
        >
          {isLoading === "twitter" ? "接続中..." : "Xアカウントで利用する"}
        </Button>
      </div>

      <div className="border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        <p>
          ログインすることで、
          <Link href="/term" className="text-accent-mint underline-offset-2 hover:underline">
            利用規約
          </Link>
          および
          <Link href="/privacy" className="text-accent-mint underline-offset-2 hover:underline">
            プライバシーポリシー
          </Link>
          に同意したものとみなされます。
        </p>
        <p className="mt-3 text-center sm:text-left">
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
          >
            トップページに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}

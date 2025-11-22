"use client";

import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import Link from "next/link";

type AuthButtonProps = {
  eventId: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * 認証が必要なアクション用のボタンコンポーネント
 * 未ログイン時はログインページにリダイレクト
 */
export function AuthButton({ eventId, className, children }: AuthButtonProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <button
        disabled
        className={className}
      >
        {children}
      </button>
    );
  }

  if (!session) {
    return (
      <Link
        href={`/app/auth?callbackUrl=/events/${eventId}`}
        className={className}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={className}
      onClick={() => {
        // TODO: 実際の「気になる」機能を実装
        console.log("気になる機能を実装予定", eventId);
      }}
    >
      {children}
    </button>
  );
}


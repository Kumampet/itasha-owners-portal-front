"use client";

import { useSession } from "next-auth/react";
import { Tooltip } from "@/components/tooltip";

type AuthButtonProps = {
  eventId: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * 認証が必要なアクション用のボタンコンポーネント
 * 未ログイン時はDisableにしてツールチップを表示
 */
export function AuthButton({ eventId, className, children }: AuthButtonProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <button disabled className={className}>
        {children}
      </button>
    );
  }

  if (!session) {
    return (
      <Tooltip
        content="この機能はログインすることでご利用いただけます。"
        disabled={false}
        arrowPosition="right"
      >
        <button
          aria-disabled="true"
          onClick={(e) => {
            e.preventDefault();
          }}
          className={`${className} cursor-not-allowed opacity-50`}
        >
          {children}
        </button>
      </Tooltip>
    );
  }

  return (
    <button
      className={className}
      onClick={() => {
        // TODO: 実際の「気になる」機能を実装
        // 気になる機能を実装予定
      }}
    >
      {children}
    </button>
  );
}


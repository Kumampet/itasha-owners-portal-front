"use client";

import { useSession } from "next-auth/react";
import { Tooltip } from "@/components/tooltip";
import { Button } from "@/components/button";

type AuthButtonProps = {
  eventId: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * 認証が必要なアクション用のボタンコンポーネント
 * 未ログイン時はDisableにしてツールチップを表示
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AuthButton({ eventId: _eventId, className, children }: AuthButtonProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button disabled className={className}>
        {children}
      </Button>
    );
  }

  if (!session) {
    return (
      <Tooltip
        content="この機能はログインすることでご利用いただけます。"
        disabled={false}
        arrowPosition="right"
      >
        <Button
          disabled
          onClick={(e) => {
            e.preventDefault();
          }}
          className={className}
        >
          {children}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Button
      className={className}
      onClick={() => {
        // TODO: 実際の「気になる」機能を実装
        // 気になる機能を実装予定
      }}
    >
      {children}
    </Button>
  );
}


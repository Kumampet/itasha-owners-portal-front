"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";

type SideNavUserSectionProps = {
  onClose?: () => void;
};

export function SideNavUserSection({ onClose }: SideNavUserSectionProps) {
  const { data: session, status } = useSession();
  // 表示名を優先、なければ名前、それもなければメールアドレス、それもなければ「ゲスト」
  const displayName = session?.user?.displayName || session?.user?.name || session?.user?.email || "ゲスト";
  const isLoading = status === "loading";

  return (
    <div className="mb-4 min-h-[80px] rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      {isLoading ? (
        <div className="flex items-center justify-center py-2">
          <LoadingSpinner size="sm" />
        </div>
      ) : session ? (
        <>
          <div className="flex items-center gap-2">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt={displayName}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">
                {session.user?.displayName || session.user?.name || "ユーザー"}
              </p>
              {session.user?.email && session.user.email.trim() !== "" && (
                <p className="text-[10px] text-zinc-600 truncate">
                  {session.user.email}
                </p>
              )}
            </div>
          </div>
          <Button
            as="action"
            onClick={async () => {
              onClose?.();
              // ログアウト後は一般アプリのログインページにリダイレクト
              const redirectUrl = "/app/auth";

              // ログアウト処理
              await signOut({ redirect: false });

              // 完全なページリロードを行い、サーバーサイドのミドルウェアが確実に実行されるようにする
              // これにより、セッションがクリアされた状態でログインページにアクセスできる
              window.location.href = redirectUrl;
            }}
            className="mt-2 text-[10px] rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-700 hover:bg-zinc-100"
          >
            ログアウト
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-2">
          <p className="text-xs text-zinc-600 mb-2">ログインしてください</p>
          <Link
            href="/app/auth"
            onClick={onClose}
            className="w-full rounded-md bg-zinc-900 px-2 py-1.5 text-center text-[10px] font-medium text-white transition hover:bg-zinc-800"
          >
            ログイン
          </Link>
        </div>
      )}
    </div>
  );
}

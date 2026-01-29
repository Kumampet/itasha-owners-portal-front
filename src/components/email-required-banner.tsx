"use client";

import { useSession } from "next-auth/react";
import { Button } from "./button";

export function EmailRequiredBanner() {
  const { data: session, status } = useSession();

  // ローディング中は表示しない
  if (status === "loading") {
    return null;
  }

  // セッションがない場合は表示しない
  if (!session?.user) {
    return null;
  }

  // メールアドレスが設定されている場合は表示しない
  // emailがnullまたは空文字列の場合は未設定とみなす
  if (session.user.email && session.user.email.trim() !== "") {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[51] bg-red-50 border-t border-red-200 shadow-lg safe-bottom"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              メールアドレスを必ず設定してください。次回以降ログインができなくなる可能性があります。
            </p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Button
              as="link"
              href="/app/profile/edit"
              variant="danger"
              size="sm"
              rounded="md"
              className="w-full sm:w-auto"
            >
              設定する
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";

function NotificationSettingsPageContent() {
  const router = useRouter();

  useEffect(() => {
    // URL直打ち防止: マイページにリダイレクト
    router.replace("/app/mypage");
  }, [router]);

  // URL直打ち防止のため、常にローディング表示を返す
  // 将来的に再実装する場合は、git履歴から元のコードを参照してください
  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </section>
    </main>
  );
}

// 注意: このファイルは将来の再実装用に残されています
// 元のコードはgit履歴から参照できます

export default function NotificationSettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1">
          <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </section>
        </main>
      }
    >
      <NotificationSettingsPageContent />
    </Suspense>
  );
}

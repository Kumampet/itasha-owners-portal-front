"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (status === "loading" || hasRedirected.current) return;

    // 未ログインの場合は管理画面ログインページにリダイレクト
    if (!session) {
      hasRedirected.current = true;
      router.replace("/admin/auth?callbackUrl=/admin/dashboard");
      return;
    }

    // 管理者またはオーガナイザーのみアクセス可能
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      hasRedirected.current = true;
      router.replace("/app/mypage");
      return;
    }

    // ログイン済みの場合はダッシュボードにリダイレクト
    hasRedirected.current = true;
    router.replace("/admin/dashboard");
  }, [session, status, router]);

  // ローディング中
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}


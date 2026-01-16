"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { GroupJoinWarningModal } from "@/components/group-join-warning-modal";

function GroupJoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupCodeFromUrl = searchParams.get("groupCode") || "";

  const [groupCode, setGroupCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string>("");
  const [pendingGroupCode, setPendingGroupCode] = useState<string>("");
  const [error, setError] = useState<string>("");

  // URLからgroupCodeが渡された場合は自動的に設定
  useEffect(() => {
    if (groupCodeFromUrl) {
      // 8桁の数字のみを受け入れる
      const cleanedCode = groupCodeFromUrl.replace(/\D/g, "").slice(0, 8);
      setGroupCode(cleanedCode);
    }
  }, [groupCodeFromUrl]);

  useEffect(() => {
    document.title = "団体に加入 | 痛車オーナーズナビ | いたなび！";
  }, []);

  const handleJoin = async (force = false) => {
    const codeToUse = pendingGroupCode || groupCode;
    if (!codeToUse || codeToUse.length !== 8) {
      setError("8桁の団体コードを入力してください");
      return;
    }

    setError("");
    setJoining(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupCode: codeToUse,
          force: force,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "団体への加入に失敗しました");
      }

      const data = await res.json();

      // 警告メッセージがあり、確認が必要な場合
      if (data.warning && data.requiresConfirmation && !force) {
        setWarningMessage(data.warning);
        setPendingGroupCode(codeToUse);
        setShowWarningModal(true);
        setJoining(false);
        return;
      }

      // 加入成功時は団体詳細ページに遷移
      router.push(`/app/groups/${data.groupId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "団体への加入に失敗しました";
      setError(errorMessage);
    } finally {
      setJoining(false);
    }
  };

  const handleConfirmJoin = () => {
    setShowWarningModal(false);
    handleJoin(true);
  };

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <Link
            href="/app/groups"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← 団体一覧に戻る
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              既存の団体に加入する
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              団体オーナーから共有された8桁の団体コードを入力してください。団体コードは一意のため、これだけで特定の団体に加入できます。
            </p>
          </div>
        </header>

        <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1">
              団体コード（8桁）
            </label>
            <input
              type="text"
              value={groupCode}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, "").slice(0, 8);
                setGroupCode(cleaned);
                setError(""); // エラーをクリア
              }}
              placeholder="12345678"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              maxLength={8}
            />
            <p className="mt-1 text-xs text-zinc-500">
              団体オーナーから共有された8桁の数字を入力してください。団体コードは一意のため、これだけで特定の団体に加入できます。
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleJoin(false)}
              variant="primary"
              size="md"
              rounded="md"
              className="flex-1"
              disabled={joining || groupCode.length !== 8}
            >
              {joining ? "加入中..." : "加入する"}
            </Button>
            <Link
              href="/app/groups"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 whitespace-nowrap flex items-center"
            >
              キャンセル
            </Link>
          </div>
        </div>
      </section>

      <GroupJoinWarningModal
        isOpen={showWarningModal}
        onClose={() => {
          setShowWarningModal(false);
          setPendingGroupCode("");
        }}
        onConfirm={handleConfirmJoin}
        warningMessage={warningMessage}
      />
    </main>
  );
}

export default function GroupJoinPage() {
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
      <GroupJoinForm />
    </Suspense>
  );
}

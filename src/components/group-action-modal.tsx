"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GroupActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
};

export function GroupActionModal({
  isOpen,
  onClose,
  eventId,
}: GroupActionModalProps) {
  const router = useRouter();
  const [action, setAction] = useState<"create" | "join" | null>(null);
  const [groupCode, setGroupCode] = useState("");

  if (!isOpen) return null;

  const handleCreate = () => {
    router.push(`/app/groups/new?eventId=${eventId}`);
    onClose();
  };

  const handleJoin = async () => {
    if (!groupCode || groupCode.length !== 8) {
      alert("8桁の団体コードを入力してください");
      return;
    }

    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          groupCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "団体への加入に失敗しました");
      }

      const data = await res.json();
      router.push(`/app/groups/${data.groupId}`);
      onClose();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "団体への加入に失敗しました"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-6 shadow-lg max-w-sm w-full mx-4">
        {action === null ? (
          <>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              団体を組む
            </h2>
            <p className="mb-6 text-sm text-zinc-600">
              新規で団体を作成するか、既存の団体に加入してください。
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setAction("create")}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                新規で団体を組む
              </button>
              <button
                onClick={() => setAction("join")}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                既存の団体に加入する
              </button>
              <button
                onClick={onClose}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                キャンセル
              </button>
            </div>
          </>
        ) : action === "create" ? (
          <>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              新規で団体を組む
            </h2>
            <p className="mb-6 text-sm text-zinc-600">
              あなたが団体オーナーとなり、団体コードが自動で発行されます。
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                作成する
              </button>
              <button
                onClick={() => setAction(null)}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                戻る
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              既存の団体に加入する
            </h2>
            <p className="mb-2 text-sm text-zinc-600">
              団体オーナーから共有された8桁の団体コードを入力してください。
            </p>
            <input
              type="text"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="12345678"
              className="mb-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              maxLength={8}
            />
            <div className="flex gap-2">
              <button
                onClick={handleJoin}
                disabled={groupCode.length !== 8}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                加入する
              </button>
              <button
                onClick={() => {
                  setAction(null);
                  setGroupCode("");
                }}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                戻る
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


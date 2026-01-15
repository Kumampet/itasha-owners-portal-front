"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { GroupJoinWarningModal } from "./group-join-warning-modal";

type GroupActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GroupActionModal({
  isOpen,
  onClose,
}: GroupActionModalProps) {
  const router = useRouter();
  const [action, setAction] = useState<"create" | "join" | null>(null);
  const [groupCode, setGroupCode] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string>("");
  const [pendingGroupCode, setPendingGroupCode] = useState<string>("");
  const [joining, setJoining] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    router.push(`/app/groups/new`);
    onClose();
  };

  const handleJoin = async (force = false) => {
    const codeToUse = pendingGroupCode || groupCode;
    if (!codeToUse || codeToUse.length !== 8) {
      alert("8桁の団体コードを入力してください");
      return;
    }

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

      router.push(`/app/groups/${data.groupId}`);
      onClose();
      setGroupCode("");
      setPendingGroupCode("");
      setShowWarningModal(false);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "団体への加入に失敗しました"
      );
    } finally {
      setJoining(false);
    }
  };

  const handleConfirmJoin = () => {
    setShowWarningModal(false);
    handleJoin(true);
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
              <Button
                variant="primary"
                size="md"
                rounded="md"
                fullWidth
                onClick={() => setAction("create")}
              >
                新規で団体を組む
              </Button>
              <Button
                variant="secondary"
                size="md"
                rounded="md"
                fullWidth
                onClick={() => setAction("join")}
              >
                既存の団体に加入する
              </Button>
              <Button
                variant="secondary"
                size="md"
                rounded="md"
                fullWidth
                onClick={onClose}
              >
                キャンセル
              </Button>
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
              <Button
                variant="primary"
                size="md"
                rounded="md"
                className="flex-1"
                onClick={handleCreate}
              >
                作成する
              </Button>
              <Button
                variant="secondary"
                size="md"
                rounded="md"
                onClick={() => setAction(null)}
              >
                戻る
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              既存の団体に加入する
            </h2>
            <p className="mb-2 text-sm text-zinc-600">
              団体オーナーから共有された8桁の団体コードを入力してください。団体コードは一意のため、これだけで特定の団体に加入できます。
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
              <Button
                variant="primary"
                size="md"
                rounded="md"
                className="flex-1"
                onClick={() => handleJoin(false)}
                disabled={joining || groupCode.length !== 8}
              >
                {joining ? "加入中..." : "加入する"}
              </Button>
              <Button
                variant="secondary"
                size="md"
                rounded="md"
                onClick={() => {
                  setAction(null);
                  setGroupCode("");
                }}
              >
                戻る
              </Button>
            </div>
          </>
        )}
      </div>
      <GroupJoinWarningModal
        isOpen={showWarningModal}
        onClose={() => {
          setShowWarningModal(false);
          setPendingGroupCode("");
        }}
        onConfirm={handleConfirmJoin}
        warningMessage={warningMessage}
      />
    </div>
  );
}


"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { SafeMessageContent } from "@/components/safe-message-content";

type GroupOwnerNoteCardProps = {
  groupId: string;
  ownerNote: string | null;
  isLeader: boolean;
  onUpdate: () => void;
};

export function GroupOwnerNoteCard({
  groupId,
  ownerNote,
  isLeader,
  onUpdate,
}: GroupOwnerNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(ownerNote || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/owner-note`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerNote: editValue.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update owner note");
      }

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to update owner note:", error);
      alert(`お知らせの更新に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(ownerNote || "");
    setIsEditing(false);
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
          お知らせ
        </h2>
        {isLeader && !isEditing && (
          <Button
            variant="secondary"
            size="sm"
            rounded="md"
            onClick={() => setIsEditing(true)}
            className="whitespace-nowrap"
          >
            編集
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="お知らせを入力してください..."
            rows={6}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              rounded="md"
              onClick={handleCancel}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              size="sm"
              rounded="md"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {ownerNote ? (
            <div className="whitespace-pre-wrap break-words text-sm text-zinc-700">
              <SafeMessageContent
                content={ownerNote}
                className="whitespace-pre-wrap break-words"
                linkClassName="text-emerald-600 hover:text-emerald-700"
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              お知らせはまだありません
            </p>
          )}
        </div>
      )}
    </section>
  );
}

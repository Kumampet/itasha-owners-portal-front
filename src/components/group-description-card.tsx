"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/button";
import { SafeHtmlContent } from "@/components/safe-html-content";
import { WysiwygEditor } from "@/components/wysiwyg-editor";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import ConfirmModal from "@/components/confirm-modal";
import { useSnackbar } from "@/contexts/snackbar-context";

type GroupDescriptionCardProps = {
  groupId: string;
  groupDescription: string | null;
  isLeader: boolean;
  onUpdate: () => void;
};

/**
 * 団体説明カードコンポーネント（WYSIWYGエディタ統合）
 * 既存の「お知らせ」とは別に、新しく追加された「団体説明」機能
 */
export function GroupDescriptionCard({
  groupId,
  groupDescription,
  isLeader,
  onUpdate,
}: GroupDescriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(groupDescription || "");
  const [saving, setSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { showSnackbar } = useSnackbar();

  // 編集モードに入ったときに値をリセット
  useEffect(() => {
    if (isEditing) {
      setEditValue(groupDescription || "");
    }
  }, [isEditing, groupDescription]);

  // HTMLが実質的に空かどうかをチェック（<div><br></div>なども空とみなす）
  const isEmptyHtml = (html: string): boolean => {
    if (!html || !html.trim()) {
      return true;
    }

    // HTMLタグを除去してテキストのみを取得
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    // テキストが空、または空白文字のみの場合は空とみなす
    return !textContent.trim();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // エディターが空の場合はnullを送信してクリア
      if (isEmptyHtml(editValue)) {
        const res = await fetch(`/api/groups/${groupId}/description`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupDescription: null,
          }),
        });

        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to update group description");
          } else {
            const errorText = await res.text();
            console.error("API Error Response:", errorText);
            throw new Error(`サーバーエラーが発生しました (${res.status})`);
          }
        }

        await res.json();
        setIsEditing(false);
        onUpdate();
        return;
      }

      // クライアントサイドでサニタイズ（サーバーサイドでも再度サニタイズされる）
      const sanitizedValue = sanitizeHtml(editValue.trim());

      const res = await fetch(`/api/groups/${groupId}/description`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupDescription: sanitizedValue || null,
        }),
      });

      if (!res.ok) {
        // Content-Typeを確認してからJSONをパース
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update group description");
        } else {
          // HTMLエラーページが返された場合
          const errorText = await res.text();
          console.error("API Error Response:", errorText);
          throw new Error(`サーバーエラーが発生しました (${res.status})`);
        }
      }

      // レスポンスを読み込む（成功時はJSONが返される）
      await res.json();

      setIsEditing(false);
      onUpdate();
      showSnackbar("団体説明を保存しました", "success");
    } catch (error) {
      console.error("Failed to update group description:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      showSnackbar(`団体説明の更新に失敗しました: ${errorMessage}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const originalValue = groupDescription || "";
    return editValue !== originalValue;
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowCancelModal(true);
    } else {
      setEditValue(groupDescription || "");
      setIsEditing(false);
    }
  };

  const handleConfirmCancel = () => {
    setEditValue(groupDescription || "");
    setIsEditing(false);
    setShowCancelModal(false);
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
          団体説明
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
          {/* WYSIWYGエディタ */}
          <WysiwygEditor
            value={editValue}
            onChange={setEditValue}
            placeholder="団体説明を入力してください..."
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
          {groupDescription ? (
            <div className="prose prose-sm max-w-none">
              <SafeHtmlContent
                html={groupDescription}
                className="break-words text-sm text-zinc-700"
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              団体説明はまだありません
            </p>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="変更を破棄しますか？"
        message="変更内容が破棄されますがよろしいですか？"
        confirmLabel="破棄する"
        cancelLabel="キャンセル"
        buttonVariant="error"
      />
    </section>
  );
}

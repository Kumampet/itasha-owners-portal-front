"use client";

import { useState, useEffect } from "react";
import { ModalBase } from "./modal-base";
import { Button } from "./button";

type DisplayNameModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (displayName: string) => void;
  onLater: () => void;
  initialDisplayName?: string | null;
  showLaterButton?: boolean;
};

export function DisplayNameModal({
  isOpen,
  onClose,
  onSave,
  onLater,
  initialDisplayName,
  showLaterButton = true,
}: DisplayNameModalProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName || "");
  const [saving, setSaving] = useState(false);

  // モーダルが開かれたときに初期値を設定
  useEffect(() => {
    if (isOpen) {
      setDisplayName(initialDisplayName || "");
    }
  }, [isOpen, initialDisplayName]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      alert("表示名を入力してください");
      return;
    }

    // 全角50文字以内に制限
    const charCount = Array.from(displayName.trim()).length;
    if (charCount > 50) {
      alert("表示名は全角50文字以内で入力してください");
      return;
    }

    setSaving(true);
    try {
      await onSave(displayName.trim());
      setDisplayName("");
    } catch (error) {
      console.error("Failed to save display name:", error);
      alert("表示名の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="表示名を設定"
      footer={
        <>
          {showLaterButton ? (
            <Button
              variant="secondary"
              size="md"
              rounded="md"
              onClick={onLater}
            >
              あとで
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              rounded="md"
              onClick={onClose}
            >
              キャンセル
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            rounded="md"
            onClick={handleSave}
            disabled={saving || !displayName.trim()}
          >
            {saving ? "保存中..." : "保存"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-600">
          団体チャットなどで表示される表示名（ニックネーム）を設定できます。
          実名を公開したくない場合でも、この表示名で参加できます。
        </p>
        <p className="text-sm text-zinc-600">
          未設定の場合はログインしたアカウントの名前を使用します。
        </p>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            表示名（任意、全角50文字以内）
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              const value = e.target.value;
              // 全角50文字以内に制限
              const charCount = Array.from(value).length;
              if (charCount <= 50) {
                setDisplayName(value);
              }
            }}
            placeholder="例: 痛車太郎"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            maxLength={50}
          />
          <p className="mt-1 text-xs text-zinc-500">
            {Array.from(displayName).length} / 50文字
          </p>
        </div>
      </div>
    </ModalBase>
  );
}


"use client";

import { useState } from "react";
import { ModalBase } from "@/components/modal-base";
import { Button } from "@/components/button";

type UserDisplayNameModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (displayName: string | null) => void;
  currentDisplayName: string | null;
  userName: string;
};

export function UserDisplayNameModal({
  isOpen,
  onClose,
  onConfirm,
  currentDisplayName,
  userName,
}: UserDisplayNameModalProps) {
  const [displayName, setDisplayName] = useState(() => currentDisplayName || "");

  const handleConfirm = () => {
    onConfirm(displayName.trim() || null);
  };

  const charCount = Array.from(displayName).length;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="表示名変更"
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            rounded="md"
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            size="md"
            rounded="md"
            onClick={handleConfirm}
            disabled={charCount > 50}
          >
            変更
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-700">
          {userName}の表示名を変更します。
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
              const charCount = Array.from(value).length;
              if (charCount <= 50) {
                setDisplayName(value);
              }
            }}
            placeholder="例: 痛車太郎"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            maxLength={50}
          />
          <p className={`mt-1 text-xs ${charCount > 50 ? "text-red-600" : "text-zinc-500"}`}>
            {charCount} / 50文字
          </p>
        </div>
      </div>
    </ModalBase>
  );
}


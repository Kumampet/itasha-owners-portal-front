"use client";

import { ModalBase } from "./modal-base";
import { Button } from "./button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "success" | "error" | "info";
  showCancel?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "はい",
  cancelLabel = "いいえ",
  variant = "info",
  showCancel = true,
}: ConfirmModalProps) {
  const variantColors = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-zinc-600",
  };

  // onConfirmが指定されていない、またはshowCancelがfalseの場合はメッセージ表示モード（OKボタンのみ）
  const isMessageMode = !onConfirm || !showCancel;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          {showCancel && (
            <Button
              variant="secondary"
              size="md"
              rounded="md"
              onClick={onClose}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            rounded="md"
            onClick={handleConfirm}
          >
            {isMessageMode ? "OK" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {message.split("\n").map((line, index) => (
          <p key={index} className={`text-sm ${variantColors[variant]}`}>
            {line}
          </p>
        ))}
      </div>
    </ModalBase>
  );
}


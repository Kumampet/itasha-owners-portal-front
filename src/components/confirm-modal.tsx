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
  buttonVariant?: "success" | "error" | "info";
  titleVariant?: "success" | "error" | "info";
  messageVariant?: "success" | "error" | "info";
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
  buttonVariant = "info",
  titleVariant = "info",
  messageVariant = "info",
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

  // ボタンのvariantを決定（errorの場合はdanger、それ以外はprimary）
  const confirmButtonVariant = buttonVariant === "error" ? "danger" : buttonVariant === "success" ? "success" : "primary";
  // タイトルの色を決定
  const titleColor = titleVariant === "error" ? "text-red-600" : titleVariant === "success" ? "text-green-600" : "";

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className={titleColor || ""}>{title}</span>
      }
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
            variant={confirmButtonVariant}
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
          <p key={index} className={`text-sm ${variantColors[messageVariant]}`}>
            {line}
          </p>
        ))}
      </div>
    </ModalBase>
  );
}


"use client";

import { ModalBase } from "./modal-base";
import { Button } from "./button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "はい",
  cancelLabel = "いいえ",
}: ConfirmModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            rounded="md"
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            size="md"
            rounded="md"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {message.split("\n").map((line, index) => (
          <p key={index} className="text-sm text-zinc-600">
            {line}
          </p>
        ))}
      </div>
    </ModalBase>
  );
}


"use client";

import { ModalBase } from "./modal-base";

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
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {confirmLabel}
          </button>
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


"use client";

import { ModalBase } from "@/components/modal-base";
import { Button } from "@/components/button";

type UserRestoreModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
};

export function UserRestoreModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: UserRestoreModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="復帰"
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
            onClick={onConfirm}
          >
            復帰する
          </Button>
        </>
      }
    >
      <p className="text-sm text-zinc-700">
        {userName}を復帰させますか？
      </p>
    </ModalBase>
  );
}


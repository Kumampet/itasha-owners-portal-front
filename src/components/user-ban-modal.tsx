"use client";

import { ModalBase } from "@/components/modal-base";
import { Button } from "@/components/button";

type UserBanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isBanned: boolean;
  userName: string;
};

export function UserBanModal({
  isOpen,
  onClose,
  onConfirm,
  isBanned,
  userName,
}: UserBanModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={isBanned ? "BAN解除" : "BANする"}
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
            variant={isBanned ? "primary" : "danger"}
            size="md"
            rounded="md"
            onClick={onConfirm}
          >
            {isBanned ? "BAN解除" : "BANする"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-zinc-700">
        {isBanned
          ? `${userName}のBANを解除しますか？`
          : `${userName}をBANしますか？`}
      </p>
    </ModalBase>
  );
}


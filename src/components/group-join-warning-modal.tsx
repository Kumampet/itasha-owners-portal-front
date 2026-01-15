"use client";

import { ModalBase } from "./modal-base";
import { Button } from "./button";

interface GroupJoinWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  warningMessage: string;
}

export function GroupJoinWarningModal({
  isOpen,
  onClose,
  onConfirm,
  warningMessage,
}: GroupJoinWarningModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="既に他の団体に参加しています"
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
            継続して加入する
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            {warningMessage}
          </p>
        </div>
      </div>
    </ModalBase>
  );
}


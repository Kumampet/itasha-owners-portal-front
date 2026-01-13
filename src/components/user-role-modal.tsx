"use client";

import { useState, useEffect } from "react";
import { ModalBase } from "@/components/modal-base";
import { Button } from "@/components/button";

type UserRoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (role: string) => void;
  currentRole: string;
  userName: string;
};

export function UserRoleModal({
  isOpen,
  onClose,
  onConfirm,
  currentRole,
  userName,
}: UserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(currentRole);
    }
  }, [isOpen, currentRole]);

  const handleConfirm = () => {
    onConfirm(selectedRole);
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="権限変更"
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
            disabled={selectedRole === currentRole}
          >
            変更
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-700">
          {userName}の権限を変更します。
        </p>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            権限
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            <option value="USER">ユーザー</option>
            <option value="ADMIN">管理者</option>
            <option value="ORGANIZER">主催者</option>
          </select>
        </div>
      </div>
    </ModalBase>
  );
}


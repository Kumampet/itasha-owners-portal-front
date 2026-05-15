"use client";

import { ModalBase } from "@/components/modal-base";
import { Button } from "@/components/button";

type UserPermanentDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  email: string;
  name: string | null;
  displayName: string | null;
};

export function UserPermanentDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  email,
  name,
  displayName,
}: UserPermanentDeleteModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="完全削除"
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
            variant="danger"
            size="md"
            rounded="md"
            onClick={onConfirm}
          >
            完全削除する
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md bg-zinc-50 border border-zinc-200 p-4">
          <p className="text-sm font-medium text-zinc-900 mb-2">対象アカウント</p>
          <div className="space-y-1">
            <p className="text-sm text-zinc-700">
              <span className="font-medium">メールアドレス:</span> {email}
            </p>
            {name ? (
              <p className="text-sm text-zinc-700">
                <span className="font-medium">ユーザー名:</span> {name}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">
                <span className="font-medium">ユーザー名:</span> 未設定
              </p>
            )}
            {displayName ? (
              <p className="text-sm text-zinc-700">
                <span className="font-medium">表示名:</span> {displayName}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">
                <span className="font-medium">表示名:</span> 未設定
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-red-700 font-medium">
          警告: この操作は取り消せません
        </p>
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800 font-medium mb-2">
            完全削除を行うと：
          </p>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            <li>ユーザーアカウントと関連するすべてのデータが完全に削除されます</li>
            <li>この操作は取り消すことができません</li>
            <li>復帰することはできません</li>
          </ul>
        </div>
        <p className="text-sm text-zinc-600">
          本当に削除してもよろしいですか？
        </p>
      </div>
    </ModalBase>
  );
}


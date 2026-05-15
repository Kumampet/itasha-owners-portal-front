"use client";

import { ModalBase } from "@/components/modal-base";
import { Button } from "@/components/button";

type UserDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  email: string;
  name: string | null;
  displayName: string | null;
};

export function UserDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  email,
  name,
  displayName,
}: UserDeleteModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="このアカウントを論理削除しますか？"
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
            削除する
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md bg-card-elevated border border-border p-4">
          <p className="text-sm font-medium text-foreground mb-2">対象アカウント</p>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">メールアドレス:</span> {email}
            </p>
            {name ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">ユーザー名:</span> {name}
              </p>
            ) : (
              <p className="text-sm text-muted">
                <span className="font-medium">ユーザー名:</span> 未設定
              </p>
            )}
            {displayName ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">表示名:</span> {displayName}
              </p>
            ) : (
              <p className="text-sm text-muted">
                <span className="font-medium">表示名:</span> 未設定
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          このアカウントを論理削除します。<br />論理削除後は復帰することができます。
        </p>
      </div>
    </ModalBase>
  );
}


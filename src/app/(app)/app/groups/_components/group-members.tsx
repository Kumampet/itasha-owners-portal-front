"use client";

import { useState } from "react";
import { OwnerBadge } from "./owner-badge";
import { MemberActionMenu } from "@/components/member-action-menu";
import ConfirmModal from "@/components/confirm-modal";
import { useSnackbar } from "@/contexts/snackbar-context";

interface GroupMembersProps {
  groupId: string;
  group: {
    memberCount: number;
    maxMembers: number | null;
    isLeader: boolean;
    leader: {
      id: string;
    };
    members: Array<{
      id: string;
      name: string | null;
      displayName?: string | null;
      email: string;
      status: string;
    }>;
  };
  currentUserId?: string;
  onUpdate: () => void;
}

export function GroupMembers({
  groupId,
  group,
  currentUserId,
  onUpdate,
}: GroupMembersProps) {
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleRemoveMember = async () => {
    if (!targetMemberId) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${targetMemberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "メンバーの削除に失敗しました");
      }

      showSnackbar("メンバーを削除しました", "success");
      onUpdate(); // 団体情報を再取得
      setShowRemoveMemberModal(false);
      setTargetMemberId(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
      const errorMessage = error instanceof Error ? error.message : "メンバーの削除に失敗しました";
      showSnackbar(errorMessage, "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
            メンバー一覧
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            メンバー: {group.memberCount}
            {group.maxMembers && ` / ${group.maxMembers}人`}
          </p>
          <div className="mt-4 space-y-2 overflow-visible">
            {group.members.map((member) => {
              const isCurrentUser = member.id === currentUserId;
              const isLeader = group.isLeader;
              const canRemove = isLeader && member.id !== group.leader.id && !isCurrentUser;
              return (
                <div
                  key={member.id}
                  className={`relative flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 overflow-x-visible ${isCurrentUser && "overflow-hidden"}`}
                >
                  {isCurrentUser && (
                    <div className="absolute -left-4 top-1.5 w-16 bg-emerald-500 text-white text-[10px] font-semibold py-0.5 text-center transform -rotate-45 shadow-md">
                      You
                    </div>
                  )}
                  <div className={isCurrentUser ? "pl-6" : ""}>
                    <p className="text-sm font-medium text-zinc-900">
                      {member.displayName || member.name || "名前未設定"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.id === group.leader.id && <OwnerBadge />}
                    {canRemove && (
                      <MemberActionMenu
                        onRemoveClick={() => {
                          setTargetMemberId(member.id);
                          setShowRemoveMemberModal(true);
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={showRemoveMemberModal}
        onClose={() => {
          if (!processing) {
            setShowRemoveMemberModal(false);
            setTargetMemberId(null);
          }
        }}
        onConfirm={handleRemoveMember}
        title="メンバーを削除しますか？"
        message="このメンバーを団体から強制離脱させます。この操作は取り消せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        buttonVariant="error"
        disabled={processing}
      />
    </>
  );
}

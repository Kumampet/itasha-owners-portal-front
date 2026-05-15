"use client";

import { useState } from "react";
import ConfirmModal from "@/components/confirm-modal";
import { useSnackbar } from "@/contexts/snackbar-context";
import { MemberListCard } from "./member-list-card";

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
              return (
                <MemberListCard
                  key={member.id}
                  member={member}
                  isCurrentUser={isCurrentUser}
                  isLeader={group.isLeader}
                  leaderId={group.leader.id}
                  onRemoveClick={() => {
                    setTargetMemberId(member.id);
                    setShowRemoveMemberModal(true);
                  }}
                />
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

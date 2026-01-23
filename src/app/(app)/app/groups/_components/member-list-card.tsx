"use client";

import { OwnerBadge } from "./owner-badge";
import { MemberActionMenu } from "@/components/member-action-menu";

interface MemberListCardProps {
  member: {
    id: string;
    name: string | null;
    displayName?: string | null;
    email: string;
    status: string;
  };
  isCurrentUser: boolean;
  isLeader: boolean;
  leaderId: string;
  onRemoveClick: () => void;
}

export function MemberListCard({
  member,
  isCurrentUser,
  isLeader,
  leaderId,
  onRemoveClick,
}: MemberListCardProps) {
  const canRemove = isLeader && member.id !== leaderId && !isCurrentUser;

  return (
    <div
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
        {member.id === leaderId && <OwnerBadge />}
        {canRemove && (
          <MemberActionMenu
            onRemoveClick={onRemoveClick}
          />
        )}
      </div>
    </div>
  );
}

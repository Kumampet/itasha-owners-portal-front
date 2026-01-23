"use client";

import { OwnerBadge } from "./owner-badge";
import { MemberActionMenu } from "@/components/member-action-menu";

interface GroupMembersProps {
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
  onRemoveClick: (memberId: string) => void;
}

export function GroupMembers({
  group,
  currentUserId,
  onRemoveClick,
}: GroupMembersProps) {
  return (
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
                        onRemoveClick(member.id);
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
  );
}

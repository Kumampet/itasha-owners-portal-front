"use client";

import { Button } from "@/components/button";
import { GroupInviteLinkCopyButton } from "@/components/group-invite-link-copy-button";
import { GroupDescriptionCard } from "@/components/group-description-card";
import { GroupOwnerNoteCard } from "@/components/group-owner-note-card";

interface GroupContentsProps {
  group: {
    id: string;
    groupCode: string;
    groupDescription: string | null;
    ownerNote: string | null;
    isLeader: boolean;
  };
  isMember: boolean;
  joining: boolean;
  onJoin: (force: boolean) => void;
  onUpdate: () => void;
}

export function GroupContents({
  group,
  isMember,
  joining,
  onJoin,
  onUpdate,
}: GroupContentsProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
          団体コード
        </h2>
        <p className="mt-2 text-2xl font-mono font-semibold text-zinc-900">
          {group.groupCode}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          このコードを共有することで、他のメンバーがこの団体に加入できます。
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isMember && (
            <Button
              variant="primary"
              size="sm"
              rounded="md"
              onClick={() => onJoin(false)}
              disabled={joining}
              className="whitespace-nowrap"
            >
              {joining ? "加入中..." : "加入する"}
            </Button>
          )}
          <GroupInviteLinkCopyButton groupCode={group.groupCode} />
        </div>
      </section>

      <GroupDescriptionCard
        groupId={group.id}
        groupDescription={group.groupDescription}
        isLeader={group.isLeader}
        onUpdate={onUpdate}
      />

      <GroupOwnerNoteCard
        groupId={group.id}
        ownerNote={group.ownerNote}
        isLeader={group.isLeader}
        onUpdate={onUpdate}
      />
    </div>
  );
}

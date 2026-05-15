"use client";

import Link from "next/link";
import { OwnerBadge } from "./owner-badge";
import { UnreadBadge } from "@/components/unread-badge";

type Group = {
  id: string;
  name: string;
  theme: string | null;
  groupCode: string;
  maxMembers: number | null;
  memberCount: number;
  isLeader: boolean;
  event: {
    id: string;
    name: string;
    event_date: string;
  };
  leader: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
};

interface GroupListCardProps {
  group: Group;
  hasUnread: boolean;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function GroupListCard({ group, hasUnread }: GroupListCardProps) {
  return (
    <Link
      href={`/app/groups/${group.id}`}
      className="block rounded-lg border border-border bg-card p-4 transition hover:border-accent-mint/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {group.name}
            </h3>
            {group.isLeader && <OwnerBadge />}
            {hasUnread && <UnreadBadge />}
          </div>
          {group.theme && (
            <p className="mt-1 text-xs text-muted-foreground">{group.theme}</p>
          )}
          <p className="mt-2 text-xs text-muted">
            {group.event.name} / {formatDate(group.event.event_date)}
          </p>
          <p className="mt-1 text-xs text-muted">
            メンバー: {group.memberCount}
            {group.maxMembers && ` / ${group.maxMembers}`}人
          </p>
        </div>
        <div className="text-sm text-muted">→</div>
      </div>
    </Link>
  );
}

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
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              {group.name}
            </h3>
            {group.isLeader && <OwnerBadge />}
            {hasUnread && <UnreadBadge />}
          </div>
          {group.theme && (
            <p className="mt-1 text-xs text-zinc-600">{group.theme}</p>
          )}
          <p className="mt-2 text-xs text-zinc-500">
            {group.event.name} / {formatDate(group.event.event_date)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            メンバー: {group.memberCount}
            {group.maxMembers && ` / ${group.maxMembers}`}人
          </p>
        </div>
        <div className="text-sm text-zinc-500">→</div>
      </div>
    </Link>
  );
}

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Tooltip } from "@/components/tooltip";
import { GroupActionModal } from "@/components/group-action-modal";

type EventDetailActionsProps = {
  eventId: string;
};

export function EventDetailActions({ eventId }: EventDetailActionsProps) {
  const { data: session } = useSession();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <button className="flex-1 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800">
            エントリー情報を確認
          </button>
          {session ? (
            <button
              className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              onClick={() => {
                // TODO: 実際の「気になる」機能を実装
                // 気になる機能を実装予定
              }}
            >
              気になる
            </button>
          ) : (
            <Tooltip
              content="この機能はログインすることでご利用いただけます。"
              disabled={false}
              arrowPosition="right"
            >
              <button
                aria-disabled="true"
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 cursor-not-allowed opacity-50"
              >
                気になる
              </button>
            </Tooltip>
          )}
        </div>
        {session ? (
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="w-full rounded-full border-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            団体を組む
          </button>
        ) : (
          <Tooltip
            content="この機能はログインすることでご利用いただけます。"
            disabled={false}
            arrowPosition="right"
          >
            <button
              aria-disabled="true"
              onClick={(e) => {
                e.preventDefault();
              }}
              className="w-full rounded-full border-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 cursor-not-allowed opacity-50"
            >
              団体を組む
            </button>
          </Tooltip>
        )}
      </div>
      <GroupActionModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        eventId={eventId}
      />
    </>
  );
}


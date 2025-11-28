"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Tooltip } from "@/components/tooltip";
import { GroupActionModal } from "@/components/group-action-modal";
import { WatchlistButton } from "@/components/watchlist-button";
import { Button } from "@/components/button";

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
          <Button
            variant="primary"
            size="md"
            rounded="full"
            className="flex-1"
          >
            エントリー情報を確認
          </Button>
          <WatchlistButton
            eventId={eventId}
            className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          />
        </div>
        {session ? (
          <Button
            variant="emerald"
            size="md"
            rounded="full"
            fullWidth
            onClick={() => setIsGroupModalOpen(true)}
          >
            団体を組む
          </Button>
        ) : (
          <Tooltip
            content="この機能はログインすることでご利用いただけます。"
            disabled={false}
            arrowPosition="right"
          >
            <Button
              variant="emerald"
              size="md"
              rounded="full"
              fullWidth
              disabled
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              団体を組む
            </Button>
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


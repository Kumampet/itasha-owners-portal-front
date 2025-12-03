"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Tooltip } from "@/components/tooltip";
import { GroupActionModal } from "@/components/group-action-modal";
import { WatchlistButton } from "@/components/watchlist-button";
import { Button } from "@/components/button";

type EventDetailActionsProps = {
  eventId: string;
  officialUrls?: string[];
};

export function EventDetailActions({ eventId, officialUrls }: EventDetailActionsProps) {
  const { data: session } = useSession();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // 公式サイトURLの最初のものを取得
  const firstOfficialUrl = officialUrls && Array.isArray(officialUrls) && officialUrls.length > 0
    ? officialUrls[0]
    : null;

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          {firstOfficialUrl ? (
            <a
              href={firstOfficialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
            >
              イベント公式サイト
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ) : (
            <Button
              variant="primary"
              size="md"
              rounded="full"
              className="flex-1"
              disabled
            >
              イベント公式サイト
            </Button>
          )}
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


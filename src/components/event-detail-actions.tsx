"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/tooltip";
import { WatchlistButton } from "@/components/watchlist-button";
import { Button } from "@/components/button";

type EventDetailActionsProps = {
  eventId: string;
  officialUrls?: string[];
};

function ExternalLinkGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

const OFFICIAL_SITE_LINK_CLASS =
  "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full text-white bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2";

export function EventDetailActions({ eventId, officialUrls }: EventDetailActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const firstOfficialUrl =
    officialUrls?.find((url) => typeof url === "string" && url.trim().length > 0) ??
    null;

  const groupButton = (
    <Button
      variant="emerald"
      size="md"
      rounded="full"
      fullWidth
      disabled={!session}
      onClick={() => session && router.push("/app/groups")}
    >
      団体を組む
    </Button>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          as="link"
          className={OFFICIAL_SITE_LINK_CLASS}
          variant="secondary"
          size="md"
          rounded="full"
          href={firstOfficialUrl ?? ""}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!firstOfficialUrl}
        >
            イベント公式サイト
            <ExternalLinkGlyph />
        </Button>
        <WatchlistButton
          eventId={eventId}
          className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-card-elevated"
        />
      </div>
      {session ? (
        groupButton
      ) : (
        <Tooltip
          content="この機能はログインすることでご利用いただけます。"
          arrowPosition="right"
        >
          {groupButton}
        </Tooltip>
      )}
    </div>
  );
}

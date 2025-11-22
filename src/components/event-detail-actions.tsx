"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

type EventDetailActionsProps = {
  eventId: string;
};

export function EventDetailActions({ eventId }: EventDetailActionsProps) {
  const { data: session, status } = useSession();

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button className="flex-1 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800">
        エントリー情報を確認
      </button>
      {session ? (
        <button
          className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          onClick={() => {
            // TODO: 実際の「気になる」機能を実装
            console.log("気になる機能を実装予定", eventId);
          }}
        >
          気になる
        </button>
      ) : (
        <Link
          href={`/app/auth?callbackUrl=/events/${eventId}`}
          className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          ログインして気になる
        </Link>
      )}
    </div>
  );
}


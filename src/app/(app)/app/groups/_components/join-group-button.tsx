"use client";

import Link from "next/link";
import { Card } from "@/components/card";

export function JoinGroupButton() {
  return (
    <Link
      href="/app/groups/join"
      className="block transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <Card className="transition hover:border-zinc-900">
        <div className="flex items-center gap-3">
          {/* 加入アイコン */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
            <svg
              className="h-5 w-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900">
              既存団体に加入
            </h3>
          </div>
        </div>
      </Card>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { Card } from "@/components/card";

export function CreateGroupButton() {
  return (
    <Link
      href="/app/groups/new"
      className="block transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <Card className="transition hover:border-zinc-900">
        <div className="flex items-center gap-3">
          {/* 新規作成アイコン */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-5 w-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900">
              新規団体を作成
            </h3>
          </div>
        </div>
      </Card>
    </Link>
  );
}

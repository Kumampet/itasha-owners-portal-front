"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card } from "@/components/card";

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

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = "団体管理 | 痛車オーナーズナビ | いたなび！";
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchUnreadCounts();

    // 定期的に未読状態をチェック（10秒ごと）
    const interval = setInterval(fetchUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, []);


  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await fetch("/api/groups/unread-count");
      if (!res.ok) throw new Error("Failed to fetch unread counts");
      const data = await res.json();
      setUnreadCounts(data);
    } catch (error) {
      console.error("Failed to fetch unread counts:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <Link
            href="/app/mypage"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← マイページへ戻る
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              団体管理
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              イベントごとの団体参加（併せ）のメンバー募集・参加状況・一斉連絡を
              管理する画面です。
            </p>
          </div>

          {/* アクションボタン */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </header>

        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
              参加団体一覧
            </h2>
            {loading ? (
              <div className="mt-4 flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : groups.length === 0 ? (
              <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                まだ団体は登録されていません。イベント詳細ページから「団体を組む」ボタンで団体を作成または加入できます。
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/app/groups/${group.id}`}
                    className="block rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-zinc-900">
                            {group.name}
                          </h3>
                          {group.isLeader && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              オーナー
                            </span>
                          )}
                          {unreadCounts[group.id] && (
                            <span className="h-2 w-2 rounded-full bg-red-500" title="新着メッセージあり"></span>
                          )}
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
                ))}
              </div>
            )}
          </section>

          {/* <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
              一斉連絡ポリシー
            </h2>
            <ul className="mt-2 space-y-1 text-xs text-zinc-700 sm:text-sm">
              <li>・団体メッセージで「一斉連絡」として投稿すると、重要なメッセージとしてマークされます。</li>
            </ul>
          </section> */}
        </div>
      </section>
    </main>
  );
}


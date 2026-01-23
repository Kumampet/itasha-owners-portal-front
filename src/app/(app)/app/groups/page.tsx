"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { CreateGroupButton } from "./_components/create-group-button";
import { JoinGroupButton } from "./_components/join-group-button";
import { GroupListCard } from "./_components/group-list-card";

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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage =
          errorData.details || errorData.error || "Failed to fetch groups";
        throw new Error(errorMessage);
      }
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      // エラーをユーザーに表示（必要に応じて）
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
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
        </header>

        <div className="space-y-4">
          {/* アクションボタン */}
          <div className="grid grid-cols-2 gap-4">
            <CreateGroupButton />
            <JoinGroupButton />
          </div>
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
                  <GroupListCard
                    key={group.id}
                    group={group}
                    hasUnread={!!unreadCounts[group.id]}
                  />
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


"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

type GroupDetail = {
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
  members: Array<{
    id: string;
    name: string | null;
    email: string;
    status: string;
  }>;
  createdAt: string;
};

type GroupMessage = {
  id: string;
  content: string;
  isAnnouncement: boolean;
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
};

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = use(params);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "messages">("info");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  useEffect(() => {
    if (activeTab === "messages" && group) {
      fetchMessages();
    }
  }, [activeTab, group]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch group");
      }
      const data = await res.json();
      setGroup(data);
    } catch (error) {
      console.error("Failed to fetch group:", error);
      alert(`団体の取得に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/groups/${id}/messages`);
      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      alert("メッセージの取得に失敗しました");
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      alert("メッセージを入力してください");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/groups/${id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageContent,
          isAnnouncement: isAnnouncement,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const newMessage = await res.json();
      setMessages([newMessage, ...messages]);
      setMessageContent("");
      setIsAnnouncement(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert(`メッセージの送信に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
          </div>
        </section>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-sm text-zinc-600">団体が見つかりません</p>
            <Link
              href="/app/groups"
              className="mt-4 inline-block text-sm text-zinc-900 hover:underline"
            >
              ← 団体一覧に戻る
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <Link
            href="/app/groups"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← 団体一覧に戻る
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {group.name}
              </h1>
              {group.isLeader && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  オーナー
                </span>
              )}
            </div>
            {group.theme && (
              <p className="mt-1 text-xs text-zinc-600 sm:text-sm">{group.theme}</p>
            )}
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              {group.event.name} / {formatDate(group.event.event_date)}
            </p>
          </div>
        </header>

        {/* タブ */}
        <div className="flex gap-2 border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "info"
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            団体情報
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "messages"
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            団体メッセージ
          </button>
        </div>

        {/* タブコンテンツ */}
        {activeTab === "info" ? (
          <div className="space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                団体コード
              </h2>
              <p className="mt-2 text-2xl font-mono font-semibold text-zinc-900">
                {group.groupCode}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                このコードを共有することで、他のメンバーがこの団体に加入できます。
              </p>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                メンバー一覧
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                メンバー: {group.memberCount}
                {group.maxMembers && ` / ${group.maxMembers}人`}
              </p>
              <div className="mt-4 space-y-2">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {member.name || "名前未設定"}
                      </p>
                    </div>
                    {member.id === group.leader.id && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        オーナー
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            {/* メッセージ送信フォーム */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-zinc-900 sm:text-base mb-4">
                メッセージを送信
              </h2>
              <div className="space-y-3">
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="メッセージを入力してください..."
                  rows={4}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                {group.isLeader && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAnnouncement}
                      onChange={(e) => setIsAnnouncement(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-zinc-700">
                      一斉連絡として送信（メール通知も送信されます）
                    </span>
                  </label>
                )}
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageContent.trim()}
                  className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "送信中..." : "送信"}
                </button>
              </div>
            </section>

            {/* メッセージ一覧 */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-zinc-900 sm:text-base mb-4">
                メッセージ一覧
              </h2>
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
                </div>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  まだメッセージがありません
                </p>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-lg border p-4 ${
                        message.isAnnouncement
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-zinc-200 bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-900">
                              {message.sender.name || message.sender.email}
                            </p>
                            {message.isAnnouncement && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                一斉連絡
                              </span>
                            )}
                            {message.sender.id === session?.user?.id && (
                              <span className="text-xs text-zinc-500">（あなた）</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500">
                            {formatDateTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}


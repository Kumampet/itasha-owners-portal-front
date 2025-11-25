"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ConfirmModal from "@/components/confirm-modal";
import { TransferOwnershipModal } from "@/components/transfer-ownership-modal";

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
  const [showDisbandModal, setShowDisbandModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  useEffect(() => {
    if (activeTab === "messages" && group) {
      fetchMessages();
    }
  }, [activeTab, group]);

  // メッセージ読み込み後にスクロールを最下部に移動
  useEffect(() => {
    if (messages.length > 0 && !messagesLoading) {
      setTimeout(() => {
        const messagesContainer = document.querySelector('[data-messages-container]');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    }
  }, [messages, messagesLoading]);

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

    // 全角文字換算で1000文字を超える場合はエラー
    const charCount = Array.from(messageContent).length;
    if (charCount > 1000) {
      alert("メッセージは全角1000文字以内で入力してください");
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
      // 新しいメッセージを追加（配列の最後に追加）
      setMessages([...messages, newMessage]);
      setMessageContent("");
      setIsAnnouncement(false);
      
      // スクロールを最下部に移動
      setTimeout(() => {
        const messagesContainer = document.querySelector('[data-messages-container]');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
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
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const truncateName = (name: string | null, maxLength: number = 12): string => {
    if (!name) return "名前未設定";
    const nameArray = Array.from(name);
    if (nameArray.length <= maxLength) return name;
    return nameArray.slice(0, maxLength).join("") + "...";
  };

  const handleDisband = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "団体の解散に失敗しました");
      }

      alert("団体を解散しました");
      router.push("/app/groups");
    } catch (error) {
      console.error("Failed to disband group:", error);
      alert(`団体の解散に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setProcessing(false);
      setShowDisbandModal(false);
    }
  };

  const handleTransferOwnership = async (newLeaderId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/groups/${id}/transfer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newLeaderId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "権限の譲渡に失敗しました");
      }

      alert("オーナー権限を譲渡しました");
      fetchGroup(); // 団体情報を再取得
    } catch (error) {
      console.error("Failed to transfer ownership:", error);
      alert(`権限の譲渡に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setProcessing(false);
      setShowTransferModal(false);
    }
  };

  const handleLeave = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/groups/${id}/leave`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "団体からの脱退に失敗しました");
      }

      alert("団体を抜けました");
      router.push("/app/groups");
    } catch (error) {
      console.error("Failed to leave group:", error);
      alert(`団体からの脱退に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setProcessing(false);
      setShowLeaveModal(false);
    }
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
    <main className="flex-1 overflow-hidden">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8 h-full">
        <header className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Link
                href="/app/groups"
                className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
              >
                ← 団体一覧に戻る
              </Link>
              <div className="mt-2">
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
            </div>
            <div className="flex flex-col gap-2">
              {group.isLeader ? (
                <>
                  <button
                    onClick={() => setShowDisbandModal(true)}
                    disabled={processing}
                    className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
                  >
                    解散する
                  </button>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    disabled={processing}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 whitespace-nowrap"
                  >
                    オーナー権限譲渡
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLeaveModal(true)}
                  disabled={processing}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 whitespace-nowrap"
                >
                  団体を抜ける
                </button>
              )}
            </div>
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
          <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px] sm:h-[calc(100vh-300px)] sm:min-h-[500px] overflow-hidden">
            {/* メッセージ一覧（スクロール可能） */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3 pb-24 sm:pb-4" data-messages-container>
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
                </div>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  まだメッセージがありません
                </p>
              ) : (
                // メッセージを表示（古い順）
                messages.map((message) => {
                  const isOwnMessage = message.sender.id === session?.user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[75vw] sm:max-w-[75%] rounded-2xl px-4 py-2 break-words ${
                          isOwnMessage
                            ? message.isAnnouncement
                              ? "bg-emerald-500 text-white"
                              : "bg-zinc-900 text-white"
                            : message.isAnnouncement
                            ? "bg-emerald-50 border border-emerald-200 text-zinc-900"
                            : "bg-zinc-100 text-zinc-900"
                        }`}
                      >
                        {message.isAnnouncement && (
                          <p className="text-xs font-medium mb-1 opacity-80">
                            一斉連絡
                          </p>
                        )}
                        <p
                          className={`text-sm whitespace-pre-wrap break-words ${
                            isOwnMessage ? "text-white" : "text-zinc-700"
                          }`}
                        >
                          {message.content}
                        </p>
                      </div>
                      <div className={`mt-1 px-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                        <p className="text-xs text-zinc-500">
                          {truncateName(message.sender.name)} {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* メッセージ送信フォーム（固定） */}
            <div className="border-t border-zinc-200 bg-white p-4 flex-shrink-0">
              {group.isLeader && (
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={isAnnouncement}
                    onChange={(e) => setIsAnnouncement(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-zinc-700">
                    一斉連絡として送信（メール通知も送信されます）
                  </span>
                </label>
              )}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <textarea
                    value={messageContent}
                    onChange={(e) => {
                      const value = e.target.value;
                      // 全角文字換算で1000文字を超える場合は制限
                      const charCount = Array.from(value).length;
                      if (charCount <= 1000) {
                        setMessageContent(value);
                      }
                    }}
                    placeholder="メッセージを入力してください..."
                    rows={2}
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (messageContent.trim() && !sending) {
                          handleSendMessage();
                        }
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !messageContent.trim()}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap self-end"
                  >
                    {sending ? "送信中..." : "送信"}
                  </button>
                </div>
                <div className="flex justify-end">
                  <p className="text-xs text-zinc-500">
                    {Array.from(messageContent).length} / 1000文字
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* モーダル */}
        <ConfirmModal
          isOpen={showDisbandModal}
          onClose={() => setShowDisbandModal(false)}
          onConfirm={handleDisband}
          title="団体を解散しますか？"
          message="本当に団体を解散しますか？解散すると二度と復元できません。"
          confirmLabel="解散する"
          cancelLabel="キャンセル"
        />

        <TransferOwnershipModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onConfirm={handleTransferOwnership}
          members={group.members}
          currentUserId={session?.user?.id || ""}
        />

        <ConfirmModal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          onConfirm={handleLeave}
          title="団体を抜けますか？"
          message="本当に団体を抜けますか？抜けると再度団体コードを入力しないと復帰できません。"
          confirmLabel="抜ける"
          cancelLabel="キャンセル"
        />
      </section>
    </main>
  );
}


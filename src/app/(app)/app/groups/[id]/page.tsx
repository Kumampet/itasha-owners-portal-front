"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ConfirmModal from "@/components/confirm-modal";
import { TransferOwnershipModal } from "@/components/transfer-ownership-modal";
import { Button } from "@/components/button";
import { Tabs, Tab } from "@/components/tabs";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useWebSocketAmplify, useWebSocketMessageHandler } from "@/lib/websocket-amplify";

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
    displayName?: string | null;
    email: string;
  };
  members: Array<{
    id: string;
    name: string | null;
    displayName?: string | null;
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
    displayName?: string | null;
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
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const { socket, isConnected } = useWebSocketAmplify(activeTab === "messages" ? id : null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const fetchGroup = useCallback(async () => {
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
  }, [id]);

  const fetchMessages = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setMessagesLoading(true);
    }
    try {
      const res = await fetch(`/api/groups/${id}/messages`);
      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await res.json();
      
      // 初回読み込み時はそのまま更新（スクロールはuseEffectで処理）
      if (isInitialLoad) {
        setMessages(data);
        setMessagesLoading(false);
        return;
      }

      // ポーリング時は新規メッセージがある場合のみ更新
      setMessages((currentMessages) => {
        if (currentMessages.length === 0) {
          return data;
        }

        const currentMessageIds = new Set(currentMessages.map(m => m.id));
        const newMessages = data.filter((msg: GroupMessage) => !currentMessageIds.has(msg.id));
        
        if (newMessages.length === 0) {
          // 新規メッセージがない場合は更新しない
          return currentMessages;
        }

        // スクロール位置を保存
        const messagesContainer = document.querySelector('[data-messages-container]');
        if (!messagesContainer) {
          return data;
        }

        const wasAtBottom = Math.abs(
          messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight
        ) < 50;
        const previousScrollTop = messagesContainer.scrollTop;
        const previousScrollHeight = messagesContainer.scrollHeight;

        // 新規メッセージを追加
        const updatedMessages = data;

        // スクロール位置を復元（最下部にいた場合は最下部に移動）
        requestAnimationFrame(() => {
          const container = document.querySelector('[data-messages-container]');
          if (!container) return;

          if (wasAtBottom) {
            // 最下部にいた場合は新しいメッセージの最下部にスクロール
            container.scrollTop = container.scrollHeight;
          } else {
            // それ以外の場合は元の位置を維持（新しいメッセージ分の高さを考慮）
            const heightDiff = container.scrollHeight - previousScrollHeight;
            container.scrollTop = previousScrollTop + heightDiff;
          }
        });

        return updatedMessages;
      });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      if (isInitialLoad) {
        alert("メッセージの取得に失敗しました");
        setMessagesLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // WebSocket接続時のメッセージ受信処理
  const handleNewMessage = useCallback((data: { groupId: string; message: GroupMessage }) => {
    if (data.groupId !== id) {
      return;
    }

    setMessages((currentMessages) => {
      // 既に存在するメッセージは追加しない
      const exists = currentMessages.some((msg) => msg.id === data.message.id);
      if (exists) {
        return currentMessages;
      }

      // 新しいメッセージを追加
      const updatedMessages = [...currentMessages, data.message];

      // スクロール位置を保存
      const container = messagesContainerRef.current;
      if (!container) {
        return updatedMessages;
      }

      const wasAtBottom = Math.abs(
        container.scrollHeight - container.scrollTop - container.clientHeight
      ) < 50;

      // スクロール位置を復元（最下部にいた場合は最下部に移動）
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        if (wasAtBottom) {
          container.scrollTop = container.scrollHeight;
        }
      });

      return updatedMessages;
    });
  }, [id]);

  const handleReadUpdated = useCallback((data: { groupId: string; userId: string; messageId: string }) => {
    if (data.groupId !== id) {
      return;
    }

    // 自分が既読にした場合は未読バッジを消す
    if (data.userId === session?.user?.id) {
      setHasUnreadMessages(false);
    }
  }, [id, session?.user?.id]);

  useWebSocketMessageHandler(socket, handleNewMessage, handleReadUpdated);

  // 未読メッセージの状態を取得（メッセージタブが開いていない場合のみ）
  useEffect(() => {
    // メッセージタブが開いている場合は、WebSocketで処理されるので監視不要
    if (activeTab === "messages") {
      return;
    }

    const fetchUnreadStatus = async () => {
      try {
        const res = await fetch("/api/groups/unread-count");
        if (!res.ok) return;
        const data = await res.json();
        // 現在の団体に未読メッセージがあるかチェック
        setHasUnreadMessages(data[id] === true);
      } catch (error) {
        console.error("Failed to fetch unread status:", error);
      }
    };

    if (id) {
      fetchUnreadStatus();
      // WebSocketが利用できない場合のフォールバックとして、定期的に未読状態をチェック（30秒ごと）
      const interval = setInterval(fetchUnreadStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [id, activeTab]);

  // メッセージタブが開いているときは初回のみメッセージを取得
  useEffect(() => {
    if (activeTab === "messages" && group && messages.length === 0) {
      // 初回取得（ローディング表示あり）
      fetchMessages(true);
    }
  }, [activeTab, group, fetchMessages, messages.length]);

  // メッセージタブが開かれたとき、またはメッセージが読み込まれたときに最新メッセージにスクロール
  useEffect(() => {
    if (activeTab === "messages" && messages.length > 0 && !messagesLoading) {
      // メッセージが読み込まれた後に最新メッセージ（最下部）にスクロール
      const scrollToBottom = () => {
        const messagesContainer = document.querySelector('[data-messages-container]');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      };

      // DOM更新を待ってからスクロール
      setTimeout(scrollToBottom, 100);
    }
  }, [activeTab, messages.length, messagesLoading]);

  // メッセージを表示したときに既読状態を更新
  useEffect(() => {
    if (activeTab === "messages" && messages.length > 0) {
      // 最新メッセージを既読にする
      const latestMessage = messages[messages.length - 1];
      if (latestMessage) {
        fetch(`/api/groups/${id}/messages/${latestMessage.id}/read`, {
          method: "POST",
        })
          .then(() => {
            // 既読にしたら未読バッジを消す（WebSocketでも処理されるが、念のため）
            setHasUnreadMessages(false);
          })
          .catch((error) => {
            console.error("Failed to mark message as read:", error);
          });
      }
    }
  }, [activeTab, messages, id]);

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
      // WebSocketでブロードキャストされるので、ここでは追加しない
      // ただし、WebSocketが接続されていない場合のフォールバックとして追加
      if (!isConnected) {
        setMessages([...messages, newMessage]);
      }
      setMessageContent("");
      setIsAnnouncement(false);

      // 自分が送信したメッセージなので未読バッジは消す
      setHasUnreadMessages(false);

      // スクロールを最下部に移動
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
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

  const handleRemoveMember = async () => {
    if (!targetMemberId) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/groups/${id}/members/${targetMemberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "メンバーの削除に失敗しました");
      }

      alert("メンバーを削除しました");
      fetchGroup(); // 団体情報を再取得
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert(`メンバーの削除に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setProcessing(false);
      setShowRemoveMemberModal(false);
      setTargetMemberId(null);
    }
  };

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : !group ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-sm text-zinc-600">団体が見つかりません</p>
            <Link
              href="/app/groups"
              className="mt-4 inline-block text-sm text-emerald-600 hover:text-emerald-700"
            >
              団体一覧に戻る
            </Link>
          </div>
        ) : (
          <>
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
                      <Button
                        variant="danger"
                        size="sm"
                        rounded="md"
                        onClick={() => setShowDisbandModal(true)}
                        disabled={processing}
                        className="whitespace-nowrap"
                      >
                        解散する
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        rounded="md"
                        onClick={() => setShowTransferModal(true)}
                        disabled={processing}
                        className="whitespace-nowrap"
                      >
                        オーナー権限譲渡
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      rounded="md"
                      onClick={() => setShowLeaveModal(true)}
                      disabled={processing}
                      className="whitespace-nowrap"
                    >
                      団体を抜ける
                    </Button>
                  )}
                </div>
              </div>
            </header>

            {/* タブ */}
            <Tabs>
              <Tab
                isActive={activeTab === "info"}
                onClick={() => setActiveTab("info")}
              >
                団体情報
              </Tab>
              <Tab
                isActive={activeTab === "messages"}
                onClick={() => setActiveTab("messages")}
                badge={hasUnreadMessages}
              >
                団体チャット
              </Tab>
            </Tabs>

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
                    {group.members.map((member) => {
                      const isCurrentUser = member.id === session?.user?.id;
                      const isLeader = group.isLeader;
                      const canRemove = isLeader && member.id !== group.leader.id && !isCurrentUser;
                      return (
                        <div
                          key={member.id}
                          className="relative flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 overflow-hidden"
                        >
                          {isCurrentUser && (
                            <div className="absolute -left-4 top-1.5 w-16 bg-emerald-500 text-white text-[10px] font-semibold py-0.5 text-center transform -rotate-45 shadow-md">
                              You
                            </div>
                          )}
                          <div className={isCurrentUser ? "pl-6" : ""}>
                            <p className="text-sm font-medium text-zinc-900">
                              {member.displayName || member.name || "名前未設定"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.id === group.leader.id && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                オーナー
                              </span>
                            )}
                            {canRemove && (
                              <Button
                                variant="danger"
                                size="sm"
                                rounded="md"
                                onClick={() => {
                                  setTargetMemberId(member.id);
                                  setShowRemoveMemberModal(true);
                                }}
                                disabled={processing}
                                className="text-xs"
                              >
                                削除
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px] sm:h-[calc(100vh-300px)] sm:min-h-[500px] overflow-hidden">
                {/* メッセージ一覧（スクロール可能） */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3 pb-24 sm:pb-4" 
                  data-messages-container
                >
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner size="md" />
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
                            className={`max-w-[75vw] sm:max-w-[75%] rounded-2xl px-4 py-2 break-words ${isOwnMessage
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
                              className={`text-sm whitespace-pre-wrap break-words ${isOwnMessage ? "text-white" : "text-zinc-700"
                                }`}
                            >
                              {message.content}
                            </p>
                          </div>
                          <div className={`mt-1 px-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                            <p className="text-xs text-zinc-500">
                              {truncateName(message.sender.displayName || message.sender.name)} {formatDateTime(message.createdAt)}
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
                        一斉連絡として送信
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
                      <Button
                        variant="primary"
                        size="md"
                        rounded="md"
                        onClick={handleSendMessage}
                        disabled={sending || !messageContent.trim()}
                        className="whitespace-nowrap self-end"
                      >
                        {sending ? "送信中..." : "送信"}
                      </Button>
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

            <ConfirmModal
              isOpen={showRemoveMemberModal}
              onClose={() => {
                setShowRemoveMemberModal(false);
                setTargetMemberId(null);
              }}
              onConfirm={handleRemoveMember}
              title="メンバーを削除しますか？"
              message="このメンバーを団体から強制離脱させます。この操作は取り消せません。"
              confirmLabel="削除する"
              cancelLabel="キャンセル"
            />
          </>
        )}
      </section>
    </main>
  );
}


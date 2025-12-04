"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import ConfirmModal from "@/components/confirm-modal";

type Group = {
  id: string;
  name: string;
  theme: string | null;
  groupCode: string;
  maxMembers: number | null;
  memberCount: number;
  messageCount: number;
  event: {
    id: string;
    name: string;
    event_date: string;
  };
  leader: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string;
  };
  createdAt: string;
};

type GroupDetail = Group & {
  members: Array<{
    id: string;
    name: string | null;
    displayName: string | null;
    email: string;
    status: string;
  }>;
  messages: Array<{
    id: string;
    content: string;
    isAnnouncement: boolean;
    sender: {
      id: string;
      name: string | null;
      displayName: string | null;
      email: string;
    };
    createdAt: string;
  }>;
};

export default function AdminGroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [selectedGroupLoading, setSelectedGroupLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [showChangeLeaderModal, setShowChangeLeaderModal] = useState(false);
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [newLeaderId, setNewLeaderId] = useState<string>("");

  useEffect(() => {
    document.title = "いたなび管理画面 | 団体モデレーション";
  }, []);

  // adminのみアクセス可能
  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;
    if (session.user?.role !== "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const res = await fetch(`/api/admin/groups?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      alert("団体の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const fetchGroupDetail = useCallback(async (groupId: string) => {
    setSelectedGroupLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`);
      if (!res.ok) throw new Error("Failed to fetch group detail");
      const data = await res.json();
      setSelectedGroup(data);
    } catch (error) {
      console.error("Failed to fetch group detail:", error);
      alert("団体詳細の取得に失敗しました");
    } finally {
      setSelectedGroupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading" || !session || session.user?.role !== "ADMIN") {
      return;
    }
    fetchGroups();
  }, [fetchGroups, session, status]);

  const handleDeleteMessage = async () => {
    if (!selectedGroup || !targetMessageId) return;

    setProcessing(true);
    try {
      const res = await fetch(
        `/api/admin/groups/${selectedGroup.id}/messages/${targetMessageId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete message");
      await fetchGroupDetail(selectedGroup.id);
      setShowDeleteMessageModal(false);
      setTargetMessageId(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("メッセージの削除に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedGroup || !targetUserId) return;

    setProcessing(true);
    try {
      const res = await fetch(
        `/api/admin/groups/${selectedGroup.id}/members/${targetUserId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove member");
      }
      await fetchGroupDetail(selectedGroup.id);
      setShowRemoveMemberModal(false);
      setTargetUserId(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert(
        `メンバーの削除に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleChangeLeader = async () => {
    if (!selectedGroup || !newLeaderId) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/leader`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newLeaderId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to change leader");
      }
      await fetchGroupDetail(selectedGroup.id);
      setShowChangeLeaderModal(false);
      setNewLeaderId("");
    } catch (error) {
      console.error("Failed to change leader:", error);
      alert(
        `リーダーの変更に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setProcessing(false);
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

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
          団体モデレーション
        </h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          すべての団体のチャット内容と参加ユーザーを管理します
        </p>
      </div>

      {/* 検索 */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
        <input
          type="text"
          placeholder="団体名、団体コード、テーマで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 団体一覧 */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            団体一覧
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
              <p className="text-sm text-zinc-600">団体がありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => fetchGroupDetail(group.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    selectedGroup?.id === group.id
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-zinc-900">
                        {group.name}
                      </p>
                      {group.theme && (
                        <p className="mt-1 text-xs text-zinc-600">{group.theme}</p>
                      )}
                      <p className="mt-1 text-xs text-zinc-500">
                        {group.event.name} / {formatDate(group.event.event_date)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        メンバー: {group.memberCount}
                        {group.maxMembers && ` / ${group.maxMembers}人`} | メッセージ: {group.messageCount}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                      {group.groupCode}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 団体詳細 */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            団体詳細
          </h2>
          {selectedGroupLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !selectedGroup ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
              <p className="text-sm text-zinc-600">
                左側の団体を選択してください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 団体情報 */}
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-zinc-900">
                  {selectedGroup.name}
                </h3>
                {selectedGroup.theme && (
                  <p className="mt-1 text-xs text-zinc-600">{selectedGroup.theme}</p>
                )}
                <p className="mt-2 text-xs text-zinc-500">
                  団体コード: {selectedGroup.groupCode}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  リーダー: {selectedGroup.leader.displayName || selectedGroup.leader.name || selectedGroup.leader.email}
                </p>
              </div>

              {/* メンバー一覧 */}
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900">
                  メンバー一覧 ({selectedGroup.members.length}人)
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedGroup.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded border border-zinc-200 bg-zinc-50 p-2"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-medium text-zinc-900">
                          {member.displayName || member.name || "名前未設定"}
                        </p>
                        <p className="text-xs text-zinc-500">{member.email}</p>
                      </div>
                      <div className="flex gap-1">
                        {member.id === selectedGroup.leader.id && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            リーダー
                          </span>
                        )}
                        {member.id !== selectedGroup.leader.id && (
                          <>
                            <Button
                              variant="danger"
                              size="sm"
                              rounded="md"
                              onClick={() => {
                                setTargetUserId(member.id);
                                setShowRemoveMemberModal(true);
                              }}
                              disabled={processing}
                              className="text-xs"
                            >
                              削除
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              rounded="md"
                              onClick={() => {
                                setNewLeaderId(member.id);
                                setShowChangeLeaderModal(true);
                              }}
                              disabled={processing}
                              className="text-xs"
                            >
                              リーダーに
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* チャットメッセージ */}
              <div className="rounded-lg border border-zinc-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900">
                  チャットメッセージ ({selectedGroup.messages.length}件)
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedGroup.messages.length === 0 ? (
                    <p className="py-4 text-center text-xs text-zinc-500">
                      メッセージがありません
                    </p>
                  ) : (
                    selectedGroup.messages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded border border-zinc-200 bg-zinc-50 p-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-zinc-900">
                                {message.sender.displayName || message.sender.name || message.sender.email}
                              </p>
                              {message.isAnnouncement && (
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                  一斉連絡
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-zinc-700 whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {formatDateTime(message.createdAt)}
                            </p>
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            rounded="md"
                            onClick={() => {
                              setTargetMessageId(message.id);
                              setShowDeleteMessageModal(true);
                            }}
                            disabled={processing}
                            className="text-xs"
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* モーダル */}
      <ConfirmModal
        isOpen={showDeleteMessageModal}
        onClose={() => {
          setShowDeleteMessageModal(false);
          setTargetMessageId(null);
        }}
        onConfirm={handleDeleteMessage}
        title="メッセージを削除しますか？"
        message="この操作は取り消せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
      />

      <ConfirmModal
        isOpen={showRemoveMemberModal}
        onClose={() => {
          setShowRemoveMemberModal(false);
          setTargetUserId(null);
        }}
        onConfirm={handleRemoveMember}
        title="メンバーを強制離脱させますか？"
        message="この操作は取り消せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
      />

      <ConfirmModal
        isOpen={showChangeLeaderModal}
        onClose={() => {
          setShowChangeLeaderModal(false);
          setNewLeaderId("");
        }}
        onConfirm={handleChangeLeader}
        title="リーダーを変更しますか？"
        message="この操作は取り消せません。"
        confirmLabel="変更する"
        cancelLabel="キャンセル"
      />
    </div>
  );
}


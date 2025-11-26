"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ModalBase } from "@/components/modal-base";

type Contact = {
  id: string;
  title: string;
  name: string;
  email: string;
  content: string;
  status: string;
  admin_note: string | null;
  submitter: {
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
};

type FilterStatus = "ALL" | "PENDING" | "PROCESSING" | "RESOLVED";
type SortBy = "created_at" | "title" | "name";
type SortOrder = "asc" | "desc";

export default function AdminContactsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("PENDING");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState("");

  // adminのみアクセス可能
  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;
    if (session.user?.role !== "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") {
        params.append("status", filterStatus);
      }
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const res = await fetch(`/api/admin/contacts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    if (status === "loading" || !session || session.user?.role !== "ADMIN") {
      return;
    }
    fetchContacts();
  }, [fetchContacts, session, status]);

  const handleStatusChange = async (contactId: string, newStatus: string) => {
    if (newStatus === "RESOLVED") {
      // 対応済にする場合はメモ入力モーダルを表示
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        setSelectedContact(contact);
        setResolveNote(contact.admin_note || "");
        setIsResolveModalOpen(true);
      }
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      await fetchContacts();
      if (selectedContact?.id === contactId) {
        const updated = await res.json();
        setSelectedContact(updated);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("ステータスの更新に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  const handleResolveConfirm = async () => {
    if (!selectedContact) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/contacts/${selectedContact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          admin_note: resolveNote.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to resolve contact");

      await fetchContacts();
      setIsResolveModalOpen(false);
      setSelectedContact(null);
      setResolveNote("");
    } catch (error) {
      console.error("Failed to resolve contact:", error);
      alert("対応済みへの更新に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "PROCESSING":
        return "bg-blue-100 text-blue-700";
      case "RESOLVED":
        return "bg-green-100 text-green-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "未処理";
      case "PROCESSING":
        return "処理中";
      case "RESOLVED":
        return "対応済";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
          お問い合わせ管理
        </h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          ユーザーからのお問い合わせを確認・処理します
        </p>
      </div>

      {/* フィルター・ソート・検索 */}
      <div className="mb-6 space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 検索 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="タイトル、お名前、メールアドレス、内容で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* ステータスフィルター */}
          <div className="flex gap-2">
            {(["ALL", "PENDING", "PROCESSING", "RESOLVED"] as FilterStatus[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    filterStatus === status
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {status === "ALL"
                    ? "すべて"
                    : status === "PENDING"
                    ? "未処理"
                    : status === "PROCESSING"
                    ? "処理中"
                    : "対応済"}
                </button>
              )
            )}
          </div>
        </div>

        {/* ソート */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-700">並び替え:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="created_at">提出日</option>
              <option value="title">タイトル</option>
              <option value="name">お名前</option>
            </select>
            <button
              onClick={() =>
                setSortOrder(sortOrder === "asc" ? "desc" : "asc")
              }
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* お問い合わせ一覧 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">お問い合わせがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`rounded-lg border p-4 transition ${
                contact.status === "RESOLVED"
                  ? "border-zinc-200 bg-zinc-50 opacity-60"
                  : "border-zinc-200 bg-white hover:border-zinc-900 hover:shadow-md"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className={`flex-1 ${contact.status === "RESOLVED" ? "text-zinc-400" : ""}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                        contact.status
                      )}`}
                    >
                      {getStatusLabel(contact.status)}
                    </span>
                    <span className={`text-xs ${contact.status === "RESOLVED" ? "text-zinc-400" : "text-zinc-500"}`}>
                      {contact.submitter?.email || contact.email}
                    </span>
                  </div>
                  <h3 className={`text-base font-semibold ${contact.status === "RESOLVED" ? "text-zinc-400" : "text-zinc-900"}`}>
                    {contact.title}
                  </h3>
                  <p className={`mt-1 text-sm ${contact.status === "RESOLVED" ? "text-zinc-400" : "text-zinc-600"}`}>
                    {contact.name} ({contact.email})
                  </p>
                  <p className={`mt-2 text-xs ${contact.status === "RESOLVED" ? "text-zinc-400" : "text-zinc-500"}`}>
                    提出日: {formatDate(contact.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedContact(contact)}
                    disabled={contact.status === "RESOLVED"}
                    className={`rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium transition ${
                      contact.status === "RESOLVED"
                        ? "cursor-not-allowed text-zinc-300 opacity-50"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    詳細
                  </button>
                  {contact.status !== "RESOLVED" && (
                    <select
                      value={contact.status}
                      onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                      disabled={processing}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
                    >
                      <option value="PENDING">未処理</option>
                      <option value="PROCESSING">処理中</option>
                      <option value="RESOLVED">対応済</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900">お問い合わせの詳細</h2>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-zinc-600 hover:text-zinc-900"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-zinc-700">タイトル</h3>
                <p className="mt-1 text-sm text-zinc-900">{selectedContact.title}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700">お名前</h3>
                <p className="mt-1 text-sm text-zinc-600">{selectedContact.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700">メールアドレス</h3>
                <p className="mt-1 text-sm text-zinc-600">{selectedContact.email}</p>
                {selectedContact.submitter && (
                  <p className="mt-1 text-xs text-zinc-500">
                    ログインアカウント: {selectedContact.submitter.email}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700">お問い合わせ内容</h3>
                <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">
                  {selectedContact.content}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700">ステータス</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                      selectedContact.status
                    )}`}
                  >
                    {getStatusLabel(selectedContact.status)}
                  </span>
                </p>
              </div>

              {selectedContact.admin_note && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700">管理者メモ</h3>
                  <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">
                    {selectedContact.admin_note}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-zinc-700">提出日</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {formatDate(selectedContact.created_at)}
                </p>
              </div>

              {selectedContact.status !== "RESOLVED" && (
                <div className="flex gap-2 pt-4">
                  <select
                    value={selectedContact.status}
                    onChange={(e) => handleStatusChange(selectedContact.id, e.target.value)}
                    disabled={processing}
                    className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
                  >
                    <option value="PENDING">未処理</option>
                    <option value="PROCESSING">処理中</option>
                    <option value="RESOLVED">対応済</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 対応済メモ入力モーダル */}
      <ModalBase
        isOpen={isResolveModalOpen}
        onClose={() => {
          setIsResolveModalOpen(false);
          setResolveNote("");
        }}
        title="対応済みにする"
        footer={
          <>
            <button
              onClick={() => {
                setIsResolveModalOpen(false);
                setResolveNote("");
              }}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleResolveConfirm}
              disabled={processing}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {processing ? "処理中..." : "対応済みにする"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-700">
            最終的にどのようにして解決したのかをメモに記入してください。
          </p>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              解決メモ
            </label>
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="例: メールで回答し、問題を解決しました。"
            />
          </div>
        </div>
      </ModalBase>
    </div>
  );
}


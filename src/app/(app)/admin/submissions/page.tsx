"use client";

import { useState, useEffect } from "react";

type Submission = {
  id: string;
  name: string;
  theme: string | null;
  description: string | null;
  original_url: string;
  event_date: string | null;
  entry_start_at: string | null;
  payment_due_at: string | null;
  status: string;
  admin_note: string | null;
  submitter_email: string | null;
  submitter: {
    email: string;
  } | null;
  created_at: string;
};

type FilterStatus = "ALL" | "PENDING" | "PROCESSED" | "REJECTED";
type SortBy = "created_at" | "event_date" | "name";
type SortOrder = "asc" | "desc";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [filterStatus, sortBy, sortOrder, searchQuery]);

  const fetchSubmissions = async () => {
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

      const res = await fetch(`/api/admin/submissions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const data = await res.json();
      setSubmissions(data);
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (submissionId: string, action: "PROCESSED" | "REJECTED") => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });

      if (!res.ok) throw new Error("Failed to process submission");
      await fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Failed to process submission:", error);
      alert("処理に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateEvent = async (submissionId: string) => {
    if (!selectedSubmission) return;

    setProcessing(true);
    try {
      // 情報提供からイベントを作成
      const eventRes = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedSubmission.name,
          theme: selectedSubmission.theme || null,
          description: selectedSubmission.description || null,
          original_url: selectedSubmission.original_url,
          event_date: selectedSubmission.event_date || new Date().toISOString(),
          entry_start_at: selectedSubmission.entry_start_at || null,
          payment_due_at: selectedSubmission.payment_due_at || null,
          approval_status: "PENDING",
        }),
      });

      if (!eventRes.ok) throw new Error("Failed to create event");

      // 情報提供を処理済みにマーク
      await handleProcess(submissionId, "PROCESSED");
    } catch (error) {
      console.error("Failed to create event from submission:", error);
      alert("イベントの作成に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "PROCESSED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "未処理";
      case "PROCESSED":
        return "処理済み";
      case "REJECTED":
        return "却下";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "未定";
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
          情報提供フォーム
        </h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          ユーザーからのイベント情報提供を確認・処理します
        </p>
      </div>

      {/* フィルター・ソート・検索 */}
      <div className="mb-6 space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 検索 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="イベント名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* ステータスフィルター */}
          <div className="flex gap-2">
            {(["ALL", "PENDING", "PROCESSED", "REJECTED"] as FilterStatus[]).map(
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
                    : status === "PROCESSED"
                    ? "処理済み"
                    : "却下"}
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
              <option value="event_date">開催日</option>
              <option value="name">イベント名</option>
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

      {/* 情報提供一覧 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">情報提供がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                        submission.status
                      )}`}
                    >
                      {getStatusLabel(submission.status)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {submission.submitter?.email || submission.submitter_email || "匿名"}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900">
                    {submission.name}
                  </h3>
                  {submission.theme && (
                    <p className="text-sm text-zinc-600">{submission.theme}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
                    {submission.event_date && (
                      <span>開催日: {formatDate(submission.event_date)}</span>
                    )}
                    {submission.entry_start_at && (
                      <span>
                        エントリー開始: {formatDate(submission.entry_start_at)}
                      </span>
                    )}
                    {submission.payment_due_at && (
                      <span>支払期限: {formatDate(submission.payment_due_at)}</span>
                    )}
                    <span>提出日: {formatDate(submission.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSubmission(submission)}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    詳細
                  </button>
                  {submission.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleCreateEvent(submission.id)}
                        disabled={processing}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        イベント作成
                      </button>
                      <button
                        onClick={() => handleProcess(submission.id, "REJECTED")}
                        disabled={processing}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        却下
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900">情報提供の詳細</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-zinc-600 hover:text-zinc-900"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-zinc-700">イベント名</h3>
                <p className="mt-1 text-sm text-zinc-900">{selectedSubmission.name}</p>
              </div>

              {selectedSubmission.theme && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700">テーマ</h3>
                  <p className="mt-1 text-sm text-zinc-600">{selectedSubmission.theme}</p>
                </div>
              )}

              {selectedSubmission.description && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700">説明</h3>
                  <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">
                    {selectedSubmission.description}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-zinc-700">公式URL</h3>
                <a
                  href={selectedSubmission.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-blue-600 hover:underline"
                >
                  {selectedSubmission.original_url}
                </a>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {selectedSubmission.event_date && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-700">開催日</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatDate(selectedSubmission.event_date)}
                    </p>
                  </div>
                )}

                {selectedSubmission.entry_start_at && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-700">エントリー開始日</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatDate(selectedSubmission.entry_start_at)}
                    </p>
                  </div>
                )}

                {selectedSubmission.payment_due_at && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-700">支払期限</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatDate(selectedSubmission.payment_due_at)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700">提供者</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {selectedSubmission.submitter?.email ||
                    selectedSubmission.submitter_email ||
                    "匿名"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700">提出日</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {formatDate(selectedSubmission.created_at)}
                </p>
              </div>

              {selectedSubmission.status === "PENDING" && (
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleCreateEvent(selectedSubmission.id)}
                    disabled={processing}
                    className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    イベントを作成して処理済みにする
                  </button>
                  <button
                    onClick={() => handleProcess(selectedSubmission.id, "REJECTED")}
                    disabled={processing}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    却下
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


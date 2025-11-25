"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Event = {
  id: string;
  name: string;
  theme: string | null;
  event_date: string;
  entry_start_at: string | null;
  payment_due_at: string | null;
  approval_status: string;
  created_at: string;
  organizer_user: {
    email: string;
  } | null;
};

type FilterStatus = "ALL" | "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
type SortBy = "created_at" | "event_date" | "name";
type SortOrder = "asc" | "desc";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEvents();
  }, [filterStatus, sortBy, sortOrder, searchQuery]);

  const fetchEvents = async () => {
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

      const res = await fetch(`/api/admin/events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-zinc-100 text-zinc-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "下書き";
      case "PENDING":
        return "承認待ち";
      case "APPROVED":
        return "承認済み";
      case "REJECTED":
        return "却下";
      default:
        return status;
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
          イベント管理
        </h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          イベントの作成、編集、承認を行います
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
            {(["ALL", "DRAFT", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map(
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
                    : status === "DRAFT"
                    ? "下書き"
                    : status === "PENDING"
                    ? "承認待ち"
                    : status === "APPROVED"
                    ? "承認済み"
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
              <option value="created_at">作成日</option>
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

      {/* 新規作成ボタン */}
      <div className="mb-4">
        <Link
          href="/admin/events/new"
          className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          + 新規イベントを作成
        </Link>
      </div>

      {/* イベント一覧 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">イベントがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/admin/events/${event.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                        event.approval_status
                      )}`}
                    >
                      {getStatusLabel(event.approval_status)}
                    </span>
                    {event.organizer_user && (
                      <span className="text-xs text-zinc-500">
                        {event.organizer_user.email}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900">
                    {event.name}
                  </h3>
                  {event.theme && (
                    <p className="text-sm text-zinc-600">{event.theme}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
                    <span>開催日: {formatDate(event.event_date)}</span>
                    {event.entry_start_at && (
                      <span>
                        エントリー開始: {formatDate(event.entry_start_at)}
                      </span>
                    )}
                    {event.payment_due_at && (
                      <span>支払期限: {formatDate(event.payment_due_at)}</span>
                    )}
                    <span>作成日: {formatDate(event.created_at)}</span>
                  </div>
                </div>
                <div className="text-sm text-zinc-500">→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


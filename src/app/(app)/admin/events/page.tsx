"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";

type Event = {
  id: string;
  name: string;
  theme: string | null;
  description: string | null;
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
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEvents = useCallback(async () => {
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
  }, [filterStatus, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    document.title = "いたなび管理画面 | イベント管理";
  }, []);

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
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
              イベント管理
            </h1>
            <p className="mt-2 text-sm text-zinc-600 sm:text-base">
              イベントの作成、編集、承認を行います
            </p>
          </div>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 whitespace-nowrap shrink-0"
          >
            + 新規イベントを作成
          </Link>
        </div>
      </div>

      {/* フィルター・ソート・検索 */}
      <div className="mb-6 space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 検索 */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="イベント名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* ステータスフィルター */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {(["ALL", "DRAFT", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map(
              (status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "primary" : "secondary"}
                  size="sm"
                  rounded="md"
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? "whitespace-nowrap" : "bg-zinc-100 hover:bg-zinc-200 whitespace-nowrap"}
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
                </Button>
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
            <Button
              variant="secondary"
              size="sm"
              rounded="md"
              onClick={() =>
                setSortOrder(sortOrder === "asc" ? "desc" : "asc")
              }
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      </div>

      {/* イベント一覧 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">イベントがありません</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-[1200px] divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="w-24 whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  ステータス
                </th>
                <th className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  イベント名
                </th>
                <th className="min-w-[250px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  イベント詳細
                </th>
                <th className="w-32 whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  開催日
                </th>
                <th className="w-32 whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  エントリー開始
                </th>
                <th className="w-32 whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  支払期限
                </th>
                <th className="min-w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  主催者
                </th>
                <th className="w-32 whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  作成日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {events.map((event) => (
                <tr
                  key={event.id}
                  onClick={() => router.push(`/admin/events/${event.id}`)}
                  className="cursor-pointer transition hover:bg-zinc-50"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                        event.approval_status
                      )}`}
                    >
                      {getStatusLabel(event.approval_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-zinc-900">
                      {event.name}
                    </div>
                    {event.theme && (
                      <div className="mt-1 text-xs text-zinc-500">
                        {event.theme}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-600 line-clamp-2">
                      {event.description || "-"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                    {formatDate(event.event_date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                    {event.entry_start_at ? formatDate(event.entry_start_at) : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700">
                    {event.payment_due_at ? formatDate(event.payment_due_at) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {event.organizer_user ? event.organizer_user.email : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {formatDate(event.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


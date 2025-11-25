"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import EventForm, { EventFormData } from "@/components/event-form";
import ConfirmModal from "@/components/confirm-modal";

type Event = {
  id: string;
  name: string;
  theme: string | null;
  description: string | null;
  original_url: string;
  event_date: string;
  entry_start_at: string | null;
  payment_due_at: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  street_address: string | null;
  venue_name: string | null;
  approval_status: string;
  organizer_user: {
    id: string;
    email: string;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
};

export default function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    theme: "",
    description: "",
    original_url: "",
    event_date: "",
    entry_start_at: "",
    payment_due_at: "",
    postal_code: "",
    prefecture: "",
    city: "",
    street_address: "",
    venue_name: "",
  });

  // 現在のユーザーがadminまたはイベントのorganizerかどうかを確認
  const canReapply = 
    event &&
    event.approval_status === "REJECTED" &&
    (session?.user?.role === "ADMIN" || 
     (session?.user?.role === "ORGANIZER" && event.organizer_user?.id === session.user.id));

  // 一度公開されたイベントを編集する場合（作成者またはadminのみ）
  const canUpdateDirectly = 
    event &&
    event.approval_status === "APPROVED" &&
    (session?.user?.role === "ADMIN" || 
     (session?.user?.role === "ORGANIZER" && event.organizer_user?.id === session.user.id));

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch event: ${res.status}`);
      }
      const data = await res.json();
      setEvent(data);
      setFormData({
        name: data.name || "",
        theme: data.theme || "",
        description: data.description || "",
        original_url: data.original_url || "",
        event_date: data.event_date
          ? new Date(data.event_date).toISOString().split("T")[0]
          : "",
        entry_start_at: data.entry_start_at
          ? new Date(data.entry_start_at).toISOString().split("T")[0]
          : "",
        payment_due_at: data.payment_due_at
          ? new Date(data.payment_due_at).toISOString().split("T")[0]
          : "",
        postal_code: data.postal_code || "",
        prefecture: data.prefecture || "",
        city: data.city || "",
        street_address: data.street_address || "",
        venue_name: data.venue_name || "",
      });
      setTags(data.tags.map((eventTag: { tag: { name: string } }) => eventTag.tag.name));
    } catch (error) {
      console.error("Failed to fetch event:", error);
      alert(`イベントの取得に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (approvalStatus: "DRAFT" | "PENDING" | "APPROVED") => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: tags,
          approval_status: approvalStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update event");

      await fetchEvent();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update event:", error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleReapply = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: tags,
          approval_status: "PENDING",
        }),
      });

      if (!res.ok) throw new Error("Failed to reapply event");

      await fetchEvent();
    } catch (error) {
      console.error("Failed to reapply event:", error);
      alert("再申請に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setIsEditing(false);
    fetchEvent();
  };

  const handleApproveClick = () => {
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${id}/approve`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to approve event");

      await fetchEvent();
      setShowApproveModal(false);
    } catch (error) {
      console.error("Failed to approve event:", error);
      alert("承認に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${id}/reject`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to reject event");

      await fetchEvent();
      setShowRejectModal(false);
    } catch (error) {
      console.error("Failed to reject event:", error);
      alert("却下に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
        <p className="text-sm text-zinc-600">イベントが見つかりません</p>
        <Link
          href="/admin/events"
          className="mt-4 inline-block text-sm text-zinc-900 hover:underline"
        >
          ← イベント一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/admin/events"
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← イベント一覧に戻る
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
          {isEditing ? "イベントを編集" : "イベント詳細"}
        </h1>
        {!isEditing && (
          <div className="flex gap-2">
            {event.approval_status === "PENDING" && session?.user?.role === "ADMIN" && (
              <>
                <button
                  onClick={handleApproveClick}
                  disabled={saving}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  承認
                </button>
                <button
                  onClick={handleRejectClick}
                  disabled={saving}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  却下
                </button>
              </>
            )}
            {canReapply && (
              <button
                onClick={handleReapply}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                再申請
              </button>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              編集
            </button>
          </div>
        )}
      </div>

      {/* キャンセル確認モーダル */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="編集をキャンセルしますか？"
        message="変更内容は破棄されます。"
        confirmLabel="はい"
        cancelLabel="いいえ"
      />

      {/* 承認確認モーダル */}
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApprove}
        title="このイベントを承認しますか？"
        message="承認すると、イベントが公開されます。"
        confirmLabel="承認"
        cancelLabel="キャンセル"
      />

      {/* 却下確認モーダル */}
      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        title="このイベントを却下しますか？"
        message="却下すると、イベントは非公開になります。主催者は再申請することができます。"
        confirmLabel="却下"
        cancelLabel="キャンセル"
      />

      {isEditing ? (
        <EventForm
          formData={formData}
          onFormDataChange={setFormData}
          tags={tags}
          onTagsChange={setTags}
        >
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {saving ? "保存中..." : "下書き"}
          </button>
          {canUpdateDirectly ? (
            <button
              type="button"
              onClick={() => handleSave("APPROVED")}
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存して更新"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSave("PENDING")}
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "保存中..." : event?.approval_status === "REJECTED" ? "保存して再申請" : "保存して申請"}
            </button>
          )}
        </EventForm>
      ) : (
        <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  event.approval_status === "DRAFT"
                    ? "bg-zinc-100 text-zinc-700"
                    : event.approval_status === "PENDING"
                    ? "bg-yellow-100 text-yellow-700"
                    : event.approval_status === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {event.approval_status === "DRAFT"
                  ? "下書き"
                  : event.approval_status === "PENDING"
                  ? "承認待ち"
                  : event.approval_status === "APPROVED"
                  ? "承認済み"
                  : "却下"}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">
              {event.name}
            </h2>
            {event.theme && (
              <p className="mt-1 text-sm text-zinc-600">{event.theme}</p>
            )}
          </div>

          {event.description && (
            <div>
              <h3 className="text-sm font-medium text-zinc-700">説明</h3>
              <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-zinc-700">開催日</h3>
              <p className="mt-1 text-sm text-zinc-600">
                {new Date(event.event_date).toLocaleDateString("ja-JP")}
              </p>
            </div>

            {event.entry_start_at && (
              <div>
                <h3 className="text-sm font-medium text-zinc-700">
                  エントリー開始日
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {new Date(event.entry_start_at).toLocaleDateString("ja-JP")}
                </p>
              </div>
            )}

            {event.payment_due_at && (
              <div>
                <h3 className="text-sm font-medium text-zinc-700">支払期限</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {new Date(event.payment_due_at).toLocaleDateString("ja-JP")}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-zinc-700">公式URL</h3>
              <a
                href={event.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-blue-600 hover:underline"
              >
                {event.original_url}
              </a>
            </div>

            {event.organizer_user && (
              <div>
                <h3 className="text-sm font-medium text-zinc-700">主催者</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {event.organizer_user.email}
                </p>
              </div>
            )}

            {event.prefecture && (
              <div>
                <h3 className="text-sm font-medium text-zinc-700">開催地</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {event.prefecture}
                  {event.city && ` ${event.city}`}
                  {event.street_address && ` ${event.street_address}`}
                  {event.venue_name && ` ${event.venue_name}`}
                </p>
              </div>
            )}
          </div>

          {event.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-700">タグ</h3>
              <div className="mt-1 flex flex-wrap gap-2">
                {event.tags.map((eventTag) => (
                  <span
                    key={eventTag.tag.id}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    {eventTag.tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


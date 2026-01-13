"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import EventForm, { EventFormData } from "@/components/event-form";
import ConfirmModal from "@/components/confirm-modal";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EventShareModal } from "@/components/event-share-modal";

type Event = {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  event_end_date: string | null;
  is_multi_day: boolean;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  street_address: string | null;
  venue_name: string | null;
  keywords: string[] | null;
  official_urls: string[];
  image_url: string | null;
  approval_status: string;
  created_by_user_id: string | null;
  entries: Array<{
    id: string;
    entry_number: number;
    entry_start_at: string;
    entry_start_public_at: string | null;
    entry_deadline_at: string | null;
    payment_due_type: string;
    payment_due_at: string | null;
    payment_due_days_after_entry: number | null;
    payment_due_public_at: string | null;
  }>;
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
  const { data: session } = useSession();
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    description: "",
    event_date: "",
    is_multi_day: false,
    event_end_date: "",
    postal_code: "",
    prefecture: "",
    city: "",
    street_address: "",
    venue_name: "",
    image_url: "",
    official_urls: [""],
    entry_selection_method: "FIRST_COME",
    max_participants: null,
    entries: [],
  });

  // 現在のユーザーがadminまたはイベントの登録者かどうかを確認
  const canReapply =
    event &&
    event.approval_status === "REJECTED" &&
    (session?.user?.role === "ADMIN" ||
      (session?.user?.role === "ORGANIZER" && event.created_by_user_id === session.user.id));

  // 一度公開されたイベントを編集する場合（登録者またはadminのみ）
  // 管理者の場合は常に直接更新可能
  const canUpdateDirectly =
    event &&
    (session?.user?.role === "ADMIN" ||
      (event.approval_status === "APPROVED" &&
        session?.user?.role === "ORGANIZER" &&
        event.created_by_user_id === session.user.id));

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch event: ${res.status}`);
      }
      const data = await res.json();
      setEvent({ ...data, created_by_user_id: data.created_by_user_id || null });

      // エントリー情報をフォーマット
      const formattedEntries = (data.entries || []).map((entry: Event["entries"][number]) => ({
        entry_number: entry.entry_number,
        entry_start_at: entry.entry_start_at
          ? new Date(entry.entry_start_at).toISOString().slice(0, 16)
          : "",
        entry_start_public_at: entry.entry_start_public_at
          ? new Date(entry.entry_start_public_at).toISOString().slice(0, 16)
          : "",
        entry_deadline_at: entry.entry_deadline_at
          ? new Date(entry.entry_deadline_at).toISOString().slice(0, 16)
          : "",
        payment_due_type: entry.payment_due_type || "ABSOLUTE",
        payment_due_at: entry.payment_due_at
          ? new Date(entry.payment_due_at).toISOString().slice(0, 16)
          : "",
        payment_due_days_after_entry: entry.payment_due_days_after_entry || null,
        payment_due_public_at: entry.payment_due_public_at
          ? new Date(entry.payment_due_public_at).toISOString().slice(0, 16)
          : "",
      }));

      setFormData({
        name: data.name || "",
        description: data.description || "",
        event_date: data.event_date
          ? new Date(data.event_date).toISOString().split("T")[0]
          : "",
        is_multi_day: data.is_multi_day || false,
        event_end_date: data.event_end_date
          ? new Date(data.event_end_date).toISOString().split("T")[0]
          : "",
        postal_code: data.postal_code || "",
        prefecture: data.prefecture || "",
        city: data.city || "",
        street_address: data.street_address || "",
        venue_name: data.venue_name || "",
        image_url: data.image_url || "",
        official_urls: (data.official_urls && Array.isArray(data.official_urls) && data.official_urls.length > 0)
          ? data.official_urls
          : [""],
        entry_selection_method: data.entry_selection_method || "FIRST_COME",
        max_participants: data.max_participants || null,
        entries: formattedEntries.length > 0 ? formattedEntries : [{
          entry_number: 1,
          entry_start_at: "",
          entry_start_public_at: "",
          entry_deadline_at: "",
          payment_due_type: "ABSOLUTE",
          payment_due_at: "",
          payment_due_days_after_entry: null,
          payment_due_public_at: "",
        }],
        payment_methods: data.payment_methods || undefined,
      });
      setKeywords((data.keywords && Array.isArray(data.keywords)) ? data.keywords : []);
    } catch (error) {
      console.error("Failed to fetch event:", error);
      alert(`イベントの取得に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    if (event) {
      document.title = `いたなび管理画面 | ${event.name}`;
    } else {
      document.title = "いたなび管理画面 | イベント詳細";
    }
  }, [event]);

  const handleSave = async (approvalStatus: "DRAFT" | "PENDING" | "APPROVED") => {
    // 下書き状態から申請に変更する場合はバリデーションを適用
    if (event?.approval_status === "DRAFT" && approvalStatus === "PENDING") {
      const validUrls = formData.official_urls.filter((url) => url.trim() !== "");
      if (validUrls.length === 0) {
        alert("最低1つの公式サイトURLを入力してください");
        return;
      }
      if (formData.entries.length === 0) {
        alert("最低1つのエントリー情報を入力してください");
        return;
      }
      if (formData.is_multi_day && !formData.event_end_date) {
        alert("複数日開催の場合、終了日を入力してください");
        return;
      }
      if (!formData.name || !formData.description || !formData.event_date) {
        alert("必須項目（イベント名、説明、開催日）を入力してください");
        return;
      }
      if (!formData.entry_selection_method) {
        alert("エントリー決定方法を選択してください");
        return;
      }
      // エントリー情報の必須項目チェック
      for (const entry of formData.entries) {
        if (!entry.entry_start_at) {
          alert(`エントリー${entry.entry_number}の開始日時を入力してください`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          keywords: keywords,
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
          tags: event?.tags.map(t => t.tag.id) || [],
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
      // 承認成功時にシェアモーダルを表示
      setShowShareModal(true);
    } catch (error) {
      console.error("Failed to approve event:", error);
      alert("承認に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  // 参加者アプリ側のイベント詳細URLを生成
  const getEventDetailUrl = () => {
    if (typeof window === "undefined" || !event?.id) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/events/${event.id}`;
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
        <LoadingSpinner size="lg" />
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
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
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
                <Button
                  variant="success"
                  size="md"
                  rounded="md"
                  onClick={handleApproveClick}
                  disabled={saving}
                >
                  承認
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  rounded="md"
                  onClick={handleRejectClick}
                  disabled={saving}
                >
                  却下
                </Button>
              </>
            )}
            {canReapply && (
              <Button
                variant="primary"
                size="md"
                rounded="md"
                onClick={handleReapply}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:hover:bg-blue-400"
              >
                再申請
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              rounded="md"
              onClick={() => setIsEditing(true)}
            >
              編集
            </Button>
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
        message="主催者は再申請することができます。"
        confirmLabel="却下"
        cancelLabel="キャンセル"
      />

      {/* イベントシェアモーダル */}
      {event && (
        <EventShareModal
          isOpen={showShareModal}
          onClose={handleCloseShareModal}
          eventTitle={event.name}
          eventUrl={getEventDetailUrl()}
        />
      )}

      {isEditing ? (
        <EventForm
          formData={formData}
          onFormDataChange={setFormData}
          keywords={keywords}
          onKeywordsChange={setKeywords}
        >
          <Button
            variant="secondary"
            size="md"
            rounded="md"
            onClick={handleCancel}
            disabled={saving}
          >
            {event?.approval_status === "DRAFT" ? "変更を破棄" : "キャンセル"}
          </Button>
          {event?.approval_status === "DRAFT" && (
            <Button
              variant="secondary"
              size="md"
              rounded="md"
              onClick={() => handleSave("DRAFT")}
              disabled={saving}
            >
              {saving ? "保存中..." : "下書きとして保存"}
            </Button>
          )}
          {session?.user?.role === "ADMIN" ? (
            // 管理者の場合
            event?.approval_status === "DRAFT" ? (
              // 下書き状態の場合は承認申請ボタンを表示
              <Button
                variant="primary"
                size="md"
                rounded="md"
                onClick={() => handleSave("PENDING")}
                disabled={saving}
              >
                {saving ? "保存中..." : "保存して承認申請"}
              </Button>
            ) : (
              // 下書き以外の場合は現在のステータスを維持
              <Button
                variant="primary"
                size="md"
                rounded="md"
                onClick={() => handleSave(event?.approval_status === "APPROVED" ? "APPROVED" : "PENDING")}
                disabled={saving}
              >
                {saving ? "保存中..." : "保存して更新"}
              </Button>
            )
          ) : canUpdateDirectly ? (
            <Button
              variant="primary"
              size="md"
              rounded="md"
              onClick={() => handleSave("APPROVED")}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存して更新"}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              rounded="md"
              onClick={() => handleSave("PENDING")}
              disabled={saving}
            >
              {saving ? "保存中..." : event?.approval_status === "REJECTED" ? "保存して再申請" : event?.approval_status === "DRAFT" ? "保存して承認申請" : "保存して申請"}
            </Button>
          )}
        </EventForm>
      ) : (
        <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${event.approval_status === "DRAFT"
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
          </div>

          {event.image_url && (
            <div className="relative w-full" style={{ maxHeight: "300px" }}>
              <Image
                src={event.image_url}
                alt={event.name}
                width={800}
                height={300}
                className="w-full rounded-md object-cover"
                style={{ maxHeight: "300px" }}
                unoptimized
              />
            </div>
          )}

          {event.description && (
            <div>
              <h3 className="text-sm font-medium text-zinc-700">イベント概要</h3>
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
                {event.is_multi_day && event.event_end_date && (
                  <span className="ml-2">
                    〜 {new Date(event.event_end_date).toLocaleDateString("ja-JP")}
                  </span>
                )}
              </p>
            </div>

            {event.official_urls && event.official_urls.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-700">公式URL</h3>
                <div className="mt-1 space-y-1">
                  {event.official_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:underline"
                    >
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {event.entries && event.entries.length > 0 && (
              <div className="col-span-1 sm:col-span-2">
                <h3 className="text-sm font-medium text-zinc-700">エントリー情報</h3>
                <div className="mt-2 space-y-3">
                  {event.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
                    >
                      <h4 className="text-xs font-medium text-zinc-700 mb-2">
                        {entry.entry_number}次エントリー
                      </h4>
                      <div className="space-y-2 text-xs text-zinc-600">
                        <div>
                          <span className="font-medium">エントリー開始日時:</span>{" "}
                          {new Date(entry.entry_start_at).toLocaleString("ja-JP")}
                        </div>
                        <div>
                          <span className="font-medium">エントリー開始日時公開日時:</span>{" "}
                          {entry.entry_start_public_at ? (
                            <span>{new Date(entry.entry_start_public_at).toLocaleString("ja-JP")}</span>
                          ) : (
                            <span className="text-zinc-500">未設定（即時公開）</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">エントリー締切日時:</span>{" "}
                          {entry.entry_deadline_at ? (
                            <span>{new Date(entry.entry_deadline_at).toLocaleString("ja-JP")}</span>
                          ) : (
                            <span className="text-zinc-500">未設定</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">支払期限日時:</span>{" "}
                          {entry.payment_due_at
                            ? new Date(entry.payment_due_at).toLocaleString("ja-JP")
                            : entry.payment_due_type === "RELATIVE" && entry.payment_due_days_after_entry
                              ? `エントリー申し込みから${entry.payment_due_days_after_entry}日以内`
                              : "未設定"}
                        </div>
                        <div>
                          <span className="font-medium">支払期限日時公開日時:</span>{" "}
                          {entry.payment_due_public_at ? (
                            <span>{new Date(entry.payment_due_public_at).toLocaleString("ja-JP")}</span>
                          ) : (
                            <span className="text-zinc-500">未設定（即時公開）</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

          {event.keywords && event.keywords.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-700">キーワード</h3>
              <div className="mt-1 flex flex-wrap gap-2">
                {event.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

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


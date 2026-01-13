"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/confirm-modal";
import EventForm, { EventFormData } from "@/components/event-form";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";

function AdminNewEventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.title = "いたなび管理画面 | 新規イベント作成";
  }, []);
  const [saving, setSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
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
    entries: [
      {
        entry_number: 1,
        entry_start_at: "",
        entry_start_public_at: "",
        entry_deadline_at: "",
        payment_due_type: "ABSOLUTE",
        payment_due_at: "",
        payment_due_days_after_entry: null,
        payment_due_public_at: "",
      },
    ],
  });

  // クエリパラメータからイベント掲載依頼フォームの情報を取得してフォームに自動入力
  useEffect(() => {
    const fromSubmission = searchParams?.get("fromSubmission");
    if (fromSubmission) {
      setSubmissionId(fromSubmission);
      // クエリパラメータから情報を取得してフォームに設定
      const name = searchParams?.get("name") || "";
      const original_url = searchParams?.get("original_url") || "";
      const event_date = searchParams?.get("event_date") || "";
      const description = searchParams?.get("description") || "";
      const entry_start_at = searchParams?.get("entry_start_at") || "";
      const payment_due_at = searchParams?.get("payment_due_at") || "";

      setFormData((prev) => ({
        ...prev,
        name,
        description,
        event_date: event_date ? new Date(event_date).toISOString().slice(0, 10) : "",
        official_urls: original_url ? [original_url] : [""],
        entries: [
          {
            entry_number: 1,
            entry_start_at: entry_start_at ? new Date(entry_start_at).toISOString().slice(0, 16) : "",
            entry_start_public_at: "",
            entry_deadline_at: "",
            payment_due_type: "ABSOLUTE",
            payment_due_at: payment_due_at ? new Date(payment_due_at).toISOString().slice(0, 16) : "",
            payment_due_days_after_entry: null,
            payment_due_public_at: "",
          },
        ],
      }));
    }
  }, [searchParams]);

  const handleSave = async (approvalStatus: "DRAFT" | "PENDING") => {
    // 下書き保存の場合はバリデーションをスキップ
    // 申請の場合は通常のバリデーションを適用
    if (approvalStatus === "PENDING") {
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
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          keywords: keywords,
          approval_status: approvalStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create event");
      }

      const data = await res.json();

      // イベント掲載依頼フォームから作成した場合は、処理済みにマーク
      if (submissionId) {
        try {
          await fetch(`/api/admin/submissions/${submissionId}/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "PROCESSED" }),
          });
        } catch (error) {
          console.error("Failed to mark submission as processed:", error);
          // エラーが発生してもイベント作成は成功しているので続行
        }
      }

      // 詳細ページに遷移
      router.push(`/admin/events/${data.id}`);
    } catch (error) {
      console.error("Failed to create event:", error);
      alert(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    router.push("/admin/events");
  };

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

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 sm:text-3xl">
        新規イベントを作成
      </h1>

      {/* 作成中止確認モーダル */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="本当に作成を中止しますか？"
        message="入力した内容は破棄されます。"
        confirmLabel="はい"
        cancelLabel="いいえ"
      />

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
          作成中止
        </Button>
        <Button
          variant="secondary"
          size="md"
          rounded="md"
          onClick={() => handleSave("DRAFT")}
          disabled={saving}
        >
          {saving ? "保存中..." : "下書きとして保存"}
        </Button>
        <Button
          variant="primary"
          size="md"
          rounded="md"
          onClick={() => handleSave("PENDING")}
          disabled={saving}
        >
          {saving ? "保存中..." : "保存して掲載申請"}
        </Button>
      </EventForm>
    </div>
  );
}

export default function AdminNewEventPage() {
  return (
    <Suspense fallback={
      <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    }>
      <AdminNewEventPageContent />
    </Suspense>
  );
}


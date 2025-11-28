"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ConfirmModal from "@/components/confirm-modal";
import EventForm, { EventFormData } from "@/components/event-form";
import { Button } from "@/components/button";

function AdminNewEventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
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
    organizer_email: "",
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
      const theme = searchParams?.get("theme") || "";
      const entry_start_at = searchParams?.get("entry_start_at") || "";
      const payment_due_at = searchParams?.get("payment_due_at") || "";

      setFormData((prev) => ({
        ...prev,
        name,
        original_url,
        description,
        theme,
        event_date: event_date ? new Date(event_date).toISOString().slice(0, 16) : "",
        entry_start_at: entry_start_at ? new Date(entry_start_at).toISOString().slice(0, 16) : "",
        payment_due_at: payment_due_at ? new Date(payment_due_at).toISOString().slice(0, 16) : "",
      }));
    }
  }, [searchParams]);

  const handleSave = async (approvalStatus: "DRAFT" | "PENDING") => {
    setSaving(true);

    try {
      // 申請時（PENDING）は、主催者メールアドレスが未設定の場合、ログインユーザーのメールアドレスを自動設定
      const organizerEmail = 
        approvalStatus === "PENDING" && !formData.organizer_email && session?.user?.email
          ? session.user.email
          : formData.organizer_email || null;

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          organizer_email: organizerEmail,
          tags: tags,
          approval_status: approvalStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to create event");

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
      
      router.push(`/admin/events/${data.id}`);
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("保存に失敗しました");
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
        tags={tags}
        onTagsChange={setTags}
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
        </div>
      </div>
    }>
      <AdminNewEventPageContent />
    </Suspense>
  );
}


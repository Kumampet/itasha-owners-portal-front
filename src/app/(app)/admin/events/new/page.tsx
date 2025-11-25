"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/confirm-modal";
import EventForm, { EventFormData } from "@/components/event-form";

export default function AdminNewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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

  const handleSave = async (approvalStatus: "DRAFT" | "PENDING") => {
    setSaving(true);

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: tags,
          approval_status: approvalStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to create event");

      const data = await res.json();
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          作成中止
        </button>
        <button
          type="button"
          onClick={() => handleSave("DRAFT")}
          disabled={saving}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          {saving ? "保存中..." : "下書きとして保存"}
        </button>
        <button
          type="button"
          onClick={() => handleSave("PENDING")}
          disabled={saving}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存して掲載申請"}
        </button>
      </EventForm>
    </div>
  );
}


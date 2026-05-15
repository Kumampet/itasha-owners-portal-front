"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/button";
import ConfirmModal from "@/components/confirm-modal";

const initialFormData = {
  name: "",
  original_url: "",
  event_date: "",
  venue_name: "",
  description: "",
};

export default function EventSubmissionPage() {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    document.title = "イベント掲載依頼 | 痛車オーナーズナビ | いたなび！";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/event-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          original_url: formData.original_url,
          event_date: formData.event_date,
          venue_name: formData.venue_name,
          description: formData.description || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to submit event");
      }

      // 成功時：フォームをクリア、成功モーダルを表示
      setFormData(initialFormData);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to submit event:", error);
      const errorMsg =
        error instanceof Error ? error.message : "イベント掲載依頼の送信に失敗しました";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      // エラー時は入力内容を保持したままフォーム画面にとどまる
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <Link
            href="/app/mypage"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← マイページへ戻る
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              イベント掲載依頼フォーム
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              イベント情報をご提供いただくことで、より多くの参加者にイベントを知っていただくことができます。
            </p>
            <p className="mt-2 text-xs text-zinc-600 sm:text-sm leading-relaxed">
              必須項目をすべてご記入いただけないイベントは、掲載のご案内ができません。
              また、本サービスでの掲載は、<strong className="font-medium text-zinc-800">開催地が日本国内であるイベントに限ります</strong>。
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <div>
            <label htmlFor="event-submission-name" className="block text-sm font-medium text-zinc-700">
              イベント名 <span className="text-red-500">*</span>
            </label>
            <input
              id="event-submission-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="例: 痛車ヘブン夏"
              required
            />
          </div>

          <div>
            <label
              htmlFor="event-submission-datetime"
              className="block text-sm font-medium text-zinc-700"
            >
              開催日時 <span className="text-red-500">*</span>
            </label>
            <input
              id="event-submission-datetime"
              type="datetime-local"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="event-submission-venue-name"
              className="block text-sm font-medium text-zinc-700"
            >
              会場・住所 <span className="text-red-500">*</span>
              <span className="mt-1 block text-xs font-normal text-zinc-500">
                掲載時に参加者へ示す住所・会場名を、まとめてご入力ください（管理画面での「会場名」入力欄へ引き継がれます）
              </span>
            </label>
            <input
              id="event-submission-venue-name"
              type="text"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="例: 愛知県名古屋市〇〇 〇〇イベントホール"
              required
            />
          </div>

          <div>
            <label htmlFor="event-submission-url" className="block text-sm font-medium text-zinc-700">
              イベント情報URL <span className="text-red-500">*</span>
              <span className="block text-xs font-normal text-zinc-500">
                公式サイト、SNS、告知ページなどのURL
              </span>
            </label>
            <input
              id="event-submission-url"
              type="url"
              value={formData.original_url}
              onChange={(e) => setFormData({ ...formData, original_url: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="https://example.com/event"
              required
            />
          </div>

          <div>
            <label
              htmlFor="event-submission-remarks"
              className="block text-sm font-medium text-zinc-700"
            >
              備考 <span className="ml-1 text-xs font-normal text-zinc-500">（任意）</span>
            </label>
            <textarea
              id="event-submission-remarks"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="補足や連絡事項などがありましたらご記入ください"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Link
              href="/app/mypage"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              キャンセル
            </Link>
            <Button type="submit" variant="primary" size="md" rounded="md" disabled={submitting}>
              {submitting ? "送信中..." : "送信"}
            </Button>
          </div>
        </form>
      </section>

      {/* 成功モーダル */}
      <ConfirmModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="送信完了"
        message="イベント掲載依頼を送信しました。ありがとうございます。"
        buttonVariant="success"
        showCancel={false}
      />

      {/* エラーモーダル */}
      <ConfirmModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="送信失敗"
        message={errorMessage}
        titleVariant="error"
        showCancel={false}
      />
    </main>
  );
}

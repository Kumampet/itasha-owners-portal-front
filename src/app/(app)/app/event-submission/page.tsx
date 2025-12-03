"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/button";
import { Accordion, AccordionItem } from "@/components/accordion";
import ConfirmModal from "@/components/confirm-modal";

const initialFormData = {
  name: "",
  original_url: "",
  event_date: "",
  description: "",
  theme: "",
  entry_start_at: "",
  payment_due_at: "",
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
          original_url: formData.original_url || null,
          event_date: formData.event_date || null,
          description: formData.description || null,
          theme: formData.theme || null,
          entry_start_at: formData.entry_start_at || null,
          payment_due_at: formData.payment_due_at || null,
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
      const errorMsg = error instanceof Error ? error.message : "イベント掲載依頼の送信に失敗しました";
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
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              イベント名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="例: 痛車ヘブン夏"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              イベント情報URL（HPやSNS等）
              <span className="ml-1 text-xs text-zinc-500">（推奨・任意）</span>
            </label>
            <input
              type="url"
              value={formData.original_url}
              onChange={(e) =>
                setFormData({ ...formData, original_url: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="https://example.com/event"
            />
            <p className="mt-1 text-xs text-zinc-500">
              イベントの公式サイト、SNS、告知ページなどのURL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              開催日 <span className="ml-1 text-xs text-zinc-500">（任意）</span>
            </label>
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) =>
                setFormData({ ...formData, event_date: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              その他備考欄 <span className="ml-1 text-xs text-zinc-500">（任意）</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={6}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="イベントの詳細情報、特記事項などをご記入ください"
            />
          </div>

          {/* 詳細情報アコーディオン */}
          <Accordion>
            <AccordionItem
              value="details"
              title={
                <span className="text-sm font-medium text-zinc-700">
                  詳細情報 <span className="ml-1 text-xs text-zinc-500">（任意）</span>
                </span>
              }
              contentClassName="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  副題
                </label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) =>
                    setFormData({ ...formData, theme: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  placeholder="副題（任意）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  エントリー開始日時
                </label>
                <input
                  type="datetime-local"
                  value={formData.entry_start_at}
                  onChange={(e) =>
                    setFormData({ ...formData, entry_start_at: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  支払期限
                </label>
                <input
                  type="datetime-local"
                  value={formData.payment_due_at}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_due_at: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-2 justify-end">
            <Link
              href="/app/mypage"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              キャンセル
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              rounded="md"
              disabled={submitting}
            >
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
        variant="success"
        showCancel={false}
      />

      {/* エラーモーダル */}
      <ConfirmModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="送信失敗"
        message={errorMessage}
        variant="error"
        showCancel={false}
      />
    </main>
  );
}


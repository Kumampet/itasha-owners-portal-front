"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/button";
import ConfirmModal from "@/components/confirm-modal";

const initialFormData = {
  display_name: "",
  email: "",
  experience: "",
};

export default function OrganizerApplicationPage() {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToFinalTerms, setAgreedToFinalTerms] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    document.title = "オーガナイザー登録申請 | 痛車オーナーズナビ | いたなび！";
  }, []);

  // ログインしている場合はメールアドレスを初期値として設定
  useEffect(() => {
    if (session?.user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: session.user.email || "" }));
    }
  }, [session, formData.email]);

  const handleAgreeToTerms = () => {
    setAgreedToTerms(true);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/organizer-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: formData.display_name,
          email: formData.email,
          experience: formData.experience,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "申請の送信に失敗しました");
      }

      // 成功時：フォームをクリア、完了画面を表示
      setFormData(initialFormData);
      setAgreedToTerms(false);
      setAgreedToFinalTerms(false);
      setShowForm(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Failed to submit application:", error);
      const errorMsg = error instanceof Error ? error.message : "申請の送信に失敗しました";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // 申請完了画面
  if (isSubmitted) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white p-8 text-center">
            <h1 className="mb-4 text-2xl font-semibold text-zinc-900 sm:text-3xl">
              オーガナイザー申請完了
            </h1>
            <p className="mb-8 text-base text-zinc-700 sm:text-lg">
              オーガナイザー申請ありがとうございます！<br />
              審査まで今しばらくお待ちください。
            </p>
            <Link href="/app/mypage">
              <Button
                variant="primary"
                size="md"
                rounded="md"
              >
                マイページに戻る
              </Button>
            </Link>
          </div>
        </section>

        {/* エラーモーダル */}
        <ConfirmModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="申請失敗"
          message={errorMessage}
          variant="error"
          showCancel={false}
        />
      </main>
    );
  }

  if (!showForm) {
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
                オーガナイザー登録申請
              </h1>
              <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                イベント主催者として、いたなび！でイベントを管理・運営することができます。
              </p>
            </div>
          </header>

          {/* オーガナイザー登録とは？の説明 */}
          <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">
              オーガナイザー登録とは？
            </h2>
            <div className="space-y-3 text-sm text-zinc-700">
              <p>
                オーガナイザー登録をすることで、いたなび！上でイベントの作成・管理を行うことができます。
              </p>
              <div>
                <h3 className="mb-2 font-medium text-zinc-900">主な機能</h3>
                <ul className="ml-4 list-disc space-y-1">
                  <li>イベント情報の作成・編集・削除</li>
                  <li>エントリー情報の管理</li>
                  <li>参加者の管理</li>
                  <li>団体（併せ）の管理</li>
                  <li>イベントに関する一斉連絡の送信</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-zinc-900">申請について</h3>
                <p>
                  オーガナイザー登録申請は、管理者による審査を経て承認されます。
                </p>
              </div>
            </div>
          </div>

          {/* 同意文章 */}
          <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">利用規約への同意</h2>
            <div className="space-y-3 text-sm text-zinc-700">
              <p>
                オーガナイザーとして登録するにあたり、以下の事項に同意していただく必要があります。
              </p>
              <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="font-medium text-zinc-900">同意事項</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    いたなび！の利用規約およびプライバシーポリシーに同意します。
                  </li>
                  <li>
                    イベント情報の正確性を保ち、適切な情報管理を行います。
                  </li>
                  <li>
                    参加者への適切な対応を行い、イベント運営に責任を持ちます。
                  </li>
                  <li>
                    管理者からの指示や要請に従います。
                  </li>
                  <li>
                    不適切な行為が発覚した場合、オーガナイザー権限が剥奪される場合があります。
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="agree-terms" className="text-sm text-zinc-700">
                上記の同意事項に同意します
              </label>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                rounded="md"
                onClick={handleAgreeToTerms}
                disabled={!agreedToTerms}
              >
                申請フォームへ進む
              </Button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <button
            onClick={() => {
              setShowForm(false);
              setAgreedToTerms(false);
            }}
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← 戻る
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              オーガナイザー登録申請フォーム
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              必要事項をご記入の上、申請してください。
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              表示名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="例: 痛車イベント運営"
              required
            />
            <p className="mt-1 text-xs text-zinc-500">
              イベント参加者に表示される名前です
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="example@example.com"
              required
            />
            <p className="mt-1 text-xs text-zinc-500">
              連絡先として使用するメールアドレスです
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              歴代の運営実績 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.experience}
              onChange={(e) =>
                setFormData({ ...formData, experience: e.target.value })
              }
              rows={8}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="過去に運営したイベントの実績、または今後申請予定のイベントについて簡潔にご記入ください。例: 痛車イベント「痛車ヘブン」を年2回開催（2020年より）"
              required
            />
            <p className="mt-1 text-xs text-zinc-500">
              運営実績がない場合は、今後申請予定のイベントについて簡潔にご記入ください
            </p>
          </div>

          {/* 最終的な審査の結果について */}
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-900 mb-2">
              最終的な審査の結果について
            </p>
            <p className="text-sm text-zinc-700">
              最終的な審査の結果、権限付与を許可しない場合があります。
            </p>
            <div className="mt-3 flex items-start gap-2">
              <input
                type="checkbox"
                id="agree-final-terms"
                checked={agreedToFinalTerms}
                onChange={(e) => setAgreedToFinalTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                required
              />
              <label htmlFor="agree-final-terms" className="text-sm text-zinc-700">
                上記の内容を理解し、同意します
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setAgreedToTerms(false);
              }}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              キャンセル
            </button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              rounded="md"
              disabled={submitting || !agreedToFinalTerms}
            >
              {submitting ? "送信中..." : "申請する"}
            </Button>
          </div>
        </form>
      </section>

      {/* エラーモーダル */}
      <ConfirmModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="申請失敗"
        message={errorMessage}
        variant="error"
        showCancel={false}
      />
    </main>
  );
}


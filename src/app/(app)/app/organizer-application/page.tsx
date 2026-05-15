"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  APP_PAGE_HEADER_BACK_NAV_CLASSNAME,
  AppPageHeader,
  AppPageHeaderBackLink,
} from "@/components/app-page-header";
import ConfirmModal from "@/components/confirm-modal";
import { Button } from "@/components/button";

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
          <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center">
            <h1 className="mb-4 text-2xl font-semibold text-foreground sm:text-3xl">
              オーガナイザー申請完了
            </h1>
            <p className="mb-8 text-base text-muted-foreground sm:text-lg">
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
          titleVariant="error"
          showCancel={false}
        />
      </main>
    );
  }

  if (!showForm) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <AppPageHeader
            leading={
              <AppPageHeaderBackLink href="/app/mypage">← マイページへ戻る</AppPageHeaderBackLink>
            }
            title="オーガナイザー登録申請"
            size="md"
          >
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              イベント主催者として、いたなび！でイベントを管理・運営することができます。
            </p>
          </AppPageHeader>

          {/* オーガナイザー登録とは？の説明 */}
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">
              オーガナイザー登録とは？
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                オーガナイザー登録をすることで、いたなび！上でイベントの作成・管理を行うことができます。
              </p>
              <div>
                <h3 className="mb-2 font-medium text-foreground">主な機能</h3>
                <ul className="ml-4 list-disc space-y-1">
                  <li>ご自身が主催するイベントを、いたなび！に登録できます</li>
                  <li>登録したイベントの情報を、いつでも自由に更新・編集できます</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-foreground">申請について</h3>
                <p>
                  オーガナイザー登録申請は、管理者による審査を経て承認されます。
                </p>
              </div>
            </div>
          </div>

          {/* 申請にあたっての注意事項 */}
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">申請にあたっての注意事項</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                オーガナイザーとして登録するにあたり、以下の事項に同意していただく必要があります。
              </p>
              <div className="space-y-2 rounded-md border border-border bg-card-elevated p-4">
                <p className="font-medium text-foreground">注意事項</p>
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
                className="mt-1 h-4 w-4 rounded border-border text-accent-mint focus:ring-accent-mint"
              />
              <label htmlFor="agree-terms" className="text-sm text-muted-foreground">
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
        <AppPageHeader
          leading={
            <button
              type="button"
              className={APP_PAGE_HEADER_BACK_NAV_CLASSNAME}
              onClick={() => {
                setShowForm(false);
                setAgreedToTerms(false);
              }}
            >
              ← 戻る
            </button>
          }
          title="オーガナイザー登録申請フォーム"
          size="md"
        >
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            必要事項をご記入の上、申請してください。
          </p>
        </AppPageHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-border bg-card p-6"
        >
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              表示名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
              placeholder="例: 痛車イベント運営"
              required
            />
            <p className="mt-1 text-xs text-muted">
              イベント参加者に表示される名前です
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
              placeholder="example@example.com"
              required
            />
            <p className="mt-1 text-xs text-muted">
              連絡先として使用するメールアドレスです
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              歴代の運営実績 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.experience}
              onChange={(e) =>
                setFormData({ ...formData, experience: e.target.value })
              }
              rows={8}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
              placeholder="過去に運営したイベントの実績、または今後申請予定のイベントについて簡潔にご記入ください。例: 痛車イベント「痛車ヘブン」を年2回開催（2020年より）"
              required
            />
            <p className="mt-1 text-xs text-muted">
              運営実績がない場合は、今後申請予定のイベントについて簡潔にご記入ください
            </p>
          </div>

          {/* 最終的な審査の結果について */}
          <div className="rounded-md border border-border bg-card-elevated p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              最終的な審査の結果について
            </p>
            <p className="text-sm text-muted-foreground">
              最終的な審査の結果、権限付与を許可しない場合があります。
            </p>
            <div className="mt-3 flex items-start gap-2">
              <input
                type="checkbox"
                id="agree-final-terms"
                checked={agreedToFinalTerms}
                onChange={(e) => setAgreedToFinalTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-accent-mint focus:ring-accent-mint"
                required
              />
              <label htmlFor="agree-final-terms" className="text-sm text-muted-foreground">
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
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-card-elevated"
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
        titleVariant="error"
        showCancel={false}
      />
    </main>
  );
}


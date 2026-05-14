"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppPageHeader, AppPageHeaderBackLink } from "@/components/app-page-header";
import { ModalBase } from "@/components/modal-base";
import { Button } from "@/components/button";

export default function ContactPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    name: "",
    email: "",
    content: "",
  });
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    document.title = "お問い合わせ | 痛車オーナーズナビ | いたなび！";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          content: formData.content.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        const errorMsg = errorData.error || `お問い合わせの送信に失敗しました（ステータス: ${res.status}）`;
        console.error("Contact submission error:", errorData);
        throw new Error(errorMsg);
      }

      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Failed to submit contact form:", error);
      const errorMsg = error instanceof Error ? error.message : "お問い合わせの送信に失敗しました";
      setErrorMessage(errorMsg);
      setIsErrorModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <AppPageHeader
          leading={
            status === "authenticated" ? (
              <AppPageHeaderBackLink href="/app/mypage">← マイページへ戻る</AppPageHeaderBackLink>
            ) : undefined
          }
          title="お問い合わせフォーム"
          size="md"
        >
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            ご質問やご要望がございましたら、お気軽にお問い合わせください。
          </p>
        </AppPageHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-border bg-card p-6"
        >
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
              placeholder="例: イベント主催について"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              お名前（ニックネーム可） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
              placeholder="お名前またはニックネーム"
              required
            />
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
              placeholder="example@email.com"
              required
            />
            {session?.user?.email && (
              <p className="mt-1 text-xs text-muted">
                ログイン中のアカウント: {session.user.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              お問い合わせ内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={10}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent-mint"
              placeholder="お問い合わせ内容をご記入ください"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              as="link"
              href={session ? "/app/mypage" : "/"}
              variant="secondary"
              size="md"
              rounded="md"
              fullWidth
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              rounded="md"
              fullWidth
              disabled={submitting}
            >
              {submitting ? "送信中..." : "送信する"}
            </Button>
          </div>
        </form>
      </section>

      {/* 成功モーダル */}
      <ModalBase
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          router.push(session ? "/app/mypage" : "/");
        }}
        title="送信完了"
        footer={
          <Button
            variant="primary"
            size="md"
            rounded="md"
            onClick={() => {
              setIsSuccessModalOpen(false);
              router.push(session ? "/app/mypage" : "/");
            }}
          >
            OK
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          お問い合わせを送信しました。ありがとうございます。
        </p>
      </ModalBase>

      {/* エラーモーダル */}
      <ModalBase
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="送信エラー"
        footer={
          <Button
            variant="primary"
            size="md"
            rounded="md"
            onClick={() => setIsErrorModalOpen(false)}
          >
            OK
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          {errorMessage}
        </p>
      </ModalBase>
    </main>
  );
}


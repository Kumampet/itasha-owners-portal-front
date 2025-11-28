"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ModalBase } from "@/components/modal-base";
import { Button } from "@/components/button";

export default function ContactPage() {
  const router = useRouter();
  const { data: session } = useSession();
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
        <header className="space-y-2">
          <Link
            href="/app/mypage"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← マイページへ戻る
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              お問い合わせフォーム
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              ご質問やご要望がございましたら、お気軽にお問い合わせください。
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="例: イベント主催について"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              お名前（ニックネーム可） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="お名前またはニックネーム"
              required
            />
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
              placeholder="example@email.com"
              required
            />
            {session?.user?.email && (
              <p className="mt-1 text-xs text-zinc-500">
                ログイン中のアカウント: {session.user.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              お問い合わせ内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={10}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="お問い合わせ内容をご記入ください"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              as="link"
              href="/app/mypage"
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
          router.push("/app/mypage");
        }}
        title="送信完了"
        footer={
          <Button
            variant="primary"
            size="md"
            rounded="md"
            onClick={() => {
              setIsSuccessModalOpen(false);
              router.push("/app/mypage");
            }}
          >
            OK
          </Button>
        }
      >
        <p className="text-sm text-zinc-600">
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
        <p className="text-sm text-zinc-600">
          {errorMessage}
        </p>
      </ModalBase>
    </main>
  );
}


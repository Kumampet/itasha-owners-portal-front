"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AdminNewOrganizerPage() {
  const { data: session, status } = useSession();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      return;
    }
  }, [session, status]);

  const generatePassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const password = generatePassword();
      const res = await fetch("/api/admin/organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name || null,
          password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "アカウントの作成に失敗しました");
      }

      await res.json();
      setCreatedAccount({ email: formData.email, password });
      setSuccess(true);
      setFormData({ email: "", name: "" });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "アカウントの作成に失敗しました"
      );
    } finally {
      setSaving(false);
    }
  };

  // ローディング中
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
      </div>
    );
  }

  // admin以外はアクセス拒否
  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-zinc-900">
            この画面へのアクセスは許可されていません。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 sm:text-3xl">
        オーガナイザーアカウント作成
      </h1>

      {success && createdAccount && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-green-900">
            アカウントが作成されました
          </h2>
          <div className="space-y-2 text-sm text-green-800">
            <p>
              <strong>メールアドレス:</strong> {createdAccount.email}
            </p>
            <p>
              <strong>パスワード:</strong> {createdAccount.password}
            </p>
            <p className="mt-4 text-xs">
              ※ この情報はメールでも送信されました。オーガナイザーに共有してください。
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6"
      >
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            メールアドレス *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            required
            placeholder="organizer@example.com"
          />
          <p className="mt-1 text-xs text-zinc-500">
            このメールアドレスにアカウント情報が送信されます
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            名前（任意）
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            placeholder="山田 太郎"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "作成中..." : "アカウントを作成"}
          </button>
          <Link
            href="/admin"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}


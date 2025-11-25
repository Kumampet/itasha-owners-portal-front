"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminNewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    theme: "",
    description: "",
    original_url: "",
    event_date: "",
    entry_start_at: "",
    payment_due_at: "",
    approval_status: "DRAFT",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create event");

      const data = await res.json();
      router.push(`/admin/events/${data.id}`);
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("作成に失敗しました");
    } finally {
      setSaving(false);
    }
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

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            イベント名 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            テーマ
          </label>
          <input
            type="text"
            value={formData.theme}
            onChange={(e) =>
              setFormData({ ...formData, theme: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            説明
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={5}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            公式URL *
          </label>
          <input
            type="url"
            value={formData.original_url}
            onChange={(e) =>
              setFormData({ ...formData, original_url: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              開催日 *
            </label>
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) =>
                setFormData({ ...formData, event_date: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              エントリー開始日
            </label>
            <input
              type="date"
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
              type="date"
              value={formData.payment_due_at}
              onChange={(e) =>
                setFormData({ ...formData, payment_due_at: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            ステータス
          </label>
          <select
            value={formData.approval_status}
            onChange={(e) =>
              setFormData({ ...formData, approval_status: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            <option value="DRAFT">下書き</option>
            <option value="PENDING">承認待ち</option>
            <option value="APPROVED">承認済み</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "作成中..." : "作成"}
          </button>
          <Link
            href="/admin/events"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}


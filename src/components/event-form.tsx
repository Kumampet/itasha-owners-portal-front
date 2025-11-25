"use client";

import { useState } from "react";

export type EventFormData = {
  name: string;
  theme: string;
  description: string;
  original_url: string;
  event_date: string;
  entry_start_at: string;
  payment_due_at: string;
};

interface EventFormProps {
  formData: EventFormData;
  onFormDataChange: (data: EventFormData) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  children?: React.ReactNode; // ボタン部分を親から受け取る
}

export default function EventForm({
  formData,
  onFormDataChange,
  tags,
  onTagsChange,
  children,
}: EventFormProps) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedTag = tagInput.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        onTagsChange([...tags, trimmedTag]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          イベント名 *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            onFormDataChange({ ...formData, name: e.target.value })
          }
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          副題
        </label>
        <input
          type="text"
          value={formData.theme}
          onChange={(e) =>
            onFormDataChange({ ...formData, theme: e.target.value })
          }
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          placeholder="副題（任意）"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          タグ
        </label>
        <div className="mt-1">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="タグを入力してEnterで確定"
            className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-zinc-500 hover:text-zinc-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          説明
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            onFormDataChange({ ...formData, description: e.target.value })
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
            onFormDataChange({ ...formData, original_url: e.target.value })
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
              onFormDataChange({ ...formData, event_date: e.target.value })
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
              onFormDataChange({
                ...formData,
                entry_start_at: e.target.value,
              })
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
              onFormDataChange({ ...formData, payment_due_at: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      {children && <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">{children}</div>}
    </form>
  );
}


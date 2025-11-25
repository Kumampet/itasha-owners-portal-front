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
  postal_code: string;
  prefecture: string;
  city: string;
  street_address: string;
  venue_name: string;
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
  const [searchingPostalCode, setSearchingPostalCode] = useState(false);

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

  const handlePostalCodeSearch = async () => {
    const postalCode = formData.postal_code.replace(/[^0-9]/g, "");
    if (postalCode.length !== 7) {
      alert("郵便番号は7桁の数字で入力してください");
      return;
    }

    setSearchingPostalCode(true);
    try {
      // Yahoo!郵便番号検索APIを使用
      const response = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`
      );
      const data = await response.json();

      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0];
        onFormDataChange({
          ...formData,
          prefecture: result.address1 || "",
          city: result.address2 || "",
        });
      } else {
        alert("郵便番号が見つかりませんでした");
      }
    } catch (error) {
      console.error("Failed to search postal code:", error);
      alert("郵便番号の検索に失敗しました");
    } finally {
      setSearchingPostalCode(false);
    }
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

      <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">開催地（住所）</h3>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            郵便番号
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  postal_code: e.target.value,
                })
              }
              placeholder="1234567"
              maxLength={7}
              className="block w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <button
              type="button"
              onClick={handlePostalCodeSearch}
              disabled={searchingPostalCode || !formData.postal_code}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {searchingPostalCode ? "検索中..." : "検索"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            都道府県 *
          </label>
          <select
            value={formData.prefecture}
            onChange={(e) =>
              onFormDataChange({ ...formData, prefecture: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            required
          >
            <option value="">選択してください</option>
            <option value="北海道">北海道</option>
            <option value="青森県">青森県</option>
            <option value="岩手県">岩手県</option>
            <option value="宮城県">宮城県</option>
            <option value="秋田県">秋田県</option>
            <option value="山形県">山形県</option>
            <option value="福島県">福島県</option>
            <option value="茨城県">茨城県</option>
            <option value="栃木県">栃木県</option>
            <option value="群馬県">群馬県</option>
            <option value="埼玉県">埼玉県</option>
            <option value="千葉県">千葉県</option>
            <option value="東京都">東京都</option>
            <option value="神奈川県">神奈川県</option>
            <option value="新潟県">新潟県</option>
            <option value="富山県">富山県</option>
            <option value="石川県">石川県</option>
            <option value="福井県">福井県</option>
            <option value="山梨県">山梨県</option>
            <option value="長野県">長野県</option>
            <option value="岐阜県">岐阜県</option>
            <option value="静岡県">静岡県</option>
            <option value="愛知県">愛知県</option>
            <option value="三重県">三重県</option>
            <option value="滋賀県">滋賀県</option>
            <option value="京都府">京都府</option>
            <option value="大阪府">大阪府</option>
            <option value="兵庫県">兵庫県</option>
            <option value="奈良県">奈良県</option>
            <option value="和歌山県">和歌山県</option>
            <option value="鳥取県">鳥取県</option>
            <option value="島根県">島根県</option>
            <option value="岡山県">岡山県</option>
            <option value="広島県">広島県</option>
            <option value="山口県">山口県</option>
            <option value="徳島県">徳島県</option>
            <option value="香川県">香川県</option>
            <option value="愛媛県">愛媛県</option>
            <option value="高知県">高知県</option>
            <option value="福岡県">福岡県</option>
            <option value="佐賀県">佐賀県</option>
            <option value="長崎県">長崎県</option>
            <option value="熊本県">熊本県</option>
            <option value="大分県">大分県</option>
            <option value="宮崎県">宮崎県</option>
            <option value="鹿児島県">鹿児島県</option>
            <option value="沖縄県">沖縄県</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            市区町村 *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) =>
              onFormDataChange({ ...formData, city: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            番地 *
          </label>
          <input
            type="text"
            value={formData.street_address}
            onChange={(e) =>
              onFormDataChange({
                ...formData,
                street_address: e.target.value,
              })
            }
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            会場名 *
          </label>
          <input
            type="text"
            value={formData.venue_name}
            onChange={(e) =>
              onFormDataChange({ ...formData, venue_name: e.target.value })
            }
            placeholder="例: 東京ドーム"
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            required
          />
        </div>
      </div>

      {children && <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">{children}</div>}
    </form>
  );
}


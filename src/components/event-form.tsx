"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "./button";
import { DateTimeInput } from "./date-time-input";
import { Tooltip } from "./tooltip";

// エントリー情報の型
export type EventEntryData = {
  entry_number: number;
  entry_start_at: string;
  entry_start_public_at: string;
  entry_deadline_at: string;
  payment_due_type: "ABSOLUTE" | "RELATIVE";
  payment_due_at: string;
  payment_due_days_after_entry: number | null;
  payment_due_public_at: string;
};

export type EventFormData = {
  name: string;
  description: string;
  event_date: string;
  is_multi_day: boolean;
  event_end_date: string;
  postal_code: string;
  prefecture: string;
  city: string;
  street_address: string;
  venue_name: string;
  organizer_email: string;
  organizer_user_id?: string | null;
  image_url: string;
  official_urls: string[];
  entries: EventEntryData[];
};

interface EventFormProps {
  formData: EventFormData;
  onFormDataChange: (data: EventFormData) => void;
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  children?: React.ReactNode; // ボタン部分を親から受け取る
  isAdmin?: boolean; // 管理者権限かどうか
  organizerUsers?: Array<{ id: string; email: string; name: string | null }>; // ORGANIZER権限のユーザー一覧
}

export default function EventForm({
  formData,
  onFormDataChange,
  keywords,
  onKeywordsChange,
  children,
  isAdmin = false,
  organizerUsers = [],
}: EventFormProps) {
  const [keywordInput, setKeywordInput] = useState("");
  const [searchingPostalCode, setSearchingPostalCode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedKeyword = keywordInput.trim();
      if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
        onKeywordsChange([...keywords, trimmedKeyword]);
        setKeywordInput("");
      }
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    onKeywordsChange(keywords.filter((keyword) => keyword !== keywordToRemove));
  };

  const handleAddUrlInput = () => {
    if (formData.official_urls.length >= 10) {
      alert("URLは最大10個まで追加できます");
      return;
    }
    onFormDataChange({
      ...formData,
      official_urls: [...formData.official_urls, ""],
    });
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.official_urls];
    newUrls[index] = value;
    onFormDataChange({
      ...formData,
      official_urls: newUrls,
    });
  };

  const handleRemoveUrl = (index: number) => {
    if (formData.official_urls.length <= 1) {
      alert("最低1つのURL入力欄が必要です");
      return;
    }
    const newUrls = formData.official_urls.filter((_, i) => i !== index);
    onFormDataChange({
      ...formData,
      official_urls: newUrls,
    });
  };

  const handleAddEntry = () => {
    if (formData.entries.length >= 5) {
      alert("エントリーは最大5つまで追加できます");
      return;
    }
    const newEntryNumber = formData.entries.length + 1;
    onFormDataChange({
      ...formData,
      entries: [
        ...formData.entries,
        {
          entry_number: newEntryNumber,
          entry_start_at: "",
          entry_start_public_at: "",
          entry_deadline_at: "",
          payment_due_type: "ABSOLUTE",
          payment_due_at: "",
          payment_due_days_after_entry: null,
          payment_due_public_at: "",
        },
      ],
    });
  };

  const handleRemoveEntry = (entryNumber: number) => {
    if (formData.entries.length <= 1) {
      alert("最低1つのエントリー情報が必要です");
      return;
    }
    const updatedEntries = formData.entries
      .filter((entry) => entry.entry_number !== entryNumber)
      .map((entry, index) => ({
        ...entry,
        entry_number: index + 1,
      }));
    onFormDataChange({
      ...formData,
      entries: updatedEntries,
    });
  };

  const handleEntryChange = (
    entryNumber: number,
    field: keyof EventEntryData,
    value: string | number | null
  ) => {
    onFormDataChange({
      ...formData,
      entries: formData.entries.map((entry) =>
        entry.entry_number === entryNumber ? { ...entry, [field]: value } : entry
      ),
    });
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

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルタイプの検証
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルのみアップロード可能です");
      return;
    }

    // ファイルサイズの検証（5MBまで）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("ファイルサイズは5MB以下にしてください");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "画像のアップロードに失敗しました");
      }

      const data = await response.json();
      onFormDataChange({ ...formData, image_url: data.url });
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert(error instanceof Error ? error.message : "画像のアップロードに失敗しました");
    } finally {
      setUploadingImage(false);
      // ファイル入力をリセット（同じファイルを再度選択できるように）
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageRemove = () => {
    onFormDataChange({ ...formData, image_url: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6"
    >
      {/* イベント名 */}
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

      {/* 開催日 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            開催日 *
          </label>
          <div className="mt-1">
            <DateTimeInput
              type="date"
              value={formData.event_date}
              onChange={(value) =>
                onFormDataChange({ ...formData, event_date: value })
              }
              required
            />
          </div>
        </div>

        {/* 複数日開催チェックボックス */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_multi_day"
            checked={formData.is_multi_day}
            onChange={(e) =>
              onFormDataChange({
                ...formData,
                is_multi_day: e.target.checked,
                event_end_date: e.target.checked ? formData.event_end_date : "",
              })
            }
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="is_multi_day" className="ml-2 text-sm text-zinc-700">
            複数日開催
          </label>
        </div>

        {/* 終了日（複数日開催の場合） */}
        {formData.is_multi_day && (
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              終了日 *
            </label>
            <div className="mt-1">
              <DateTimeInput
                type="date"
                value={formData.event_end_date}
                onChange={(value) =>
                  onFormDataChange({
                    ...formData,
                    event_end_date: value,
                  })
                }
                required={formData.is_multi_day}
                min={formData.event_date}
              />
            </div>
          </div>
        )}
      </div>

      {/* イベント概要文 */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          イベント概要文 * <span className="text-xs text-zinc-500">（最大200文字）</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 200) {
              onFormDataChange({ ...formData, description: value });
            }
          }}
          rows={4}
          maxLength={200}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          required
        />
        <p className="mt-1 text-xs text-zinc-500">
          {formData.description.length} / 200文字
        </p>
      </div>

      {/* キーワードタグ */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          キーワードタグ
        </label>
        <div className="mt-1">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleAddKeyword}
            placeholder="キーワードを入力してEnterで確定"
            className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          {keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
                >
                  {keyword}
                  <Button
                    variant="secondary"
                    size="sm"
                    rounded="md"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-1 h-auto p-0 border-0 bg-transparent text-zinc-500 hover:text-zinc-900"
                  >
                    ×
                  </Button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 公式サイトURL */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700">
            公式サイトURL * <span className="text-xs text-zinc-500">（1個以上必須）</span>
          </label>
          {formData.official_urls.length < 10 && (
            <Button
              variant="secondary"
              size="sm"
              rounded="md"
              onClick={handleAddUrlInput}
            >
              + URL入力欄を追加
            </Button>
          )}
        </div>
        <div className="mt-2 space-y-2">
          {formData.official_urls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                placeholder="https://example.com"
                className="block flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                required={index === 0}
              />
              {formData.official_urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="URLを削除"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {formData.official_urls.length === 0 && (
          <p className="mt-1 text-xs text-red-500">
            最低1つのURL入力欄が必要です
          </p>
        )}
      </div>

      {/* イメージ画像 */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          イメージ画像 <span className="text-xs text-zinc-500">（16:9推奨）</span>
        </label>
        <div className="mt-1 space-y-2">
          <Tooltip
            content="この機能は将来実装予定です。"
            disabled={false}
            arrowPosition="center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileSelect}
              disabled={true}
              className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </Tooltip>
          {uploadingImage && (
            <p className="text-xs text-zinc-500">アップロード中...</p>
          )}
        </div>
        {formData.image_url && (
          <div className="mt-2 relative">
            <Image
              src={formData.image_url}
              alt="プレビュー"
              width={800}
              height={192}
              className="max-h-48 w-full rounded-md object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              unoptimized
            />
            <button
              type="button"
              onClick={handleImageRemove}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="画像を削除"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* エントリー情報 */}
      <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">エントリー情報</h3>
          {formData.entries.length < 5 && (
            <Button
              variant="secondary"
              size="sm"
              rounded="md"
              onClick={handleAddEntry}
            >
              + エントリーを追加
            </Button>
          )}
        </div>

        {/* 公開仕様の説明 */}
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-700 leading-relaxed">
            エントリー開始日時公開日時はエントリー開始日時情報をこの設定日時にこのページで公開されるように設定されます。
            <br />
            エントリー終了日時はエントリー公開日時の公開日時と同時に公開されます。
            <br />
            支払期限日時公開日時も同様の仕様です。
          </p>
        </div>

        {formData.entries.map((entry) => (
          <div
            key={entry.entry_number}
            className="space-y-3 rounded-md border border-zinc-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-700">
                {entry.entry_number}次エントリー
              </h4>
              {formData.entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveEntry(entry.entry_number)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="エントリーを削除"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* エントリー開始日時とエントリー開始日公開日時、エントリー締切日時 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    エントリー開始日時 *
                  </label>
                  <div className="mt-1">
                    <DateTimeInput
                      type="datetime-local"
                      value={entry.entry_start_at}
                      onChange={(value) =>
                        handleEntryChange(
                          entry.entry_number,
                          "entry_start_at",
                          value
                        )
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    エントリー開始日公開日時
                  </label>
                  <div className="mt-1">
                    <DateTimeInput
                      type="datetime-local"
                      value={entry.entry_start_public_at}
                      onChange={(value) =>
                        handleEntryChange(
                          entry.entry_number,
                          "entry_start_public_at",
                          value
                        )
                      }
                      placeholder="未入力時は即時公開"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    エントリー終了日時 *
                  </label>
                  <div className="mt-1">
                    <DateTimeInput
                      type="datetime-local"
                      value={entry.entry_deadline_at}
                      onChange={(value) =>
                        handleEntryChange(
                          entry.entry_number,
                          "entry_deadline_at",
                          value
                        )
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 支払期限タイプ選択 */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-2">
                  支払期限の設定方法 *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`payment_due_type_${entry.entry_number}`}
                      value="ABSOLUTE"
                      checked={entry.payment_due_type === "ABSOLUTE"}
                      onChange={(e) =>
                        handleEntryChange(
                          entry.entry_number,
                          "payment_due_type",
                          e.target.value
                        )
                      }
                      className="h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-xs text-zinc-700">日付の絶対値</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`payment_due_type_${entry.entry_number}`}
                      value="RELATIVE"
                      checked={entry.payment_due_type === "RELATIVE"}
                      onChange={(e) =>
                        handleEntryChange(
                          entry.entry_number,
                          "payment_due_type",
                          e.target.value
                        )
                      }
                      className="h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-xs text-zinc-700">エントリー申し込みからn日以内</span>
                  </label>
                </div>
              </div>

              {/* 支払期限日時と支払期限日時公開日時（2列グリッド） */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {entry.payment_due_type === "ABSOLUTE" ? (
                  <div>
                    <label className="block text-xs font-medium text-zinc-700">
                      支払期限日時 *
                    </label>
                    <div className="mt-1">
                      <DateTimeInput
                        type="datetime-local"
                        value={entry.payment_due_at}
                        onChange={(value) =>
                          handleEntryChange(
                            entry.entry_number,
                            "payment_due_at",
                            value
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-zinc-700">
                      エントリー申し込みから何日以内 *
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        min="1"
                        value={entry.payment_due_days_after_entry || ""}
                        onChange={(e) =>
                          handleEntryChange(
                            entry.entry_number,
                            "payment_due_days_after_entry",
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                        placeholder="例: 7"
                        className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        required
                      />
                      <p className="mt-1 text-xs text-zinc-500">
                        エントリー申し込み日から指定した日数以内に支払いが必要です
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-700">
                    支払期限日時公開日時
                  </label>
                  <div className="mt-1">
                    <DateTimeInput
                      type="datetime-local"
                      value={entry.payment_due_public_at}
                      onChange={(value) =>
                        handleEntryChange(
                          entry.entry_number,
                          "payment_due_public_at",
                          value
                        )
                      }
                      placeholder="未入力時は即時公開"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 開催地（住所） */}
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
            <Button
              variant="primary"
              size="md"
              rounded="md"
              onClick={handlePostalCodeSearch}
              disabled={searchingPostalCode || !formData.postal_code}
            >
              {searchingPostalCode ? "検索中..." : "検索"}
            </Button>
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

      {/* 作成者選択（管理者権限の場合のみ） */}
      {isAdmin && organizerUsers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            作成者（イベント編集権） *
          </label>
          <div className="mt-1">
            <select
              value={formData.organizer_user_id || ""}
              onChange={(e) => {
                const selectedUserId = e.target.value || null;
                const selectedUser = organizerUsers.find((u) => u.id === selectedUserId);
                onFormDataChange({
                  ...formData,
                  organizer_user_id: selectedUserId,
                  organizer_email: selectedUser?.email || formData.organizer_email,
                });
              }}
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
            >
              <option value="">選択してください</option>
              {organizerUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} ({user.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              イベントの編集権限を持つユーザーを選択します
            </p>
          </div>
        </div>
      )}

      {children && (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {children}
        </div>
      )}
    </form>
  );
}

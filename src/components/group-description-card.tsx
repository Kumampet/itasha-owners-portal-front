"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/button";
import { SafeHtmlContent } from "@/components/safe-html-content";
import { WysiwygEditor } from "@/components/wysiwyg-editor";
import { sanitizeHtml } from "@/lib/html-sanitizer";

type GroupDescriptionCardProps = {
  groupId: string;
  groupDescription: string | null;
  isLeader: boolean;
  onUpdate: () => void;
};

/**
 * 団体説明カードコンポーネント（WYSIWYGエディタ統合）
 * 既存の「お知らせ」とは別に、新しく追加された「団体説明」機能
 */
export function GroupDescriptionCard({
  groupId,
  groupDescription,
  isLeader,
  onUpdate,
}: GroupDescriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(groupDescription || "");
  const [saving, setSaving] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlEditValue, setHtmlEditValue] = useState("");

  // 編集モードに入ったときに値をリセット
  useEffect(() => {
    if (isEditing) {
      setEditValue(groupDescription || "");
      setHtmlEditValue(groupDescription || "");
      setIsHtmlMode(false);
    }
  }, [isEditing, groupDescription]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // HTMLモードの場合はHTML直接編集の値を、そうでない場合はWYSIWYGエディタの値を使用
      let valueToSave = isHtmlMode ? htmlEditValue : editValue;

      // HTML直接編集モードの場合、DOCTYPEやhtml/bodyタグを削除（SafeHtmlContent内で表示される部分のみ）
      if (isHtmlMode && valueToSave) {
        // DOCTYPE、html、head、bodyタグを削除
        valueToSave = valueToSave
          .replace(/<!DOCTYPE[^>]*>/gi, "")
          .replace(/<html[^>]*>/gi, "")
          .replace(/<\/html>/gi, "")
          .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
          .replace(/<body[^>]*>/gi, "")
          .replace(/<\/body>/gi, "")
          .trim();
      }

      // クライアントサイドでサニタイズ（サーバーサイドでも再度サニタイズされる）
      const sanitizedValue = sanitizeHtml(valueToSave.trim());

      const res = await fetch(`/api/groups/${groupId}/description`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupDescription: sanitizedValue || null,
        }),
      });

      if (!res.ok) {
        // Content-Typeを確認してからJSONをパース
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update group description");
        } else {
          // HTMLエラーページが返された場合
          const errorText = await res.text();
          console.error("API Error Response:", errorText);
          throw new Error(`サーバーエラーが発生しました (${res.status})`);
        }
      }

      // レスポンスがJSONか確認
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        await res.json(); // レスポンスを読み込む
      }

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to update group description:", error);
      alert(`団体説明の更新に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(groupDescription || "");
    setHtmlEditValue(groupDescription || "");
    setIsEditing(false);
    setIsHtmlMode(false);
  };

  const handleClearFormatting = () => {
    // 装飾を全解除（プレーンテキストに変換）
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = editValue;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    setEditValue(plainText);
    setHtmlEditValue(plainText);
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
          団体説明
        </h2>
        {isLeader && !isEditing && (
          <Button
            variant="secondary"
            size="sm"
            rounded="md"
            onClick={() => setIsEditing(true)}
            className="whitespace-nowrap"
          >
            編集
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          {/* モード切り替えボタン */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant={!isHtmlMode ? "primary" : "secondary"}
                size="sm"
                rounded="md"
                onClick={() => setIsHtmlMode(false)}
                disabled={saving}
              >
                WYSIWYG編集
              </Button>
              <Button
                variant={isHtmlMode ? "primary" : "secondary"}
                size="sm"
                rounded="md"
                onClick={() => setIsHtmlMode(true)}
                disabled={saving}
              >
                HTML直接編集
              </Button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              rounded="md"
              onClick={handleClearFormatting}
              disabled={saving}
            >
              装飾全解除
            </Button>
          </div>

          {/* WYSIWYGエディタモード */}
          {!isHtmlMode ? (
            <div className="border border-zinc-300 rounded-lg overflow-hidden">
              <WysiwygEditor
                value={editValue}
                onChange={setEditValue}
                placeholder="団体説明を入力してください..."
                disabled={saving}
              />
            </div>
          ) : (
            /* HTML直接編集モード */
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-700">
                HTML直接編集
              </label>
              <textarea
                value={htmlEditValue}
                onChange={(e) => setHtmlEditValue(e.target.value)}
                placeholder={`<p>ここに内容を入力してください</p>`}
                rows={10}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
              />
              <p className="text-xs text-zinc-500">
                注意: SafeHtmlContent内で表示される部分のみを入力してください。<br />許可タグ: p, span, div, strong, em, u, s, a, br, h1-h6
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              rounded="md"
              onClick={handleCancel}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              size="sm"
              rounded="md"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {groupDescription ? (
            <div className="prose prose-sm max-w-none">
              <SafeHtmlContent
                html={groupDescription}
                className="break-words text-sm text-zinc-700"
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              団体説明はまだありません
            </p>
          )}
        </div>
      )}
    </section>
  );
}

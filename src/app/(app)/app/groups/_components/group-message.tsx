"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { MessageBubble } from "@/components/message-bubble";
import { useSnackbar } from "@/contexts/snackbar-context";

type ReactionUser = {
  id: string;
  name: string | null;
  displayName: string | null;
};

type Reaction = {
  emoji: string;
  count: number;
  users: ReactionUser[];
};

type GroupMessage = {
  id: string;
  content: string;
  isAnnouncement: boolean;
  sender: {
    id: string;
    name: string | null;
    displayName?: string | null;
    email: string;
  };
  createdAt: string;
  reactions?: Reaction[];
};

interface GroupMessageProps {
  groupId: string;
  messages: GroupMessage[];
  messagesLoading: boolean;
  currentUserId?: string;
  hoveredMessageId: string | null;
  setHoveredMessageId: (id: string | null) => void;
  openEmojiPickerMessageId: string | null;
  setOpenEmojiPickerMessageId: (id: string | null) => void;
  onReactionChange: () => void;
  isLeader: boolean;
  isAnnouncement: boolean;
  setIsAnnouncement: (value: boolean) => void;
  messageContent: string;
  setMessageContent: (value: string) => void;
  sending: boolean;
  onSendMessage: (imageFile: File | null) => Promise<void>;
  isMobile: boolean;
}

export function GroupMessage({
  groupId,
  messages,
  messagesLoading,
  currentUserId,
  hoveredMessageId,
  setHoveredMessageId,
  openEmojiPickerMessageId,
  setOpenEmojiPickerMessageId,
  onReactionChange,
  isLeader,
  isAnnouncement,
  setIsAnnouncement,
  messageContent,
  setMessageContent,
  sending,
  onSendMessage,
  isMobile,
}: GroupMessageProps) {
  const { showSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルタイプの検証
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/heic', 'image/heif'];
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.heic', '.heif'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    const isValidType = allowedTypes.includes(file.type.toLowerCase()) ||
      allowedExtensions.includes(extension);

    if (!isValidType) {
      // 動画形式の明示的な拒否
      const videoMimeTypes = ['video/', 'application/octet-stream'];
      const isVideo = videoMimeTypes.some(type => file.type.startsWith(type)) ||
        ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'].some(ext =>
          file.name.toLowerCase().endsWith(ext)
        );

      if (isVideo) {
        showSnackbar("動画ファイルはアップロードできません。画像ファイル（PNG, JPG, JPEG）を選択してください", "error");
        return;
      }

      showSnackbar("サポートされていないファイル形式です。PNG, JPG, JPEG形式の画像を選択してください", "error");
      return;
    }

    // ファイルサイズの検証（20MBまで）
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      showSnackbar("ファイルサイズは20MB以下にしてください", "error");
      return;
    }

    // ファイルオブジェクトを保持
    setSelectedImageFile(file);

    // プレビュー用のURLを生成
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    showSnackbar("画像を選択しました", "success");

    // ファイル入力のリセット（同じファイルを再度選択できるように）
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImagePreview = () => {
    // プレビューURLを解放
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
  };

  // クリーンアップ：imagePreviewUrlが変更されるたびに古いURLを解放、アンマウント時にもクリーンアップ
  useEffect(() => {
    // 現在のimagePreviewUrlを保存（クロージャで保持）
    const currentUrl = imagePreviewUrl;

    return () => {
      // クリーンアップ時に保存したURLをrevoke
      // imagePreviewUrlが変更されるたびに、古いURLが確実に解放される
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [imagePreviewUrl]);

  // テキストエリアに表示する内容（HTMLタグを除外）- useMemoでメモ化
  const displayTextContent = useMemo(
    () => messageContent.replace(/<img[^>]*>/g, "").trim(),
    [messageContent]
  );

  // onEmojiPickerOpenChangeをuseCallbackでメモ化
  const handleEmojiPickerOpenChange = useCallback(
    (messageId: string | null, isOpen: boolean) => {
      if (isOpen) {
        setOpenEmojiPickerMessageId(messageId);
      } else {
        setOpenEmojiPickerMessageId(null);
      }
    },
    [setOpenEmojiPickerMessageId]
  );

  // メッセージごとのreactions配列をメモ化
  const memoizedMessages = useMemo(() => {
    return messages.map((message) => ({
      ...message,
      memoizedReactions: (message.reactions || []).map((reaction) => ({
        emoji: reaction.emoji,
        count: reaction.count,
        users: reaction.users.map((user) => ({
          id: user.id,
          name: user.name,
          displayName: user.displayName,
        })),
      })),
      memoizedSender: {
        displayName: message.sender.displayName,
        name: message.sender.name,
      },
    }));
  }, [messages]);
  return (
    <div className="flex flex-col min-h-[400px] sm:min-h-[500px] overflow-hidden">
      {/* メッセージ一覧（スクロール可能） */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3 pb-24 sm:pb-4" data-messages-container>
        {messagesLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            まだメッセージがありません
          </p>
        ) : (
          // メッセージを表示（古い順）
          memoizedMessages.map((message) => {
            const isOwnMessage = message.sender.id === currentUserId;
            const isHovered = hoveredMessageId === message.id;
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} relative`}
              >
                <MessageBubble
                  messageId={message.id}
                  groupId={groupId}
                  content={message.content}
                  isAnnouncement={message.isAnnouncement}
                  isOwnMessage={isOwnMessage}
                  reactions={message.memoizedReactions}
                  sender={message.memoizedSender}
                  createdAt={message.createdAt}
                  isMobile={isMobile}
                  isHovered={isHovered}
                  openEmojiPickerMessageId={openEmojiPickerMessageId}
                  onReactionChange={onReactionChange}
                  onHoverChange={setHoveredMessageId}
                  onEmojiPickerOpenChange={handleEmojiPickerOpenChange}
                />
              </div>
            );
          })
        )}
      </div>

      {/* メッセージ送信フォーム（固定） */}
      <div className="border-t border-zinc-200 bg-white p-4 flex-shrink-0">
        <div className="space-y-2">
          {/* 画像プレビュー */}
          {imagePreviewUrl && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreviewUrl}
                alt="プレビュー"
                className="max-w-xs max-h-32 sm:max-h-48 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImagePreview}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="画像を削除"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex gap-2 flex-row">
                <textarea
                  value={displayTextContent}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 全角文字換算で1000文字を超える場合は制限
                    const charCount = Array.from(value).length;
                    if (charCount <= 1000) {
                      setMessageContent(value);
                    }
                  }}
                  placeholder="メッセージを入力してください..."
                  rows={2}
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if ((displayTextContent.trim() || selectedImageFile) && !sending) {
                        try {
                          await onSendMessage(selectedImageFile);
                          // 送信成功後に画像プレビューをクリア
                          handleRemoveImagePreview();
                        } catch (error) {
                          // 送信失敗時は画像プレビューを保持
                          console.error("Failed to send message:", error);
                        }
                      }
                    }
                  }}
                />
                {/* 画像添付ボタン */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/heic,image/heif"
                    onChange={handleImageFileSelect}
                    disabled={sending}
                    className="hidden"
                    id={`image-upload-${groupId}`}
                  />
                  <label
                    htmlFor={`image-upload-${groupId}`}
                    className={`flex items-center gap-1 text-xs text-zinc-600 cursor-pointer hover:text-zinc-900 transition-colors ${sending ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {isLeader && (
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={isAnnouncement}
                  onChange={(e) => setIsAnnouncement(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-zinc-700">
                  一斉連絡として送信
                </span>
              </label>
            )}
            <Button
              variant="primary"
              size="md"
              rounded="md"
              onClick={async () => {
                try {
                  await onSendMessage(selectedImageFile);
                  // 送信成功後に画像プレビューをクリア
                  handleRemoveImagePreview();
                } catch (error) {
                  // 送信失敗時は画像プレビューを保持
                  console.error("Failed to send message:", error);
                }
              }}
              disabled={sending || (!displayTextContent.trim() && !selectedImageFile)}
              className="whitespace-nowrap self-end"
            >
              {sending ? "送信中..." : "送信"}
            </Button>
          </div>
        </div>
        <div className="flex justify-end">
          <p className="text-xs text-zinc-500">
            {Array.from(displayTextContent).length} / 1000文字
          </p>
        </div>
      </div>
    </div>
  );
}

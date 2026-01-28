"use client";

import { SafeMessageContent } from "@/components/safe-message-content";
import { SafeHtmlContent } from "@/components/safe-html-content";
import { MessageReactions } from "@/components/message-reactions";
import { ImageViewerModal } from "@/components/image-viewer-modal";
import { useRef, memo, useState } from "react";
import { formatDateTime } from "@/lib/date-utils";

type MessageBubbleProps = {
  messageId: string;
  groupId: string;
  content: string;
  isAnnouncement: boolean;
  isOwnMessage: boolean;
  reactions: Array<{
    emoji: string;
    count: number;
    users: Array<{
      id: string;
      name: string | null;
      displayName: string | null;
    }>;
  }>;
  sender: {
    displayName?: string | null;
    name: string | null;
  };
  createdAt: string;
  isMobile: boolean;
  isHovered: boolean;
  openEmojiPickerMessageId: string | null;
  onReactionChange: () => void;
  onHoverChange: (messageId: string | null) => void;
  onEmojiPickerOpenChange: (messageId: string | null, isOpen: boolean) => void;
};

const truncateName = (name: string | null, maxLength: number = 12): string => {
  if (!name) return "名前未設定";
  const nameArray = Array.from(name);
  if (nameArray.length <= maxLength) return name;
  return nameArray.slice(0, maxLength).join("") + "...";
};

function MessageBubbleComponent({
  messageId,
  groupId,
  content,
  isAnnouncement,
  isOwnMessage,
  reactions,
  sender,
  createdAt,
  isMobile,
  isHovered,
  openEmojiPickerMessageId,
  onReactionChange,
  onHoverChange,
  onEmojiPickerOpenChange,
}: MessageBubbleProps) {
  const messageBubbleRef = useRef<HTMLDivElement>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  return (
    <>
      {/* 画像拡大モーダル */}
      <ImageViewerModal
        isOpen={selectedImageUrl !== null}
        imageUrl={selectedImageUrl}
        onClose={() => setSelectedImageUrl(null)}
      />
      <div
        ref={messageBubbleRef}
        className={`max-w-[65vw] sm:max-w-[65%] rounded-2xl px-4 py-2 break-words relative ${isOwnMessage
          ? isAnnouncement
            ? "bg-emerald-500 text-white"
            : "bg-zinc-900 text-white"
          : isAnnouncement
            ? "bg-emerald-50 border border-emerald-200 text-zinc-900"
            : "bg-zinc-100 text-zinc-900"
          }`}
        onMouseEnter={() => {
          if (!isMobile && !isOwnMessage) {
            onHoverChange(messageId);
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            // マウスがボタンや絵文字ピッカーに移動した場合はホバー状態を維持
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (
              relatedTarget &&
              (relatedTarget.closest("[data-reaction-button]") ||
                relatedTarget.closest("[data-emoji-picker]"))
            ) {
              return;
            }
            // 絵文字ピッカーが開いている場合はホバー状態を維持
            if (openEmojiPickerMessageId !== messageId) {
              onHoverChange(null);
            }
          }
        }}
        onClick={(e) => {
          // モバイル版：タップでホバー状態を切り替え
          if (isMobile && !isOwnMessage) {
            // リアクションボタンや絵文字ピッカーをクリックした場合は処理しない
            const target = e.target as HTMLElement;
            if (
              target.closest("[data-reaction-button]") ||
              target.closest("[data-emoji-picker]")
            ) {
              return;
            }
            // 既にホバー状態の場合は解除、そうでない場合は設定
            if (isHovered || openEmojiPickerMessageId === messageId) {
              // 絵文字ピッカーが開いている場合は閉じる
              if (openEmojiPickerMessageId === messageId) {
                onEmojiPickerOpenChange(messageId, false);
              }
              onHoverChange(null);
            } else {
              onHoverChange(messageId);
            }
          }
        }}
      >
        {/* PC版：相手のメッセージにホバー時に右側にリアクション追加ボタン */}
        {!isOwnMessage &&
          !isMobile &&
          (isHovered || openEmojiPickerMessageId === messageId) && (
            <div
              className="absolute right-1 top-full ml-2 flex items-center z-10"
              data-reaction-button
            >
              <MessageReactions
                messageBubbleRef={messageBubbleRef}
                messageId={messageId}
                groupId={groupId}
                reactions={[]}
                onReactionChange={onReactionChange}
                isOwnMessage={false}
                showAddButton={true}
                onEmojiPickerOpenChange={(isOpen) => {
                  onEmojiPickerOpenChange(messageId, isOpen);
                }}
              />
            </div>
          )}
        {isAnnouncement && (
          <p className="text-xs font-medium mb-1 opacity-80">一斉連絡</p>
        )}
        <div>
          {/* HTMLメッセージ（画像タグが含まれる）かテキストメッセージかを判別 */}
          {content.includes('<img') ? (
            <SafeHtmlContent
              html={content}
              className={`text-sm break-words ${isOwnMessage ? "text-white" : "text-zinc-700"}`}
              onImageClick={(imageUrl) => setSelectedImageUrl(imageUrl)}
            />
          ) : (
            <SafeMessageContent
              content={content}
              className={`text-sm whitespace-pre-wrap break-words ${isOwnMessage ? "text-white" : "text-zinc-700"
                }`}
              linkClassName={isOwnMessage ? "text-white" : "text-blue-600"}
            />
          )}
        </div>
        {/* SP版：吹き出しの右下にリアクション追加ボタン（常に表示） */}
        {isMobile && !isOwnMessage && (
          <div
            className="absolute bottom-[0px] left-full ml-2 flex items-center"
            data-reaction-button
          >
            <MessageReactions
              messageBubbleRef={messageBubbleRef}
              messageId={messageId}
              groupId={groupId}
              reactions={[]}
              onReactionChange={onReactionChange}
              isOwnMessage={false}
              showAddButton={true}
              onEmojiPickerOpenChange={(isOpen) => {
                onEmojiPickerOpenChange(messageId, isOpen);
              }}
            />
          </div>
        )}
      </div>
      {/* リアクション（吹き出しの外側） */}
      {reactions.length > 0 && (
        <div className={`mt-1 ${isOwnMessage ? "flex justify-end" : ""}`}>
          <MessageReactions
            messageBubbleRef={messageBubbleRef}
            messageId={messageId}
            groupId={groupId}
            reactions={reactions}
            onReactionChange={onReactionChange}
            isOwnMessage={isOwnMessage}
          />
        </div>
      )}
      {/* 送信者名とタイムスタンプ */}
      <div className={`mt-1 px-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
        <p className="text-xs text-zinc-500">
          {truncateName(sender.displayName || sender.name)}{" "}
          {formatDateTime(createdAt)}
        </p>
      </div>
    </>
  );
}

// React.memoでメモ化：propsが変更されない限り再レンダリングしない
export const MessageBubble = memo(MessageBubbleComponent, (prevProps, nextProps) => {
  // カスタム比較関数：重要なpropsのみを比較
  return (
    prevProps.messageId === nextProps.messageId &&
    prevProps.content === nextProps.content &&
    prevProps.isAnnouncement === nextProps.isAnnouncement &&
    prevProps.isOwnMessage === nextProps.isOwnMessage &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.openEmojiPickerMessageId === nextProps.openEmojiPickerMessageId &&
    prevProps.createdAt === nextProps.createdAt &&
    prevProps.sender.displayName === nextProps.sender.displayName &&
    prevProps.sender.name === nextProps.sender.name &&
    prevProps.groupId === nextProps.groupId &&
    // reactions配列の比較（浅い比較）
    JSON.stringify(prevProps.reactions) === JSON.stringify(nextProps.reactions)
  );
});

"use client";

import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { MessageBubble } from "@/components/message-bubble";

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
  onSendMessage: () => void;
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
  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px] sm:h-[calc(100vh-300px)] sm:min-h-[500px] overflow-hidden">
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
          messages.map((message) => {
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
                  reactions={(message.reactions || []).map((reaction) => ({
                    emoji: reaction.emoji,
                    users: reaction.users.map((user) => ({ id: user.id })),
                  }))}
                  sender={{
                    displayName: message.sender.displayName,
                    name: message.sender.name,
                  }}
                  createdAt={message.createdAt}
                  isMobile={isMobile}
                  isHovered={isHovered}
                  openEmojiPickerMessageId={openEmojiPickerMessageId}
                  onReactionChange={onReactionChange}
                  onHoverChange={setHoveredMessageId}
                  onEmojiPickerOpenChange={(messageId, isOpen) => {
                    if (isOpen) {
                      setOpenEmojiPickerMessageId(messageId);
                    } else {
                      setOpenEmojiPickerMessageId(null);
                      // ホバー状態も解除
                      // if (hoveredMessageId === messageId) {
                      //   setHoveredMessageId(null);
                      // }
                    }
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* メッセージ送信フォーム（固定） */}
      <div className="border-t border-zinc-200 bg-white p-4 flex-shrink-0">
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
        <div className="space-y-2">
          <div className="flex gap-2">
            <textarea
              value={messageContent}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (messageContent.trim() && !sending) {
                    onSendMessage();
                  }
                }
              }}
            />
            <Button
              variant="primary"
              size="md"
              rounded="md"
              onClick={onSendMessage}
              disabled={sending || !messageContent.trim()}
              className="whitespace-nowrap self-end"
            >
              {sending ? "送信中..." : "送信"}
            </Button>
          </div>
          <div className="flex justify-end">
            <p className="text-xs text-zinc-500">
              {Array.from(messageContent).length} / 1000文字
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

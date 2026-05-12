"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

// emoji-picker-reactを動的インポート（SSRを無効化）
const EmojiPicker = dynamic(
  () => import("emoji-picker-react"),
  { ssr: false }
);

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

type MessageReactionsProps = {
  messageBubbleRef: React.RefObject<HTMLDivElement | null>;
  messageId: string;
  groupId: string;
  reactions: Reaction[];
  onReactionChange: () => void;
  isOwnMessage: boolean;
  showAddButton?: boolean;
  onAddButtonClick?: () => void;
  onEmojiPickerOpenChange?: (isOpen: boolean) => void;
};

// XのDMを踏襲したよく使う絵文字13種類
const QUICK_REACTIONS = [
  "👍", // 親指を立てた手
  "🙏", // 合掌している手
  "❤️", // 赤いハート
  "👌", // OKサインの手
  "😂", // 涙を流して笑っている顔
  "🔥", // 炎
  "🤣", // 転げ回って笑っている顔
  "👀", // 目
  "💯", // 100の数字
  "😢", // 泣いている顔
  "🤩", // 星の目をした顔
  "😍", // ハートの目をした顔
  "🎉", // 紙吹雪が飛び出すクラッカー
];

// ハート+プラスアイコン
const AddReactionIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v8m-4-4h8"
    />
  </svg>
);

// 共通関数：リアクションの追加/削除
const toggleReaction = async (
  groupId: string,
  messageId: string,
  emoji: string
): Promise<boolean> => {
  try {
    const res = await fetch(
      `/api/groups/${groupId}/messages/${messageId}/reactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emoji }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to toggle reaction");
    }

    return true;
  } catch (error) {
    console.error("Failed to toggle reaction:", error);
    return false;
  }
};

// 共通関数：現在のユーザーがリアクションを付けているかチェック
const getCurrentUserReaction = (
  reaction: Reaction,
  currentUserId: string | undefined
): boolean => {
  if (!currentUserId) return false;
  return reaction.users.some((u) => u.id === currentUserId);
};

// よく使う絵文字ピッカーコンポーネント
type QuickEmojiPickerProps = {
  reactions: Reaction[];
  currentUserId: string | undefined;
  onEmojiClick: (emoji: string) => void;
  onShowFullPicker: () => void;
  className?: string;
  gridClassName?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
  ellipsisButtonClassName?: string;
};

const QuickEmojiPicker = ({
  reactions,
  currentUserId,
  onEmojiClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onShowFullPicker: _onShowFullPicker,
  className = "",
  gridClassName = "grid grid-cols-7 gap-1.5",
  buttonClassName = "text-xl hover:bg-card-elevated rounded p-.5 transition-colors flex items-center justify-center",
  activeButtonClassName = "bg-blue-50",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ellipsisButtonClassName: _ellipsisButtonClassName,
}: QuickEmojiPickerProps) => {
  return (
    <div className={className}>
      <div className={gridClassName}>
        {QUICK_REACTIONS.map((emoji) => {
          const existingReaction = reactions.find((r) => r.emoji === emoji);
          const hasUserReaction = existingReaction
            ? getCurrentUserReaction(existingReaction, currentUserId)
            : false;
          return (
            <button
              key={emoji}
              onClick={() => onEmojiClick(emoji)}
              className={`${buttonClassName} ${hasUserReaction ? activeButtonClassName : ""}`}
              aria-label={`${emoji} を${hasUserReaction ? "削除" : "追加"}`}
            >
              {emoji}
            </button>
          );
        })}
        {/* 3点リーダー - フル絵文字ピッカーを開く */}
        {/* <button
          onClick={onShowFullPicker}
          className={ellipsisButtonClassName}
          aria-label="その他の絵文字を選択"
        >
          ...
        </button> */}
      </div>
    </div>
  );
};

// フル絵文字ピッカーコンポーネント
type FullEmojiPickerProps = {
  onEmojiClick: (emoji: string) => void;
  width?: number | string;
  className?: string;
  innerRef?: React.RefObject<HTMLDivElement | null>;
};

const FullEmojiPicker = ({
  onEmojiClick,
  width = 350,
  className = "",
  innerRef,
}: FullEmojiPickerProps) => {
  return (
    <div
      ref={innerRef}
      data-emoji-picker
      className={`bg-card rounded-lg shadow-xl border border-border overflow-hidden ${className}`}
      onClick={(e) => e.stopPropagation()}
      style={typeof width === "number" ? { maxWidth: `${width}px` } : {}}
      aria-label="フル絵文字ピッカー"
    >
      <EmojiPicker
        onEmojiClick={(emojiData) => {
          onEmojiClick(emojiData.emoji);
        }}
        width={typeof width === "number" ? width : width}
        height={400}
        previewConfig={{ showPreview: false }}
        skinTonesDisabled
      />
    </div>
  );
};

// 絵文字ピッカーコンテナコンポーネント
type EmojiPickerContainerProps = {
  messageBubbleRef: React.RefObject<HTMLDivElement | null>;
  reactions: Reaction[];
  currentUserId: string | undefined;
  onEmojiClick: (emoji: string) => void;
  showEmojiPicker: boolean;
  showFullEmojiPicker: boolean;
  onShowFullPicker: () => void;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  fullEmojiPickerRef: React.RefObject<HTMLDivElement | null>;
  isMobile?: boolean;
};

const EmojiPickerContainer = ({
  messageBubbleRef,
  reactions,
  currentUserId,
  onEmojiClick,
  showEmojiPicker,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showFullEmojiPicker: _showFullEmojiPicker,
  onShowFullPicker,
  emojiPickerRef,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fullEmojiPickerRef: _fullEmojiPickerRef,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isMobile: _isMobile,
}: EmojiPickerContainerProps) => {
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

  // emojiPickerRefの要素のポジション情報を取得して位置を調整
  useEffect(() => {
    if (!showEmojiPicker) {
      requestAnimationFrame(() => {
        setPositionStyle({});
      });
      return;
    }

    // ピッカーが表示された後に位置を調整するため、複数のrequestAnimationFrameで遅延させる
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (emojiPickerRef.current && messageBubbleRef.current) {
          const messageBubbleRect = messageBubbleRef.current.getBoundingClientRect();
          const emojiPickerRect = emojiPickerRef.current.getBoundingClientRect();
          const isLeftSideOverflow = emojiPickerRect.left < messageBubbleRect.left;
          if (isLeftSideOverflow) {
            const offset = messageBubbleRect.left - emojiPickerRect.left;
            setPositionStyle({ right: `-${Math.abs(offset) + 10}px` });
          } else {
            setPositionStyle({});
          }
        }
      });
    });
  }, [showEmojiPicker, emojiPickerRef, messageBubbleRef]);

  if (!showEmojiPicker) return null;

  return (
    <div
      ref={emojiPickerRef}
      data-emoji-picker
      className={`absolute top-full right-0 z-[9999] bg-card border border-border rounded-lg shadow-lg p-1 mt-1 w-max`}
      aria-label="よく使う絵文字ピッカー"
      style={positionStyle}
    >
      <QuickEmojiPicker
        reactions={reactions}
        currentUserId={currentUserId}
        onEmojiClick={onEmojiClick}
        onShowFullPicker={onShowFullPicker}
      />
      {/* フル絵文字ピッカー */}
      {/* {showFullEmojiPicker && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <FullEmojiPicker
            onEmojiClick={onEmojiClick}
            width={350}
            innerRef={fullEmojiPickerRef}
          />
        </div>
      )} */}
    </div>
  );
};

export function MessageReactions({
  messageBubbleRef,
  messageId,
  groupId,
  reactions,
  onReactionChange,
  isOwnMessage,
  showAddButton = false,
  onAddButtonClick,
  onEmojiPickerOpenChange,
}: MessageReactionsProps) {
  const { data: session } = useSession();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);
  const [showReactionDetails, setShowReactionDetails] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640;
    }
    return false;
  });
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fullEmojiPickerRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 絵文字ピッカーの開閉状態を親コンポーネントに通知
  useEffect(() => {
    const isOpen = showEmojiPicker || showFullEmojiPicker;
    onEmojiPickerOpenChange?.(isOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEmojiPicker, showFullEmojiPicker]);

  // クリックアウトサイドで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        fullEmojiPickerRef.current &&
        !fullEmojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowFullEmojiPicker(false);
      }
      if (
        detailsRef.current &&
        !detailsRef.current.contains(event.target as Node)
      ) {
        setShowReactionDetails(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleReactionClick = async (emoji: string) => {
    // 自分のメッセージにはリアクションを付けられない
    if (isOwnMessage) {
      return;
    }
    const success = await toggleReaction(groupId, messageId, emoji);
    if (success) {
      // リアクション変更を即座に反映
      onReactionChange();
      setShowEmojiPicker(false);
      setShowFullEmojiPicker(false);
    }
  };

  // リアクションを表示用に整理（ユーザーが付けたものは先頭に）
  const sortedReactions = [...reactions].sort((a, b) => {
    const aHasUser = getCurrentUserReaction(a, session?.user?.id);
    const bHasUser = getCurrentUserReaction(b, session?.user?.id);
    if (aHasUser && !bHasUser) return -1;
    if (!aHasUser && bHasUser) return 1;
    return b.count - a.count;
  });

  // リアクション追加ボタン（ハート+プラスアイコン）
  const AddReactionButton = ({ className }: { className?: string }) => (
    <button
      onClick={() => {
        if (onAddButtonClick) {
          onAddButtonClick();
        } else {
          const newState = !showEmojiPicker;
          setShowEmojiPicker(newState);
        }
      }}
      className={`flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${isOwnMessage
        ? "bg-card/10 text-white border-white/20 hover:bg-card/20"
        : "bg-card text-zinc-400 border-border hover:bg-card-elevated hover:text-muted-foreground shadow-sm"
        } ${className || ""}`}
      aria-label="リアクションを追加"
    >
      <AddReactionIcon className="w-4 h-4" />
    </button>
  );

  // リアクションが存在する場合の表示
  if (reactions.length > 0) {
    return (
      <div ref={containerRef} className="flex flex-wrap items-center gap-1 relative">
        {/* 表示されるリアクション */}
        {sortedReactions.map((reaction) => {
          const hasUserReaction = getCurrentUserReaction(reaction, session?.user?.id);
          return (
            <div key={reaction.emoji} className="relative group">
              <button
                onClick={() => {
                  // 自分のメッセージの場合はクリックを無効化
                  if (!isOwnMessage) {
                    handleReactionClick(reaction.emoji);
                  }
                }}
                onMouseEnter={() => {
                  if (!isMobile) {
                    setShowReactionDetails(reaction.emoji);
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    setShowReactionDetails(null);
                  }
                }}
                onTouchStart={() => {
                  // スマホの場合はタップで詳細を表示
                  if (isMobile) {
                    setShowReactionDetails(
                      showReactionDetails === reaction.emoji ? null : reaction.emoji
                    );
                  }
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors cursor-pointer ${hasUserReaction
                  ? isOwnMessage
                    ? "bg-card/20 text-white border border-white/30"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                  : isOwnMessage
                    ? "bg-card/10 text-white border border-white/20"
                    : "bg-card-elevated text-muted-foreground border border-border hover:bg-card"
                  }`}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
              {/* ホバー時の詳細表示 */}
              {showReactionDetails === reaction.emoji && (
                <div
                  ref={detailsRef}
                  className={`absolute bottom-full ${isOwnMessage ? "right-0" : "left-0"} mb-1 z-50 bg-card border border-border rounded-lg shadow-lg p-3 w-max`}
                  onMouseEnter={() => setShowReactionDetails(reaction.emoji)}
                  onMouseLeave={() => setShowReactionDetails(null)}
                >
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    {reaction.emoji} {reaction.count}
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {reaction.users.map((user) => (
                      <div
                        key={user.id}
                        className="text-xs text-muted-foreground truncate"
                      >
                        {user.displayName || user.name || "名前未設定"}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* リアクション追加ボタン */}
        {showAddButton && <AddReactionButton />}

        {/* よく使う絵文字ピッカー（13種類 + 3点リーダー） */}
        <EmojiPickerContainer
          messageBubbleRef={messageBubbleRef}
          reactions={reactions}
          currentUserId={session?.user?.id}
          onEmojiClick={handleReactionClick}
          showEmojiPicker={showEmojiPicker}
          showFullEmojiPicker={showFullEmojiPicker}
          onShowFullPicker={() => {
            setShowEmojiPicker(false);
            setShowFullEmojiPicker(true);
          }}
          emojiPickerRef={emojiPickerRef}
          fullEmojiPickerRef={fullEmojiPickerRef}
          isMobile={isMobile}
        />
      </div>
    );
  }

  // リアクションが存在しない場合
  if (showAddButton) {
    return (
      <div className="relative">
        <AddReactionButton />
        <EmojiPickerContainer
          messageBubbleRef={messageBubbleRef}
          reactions={[]}
          currentUserId={session?.user?.id}
          onEmojiClick={handleReactionClick}
          showEmojiPicker={showEmojiPicker}
          showFullEmojiPicker={showFullEmojiPicker}
          onShowFullPicker={() => {
            setShowEmojiPicker(false);
            setShowFullEmojiPicker(true);
          }}
          emojiPickerRef={emojiPickerRef}
          fullEmojiPickerRef={fullEmojiPickerRef}
          isMobile={isMobile}
        />
      </div>
    );
  }

  return null;
}

// リアクション一覧表示コンポーネント（SP版用）
export function ReactionListModal({
  messageId,
  groupId,
  reactions,
  onReactionChange,
  isOpen,
  onClose,
  isOwnMessage,
}: {
  messageId: string;
  groupId: string;
  reactions: Reaction[];
  onReactionChange: () => void;
  isOpen: boolean;
  onClose: () => void;
  isOwnMessage: boolean;
}) {
  const { data: session } = useSession();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fullEmojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        fullEmojiPickerRef.current &&
        !fullEmojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowFullEmojiPicker(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleReactionClick = async (emoji: string) => {
    // 自分のメッセージにはリアクションを付けられない
    if (isOwnMessage) {
      return;
    }
    const success = await toggleReaction(groupId, messageId, emoji);
    if (success) {
      // リアクション変更を即座に反映
      onReactionChange();
      setShowEmojiPicker(false);
      setShowFullEmojiPicker(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">リアクション</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-muted-foreground transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* リアクション一覧 */}
          {reactions.length > 0 && (
            <div className="space-y-3 mb-4">
              {reactions.map((reaction) => {
                const hasUserReaction = getCurrentUserReaction(reaction, session?.user?.id);
                return (
                  <div
                    key={reaction.emoji}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-card-elevated transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleReactionClick(reaction.emoji)}
                        disabled={isOwnMessage}
                        className={`text-2xl ${isOwnMessage ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${hasUserReaction ? "opacity-100" : "opacity-60"}`}
                      >
                        {reaction.emoji}
                      </button>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {reaction.emoji} {reaction.count}人
                        </div>
                        <div className="text-xs text-muted mt-1">
                          {reaction.users
                            .slice(0, 3)
                            .map((u) => u.displayName || u.name || "名前未設定")
                            .join(", ")}
                          {reaction.users.length > 3 && ` 他${reaction.users.length - 3}人`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReactionClick(reaction.emoji)}
                      disabled={isOwnMessage}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${isOwnMessage
                        ? "cursor-not-allowed opacity-40 bg-card-elevated text-zinc-400"
                        : "cursor-pointer"
                        } ${hasUserReaction
                          ? "bg-blue-100 text-blue-700"
                          : "bg-card-elevated text-muted-foreground hover:bg-card"
                        }`}
                    >
                      {hasUserReaction ? "削除" : "追加"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 絵文字ピッカー */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">絵文字を追加</h4>
              {showEmojiPicker && (
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-xs text-zinc-400 hover:text-muted-foreground"
                >
                  閉じる
                </button>
              )}
            </div>
            {showEmojiPicker ? (
              <div className="space-y-3">
                <div ref={emojiPickerRef} className="p-2 bg-card-elevated rounded-lg">
                  <QuickEmojiPicker
                    reactions={reactions}
                    currentUserId={session?.user?.id}
                    onEmojiClick={handleReactionClick}
                    onShowFullPicker={() => {
                      setShowEmojiPicker(false);
                      setShowFullEmojiPicker(true);
                    }}
                    gridClassName="grid grid-cols-7 gap-2"
                    buttonClassName="text-xl hover:bg-card rounded p-2 transition-colors flex items-center justify-center"
                    activeButtonClassName="bg-blue-100"
                    ellipsisButtonClassName="text-lg hover:bg-card rounded p-2 transition-colors flex items-center justify-center text-muted"
                  />
                </div>
                {/* フル絵文字ピッカー */}
                {showFullEmojiPicker && (
                  <div className="relative">
                    <FullEmojiPicker
                      onEmojiClick={handleReactionClick}
                      width="100%"
                      innerRef={fullEmojiPickerRef}
                    />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowEmojiPicker(true)}
                disabled={isOwnMessage}
                className={`w-full py-3 px-4 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${isOwnMessage
                  ? "cursor-not-allowed opacity-40 border-border text-zinc-400"
                  : "cursor-pointer border-border text-muted-foreground hover:border-zinc-400 hover:bg-card-elevated"
                  }`}
              >
                <AddReactionIcon className="w-5 h-5" />
                <span className="text-sm font-medium">絵文字を選択</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

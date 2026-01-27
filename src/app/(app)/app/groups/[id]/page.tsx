"use client";

import { useState, useEffect, use, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ConfirmModal from "@/components/confirm-modal";
import { TransferOwnershipModal } from "@/components/transfer-ownership-modal";
import { Tabs, Tab } from "@/components/tabs";
import { LoadingSpinner } from "@/components/loading-spinner";
import { GroupJoinWarningModal } from "@/components/group-join-warning-modal";
import { GroupShareModal } from "@/components/group-share-modal";
import { useSnackbar } from "@/contexts/snackbar-context";
import { OwnerBadge } from "../_components/owner-badge";
import { GroupContents } from "../_components/group-contents";
import { GroupMembers } from "../_components/group-members";
import { GroupMessage } from "../_components/group-message";
import { GroupSettings } from "../_components/group-settings";

type GroupDetail = {
  id: string;
  name: string;
  theme: string | null;
  groupCode: string;
  maxMembers: number | null;
  memberCount: number;
  isLeader: boolean;
  ownerNote: string | null;
  groupDescription: string | null;
  event: {
    id: string;
    name: string;
    event_date: string;
  };
  leader: {
    id: string;
    name: string | null;
    displayName?: string | null;
    email: string;
  };
  members: Array<{
    id: string;
    name: string | null;
    displayName?: string | null;
    email: string;
    status: string;
  }>;
  createdAt: string;
};

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

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { id } = use(params);
  const { showSnackbar } = useSnackbar();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "members" | "messages" | "settings">("info");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDisbandModal, setShowDisbandModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [openEmojiPickerMessageId, setOpenEmojiPickerMessageId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string>("");
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640;
    }
    return false;
  });
  const [isInitialMessagesLoad, setIsInitialMessagesLoad] = useState(true);
  const scrollPositionRef = useRef<number | null>(null);

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch group");
      }
      const data = await res.json();
      setGroup(data);
    } catch (error) {
      console.error("Failed to fetch group:", error);
      showSnackbar(`団体の取得に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      setLoading(false);
    }
  }, [id, showSnackbar]);

  // 画像の読み込み完了を待つ関数
  const waitForImagesToLoad = useCallback((container: HTMLElement): Promise<void> => {
    return new Promise((resolve) => {
      const images = container.querySelectorAll('img');
      if (images.length === 0) {
        resolve();
        return;
      }

      let loadedCount = 0;
      const totalImages = images.length;

      const checkComplete = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve();
        }
      };

      images.forEach((img) => {
        if (img.complete) {
          checkComplete();
        } else {
          img.addEventListener('load', checkComplete, { once: true });
          img.addEventListener('error', checkComplete, { once: true });
        }
      });

      // タイムアウト（5秒）を設定して、画像が読み込まれない場合でも続行
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  }, []);

  const fetchMessages = useCallback(async (isInitialLoad = false, forceUpdate = false) => {
    if (isInitialLoad) {
      setMessagesLoading(true);
    }
    try {
      const res = await fetch(`/api/groups/${id}/messages`);
      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await res.json();

      // 初回読み込み時はそのまま更新（スクロールはuseEffectで処理）
      if (isInitialLoad) {
        setMessages(data);
        setMessagesLoading(false);
        return;
      }

      // 強制更新時（リアクション追加など）は即座に更新
      if (forceUpdate) {
        setMessages(data);
        return;
      }

      // ポーリング時は新規メッセージがある場合のみ更新
      setMessages((currentMessages) => {
        if (currentMessages.length === 0) {
          return data;
        }

        const currentMessageIds = new Set(currentMessages.map(m => m.id));
        const newMessages = data.filter((msg: GroupMessage) => !currentMessageIds.has(msg.id));

        if (newMessages.length === 0) {
          // 新規メッセージがない場合は更新しない
          return currentMessages;
        }

        // スクロール位置を保存
        const messagesContainer = document.querySelector('[data-messages-container]');
        if (!messagesContainer) {
          return data;
        }

        const wasAtBottom = Math.abs(
          messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight
        ) < 50;
        const previousScrollTop = messagesContainer.scrollTop;
        const previousScrollHeight = messagesContainer.scrollHeight;

        // 新規メッセージを追加
        const updatedMessages = data;

        // スクロール位置を復元（最下部にいた場合は最下部に移動）
        requestAnimationFrame(() => {
          const container = document.querySelector('[data-messages-container]');
          if (!container) return;

          if (wasAtBottom) {
            // 最下部にいた場合は新しいメッセージの最下部にスクロール
            container.scrollTop = container.scrollHeight;
          } else {
            // それ以外の場合は元の位置を維持（新しいメッセージ分の高さを考慮）
            const heightDiff = container.scrollHeight - previousScrollHeight;
            container.scrollTop = previousScrollTop + heightDiff;
          }
        });

        return updatedMessages;
      });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      if (isInitialLoad) {
        showSnackbar("メッセージの取得に失敗しました", "error");
        setMessagesLoading(false);
      }
    }
  }, [id, showSnackbar]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // ログインしているかどうか、およびメンバーかどうかを判定
  const isLoggedIn = !!session;
  const isMember = useMemo(() => {
    if (!group || !session?.user?.id) {
      return false;
    }
    return group.members.some(m => m.id === session.user?.id);
  }, [group, session?.user?.id]);

  // ログインしていない場合、「info」タブに切り替える
  useEffect(() => {
    if (!session) {
      setActiveTab("info");
    }
  }, [session]);

  // 未読メッセージの状態を取得（メッセージタブが開いていない場合のみ、ログインしている場合のみ）
  useEffect(() => {
    // ログインしていない場合は未読状態を取得しない
    if (!session) {
      return;
    }

    // メッセージタブが開いている場合は、メッセージ取得時に既読処理されるので監視不要
    if (activeTab === "messages") {
      return;
    }

    const fetchUnreadStatus = async () => {
      try {
        const res = await fetch("/api/groups/unread-count");
        if (!res.ok) return;
        const data = await res.json();
        // 現在の団体に未読メッセージがあるかチェック
        setHasUnreadMessages(data[id] === true);
      } catch (error) {
        console.error("Failed to fetch unread status:", error);
      }
    };

    if (id) {
      fetchUnreadStatus();
      // 定期的に未読状態をチェック（10秒ごと）
      const interval = setInterval(fetchUnreadStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [id, activeTab, session]);

  // メッセージタブから他のタブに切り替えるときにスクロール位置を保存
  useEffect(() => {
    if (activeTab !== "messages") {
      const messagesContainer = document.querySelector('[data-messages-container]');
      if (messagesContainer) {
        scrollPositionRef.current = messagesContainer.scrollTop;
      }
    }
  }, [activeTab]);

  // メッセージタブが開いているときはリアルタイムでメッセージを監視（ログインしている場合のみ）
  useEffect(() => {
    if (activeTab === "messages" && group && session) {
      // 初回取得（メッセージが既に存在する場合は再読み込みしない）
      if (isInitialMessagesLoad || messages.length === 0) {
        fetchMessages(true);
        setIsInitialMessagesLoad(false);
      }
      // メッセージが既に存在する場合は、再読み込みをスキップ（スクロール位置を保持するため）

      // 2秒ごとにメッセージをチェック（新規メッセージがある場合のみ更新）
      const messageInterval = setInterval(() => {
        fetchMessages(false);
      }, 2000);

      return () => clearInterval(messageInterval);
    }
  }, [activeTab, group, session, fetchMessages, isInitialMessagesLoad, messages.length]);

  // メッセージタブが開かれたとき、またはメッセージが読み込まれたときにスクロール位置を復元
  useEffect(() => {
    if (activeTab === "messages" && messages.length > 0 && !messagesLoading) {
      const messagesContainer = document.querySelector('[data-messages-container]') as HTMLElement;
      if (!messagesContainer) return;

      // DOM更新を待ってから画像の読み込みを待つ
      setTimeout(async () => {
        // 画像の読み込みが完了するまで待つ
        await waitForImagesToLoad(messagesContainer);

        if (scrollPositionRef.current !== null && scrollPositionRef.current !== 0) {
          // 保存されたスクロール位置を復元（0以外の場合のみ）
          messagesContainer.scrollTop = scrollPositionRef.current;
          scrollPositionRef.current = null; // 復元後はクリア
        } else if (scrollPositionRef.current === null && messages.length > 0) {
          // スクロール位置が保存されていない場合（初回読み込み時）は最下部にスクロール
          // ただし、メッセージが既に存在する場合は何もしない（ユーザーが既にスクロールしている可能性があるため）
          const wasAtBottom = Math.abs(
            messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight
          ) < 50;
          if (wasAtBottom || messagesContainer.scrollTop === 0) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }
      }, 100);
    }
  }, [activeTab, messages.length, messagesLoading, waitForImagesToLoad]);

  // メッセージを表示したときに既読状態を更新
  useEffect(() => {
    if (activeTab === "messages" && messages.length > 0) {
      // 最新メッセージを既読にする
      const latestMessage = messages[messages.length - 1];
      if (latestMessage) {
        fetch(`/api/groups/${id}/messages/${latestMessage.id}/read`, {
          method: "POST",
        })
          .then(() => {
            // 既読にしたら未読バッジを消す
            setHasUnreadMessages(false);
          })
          .catch((error) => {
            console.error("Failed to mark message as read:", error);
          });
      }
    }
  }, [activeTab, messages, id]);

  const handleSendMessage = async (imageFile: File | null) => {
    const textContent = messageContent.trim();

    // テキストも画像もない場合はエラー
    if (!textContent && !imageFile) {
      showSnackbar("メッセージを入力するか、画像を選択してください", "error");
      return;
    }

    // テキストがある場合、全角文字換算で1000文字を超える場合はエラー
    if (textContent) {
      const charCount = Array.from(textContent).length;
      if (charCount > 1000) {
        showSnackbar("メッセージは全角1000文字以内で入力してください", "error");
        return;
      }
    }

    setSending(true);
    try {
      // 画像をアップロード（画像がある場合）
      let imageUrl: string | null = null;
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);

        const uploadResponse = await fetch(`/api/upload/image?groupId=${id}`, {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: "Unknown error" }));
          const errorMessage = errorData.error || `画像のアップロードに失敗しました (HTTP ${uploadResponse.status})`;
          throw new Error(errorMessage);
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      // テキストメッセージを送信（テキストがある場合）
      if (textContent) {
        const textRes = await fetch(`/api/groups/${id}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: textContent,
            isAnnouncement: isAnnouncement,
          }),
        });

        if (!textRes.ok) {
          const errorData = await textRes.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        const newTextMessage = await textRes.json();
        // 新しいメッセージを追加（配列の最後に追加）
        setMessages((prev) => [...prev, newTextMessage]);
      }

      // 画像メッセージを送信（画像がある場合）
      if (imageUrl) {
        const imageTag = `<img src="${imageUrl}" alt="アップロードされた画像" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />`;

        const imageRes = await fetch(`/api/groups/${id}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: imageTag,
            isAnnouncement: isAnnouncement,
          }),
        });

        if (!imageRes.ok) {
          const errorData = await imageRes.json();
          throw new Error(errorData.error || "Failed to send image message");
        }

        const newImageMessage = await imageRes.json();
        // 新しいメッセージを追加（配列の最後に追加）
        setMessages((prev) => [...prev, newImageMessage]);
      }

      // フォームをクリア
      setMessageContent("");
      setIsAnnouncement(false);

      // 自分が送信したメッセージなので未読バッジは消す
      setHasUnreadMessages(false);

      // スクロールを最下部に移動
      setTimeout(() => {
        const messagesContainer = document.querySelector('[data-messages-container]');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
      showSnackbar(`メッセージの送信に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };


  const handleDisband = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "団体の解散に失敗しました");
      }

      showSnackbar("団体を解散しました", "success");
      router.push("/app/groups");
    } catch (error) {
      console.error("Failed to disband group:", error);
      showSnackbar(
        `団体の解散に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setProcessing(false);
      setShowDisbandModal(false);
    }
  };

  const handleTransferOwnership = async (newLeaderId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/groups/${id}/transfer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newLeaderId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "権限の譲渡に失敗しました");
      }

      showSnackbar("オーナー権限を譲渡しました", "success");
      fetchGroup(); // 団体情報を再取得
    } catch (error) {
      console.error("Failed to transfer ownership:", error);
      showSnackbar(`権限の譲渡に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      setProcessing(false);
      setShowTransferModal(false);
    }
  };

  const handleLeave = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/groups/${id}/leave`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "団体からの脱退に失敗しました");
      }

      // 団体情報タブに戻る
      setActiveTab("info");
      showSnackbar("団体を抜けました", "success");
      window.location.reload();
    } catch (error) {
      console.error("Failed to leave group:", error);
      const errorMessage = error instanceof Error ? error.message : "団体からの脱退に失敗しました";
      showSnackbar(errorMessage, "error");
    } finally {
      setProcessing(false);
      setShowLeaveModal(false);
    }
  };

  /**
   * サーバー側のエラーメッセージをユーザーフレンドリーな日本語メッセージに変換する
   */
  const getErrorMessage = (error: string, statusCode?: number): string => {
    // ステータスコードに基づくエラー処理
    if (statusCode === 401) {
      return "ログインが必要です。再度ログインしてください。";
    }

    // エラーメッセージに基づく処理
    switch (error) {
      case "Unauthorized":
        return "ログインが必要です。再度ログインしてください。";
      case "groupCode is required":
        return "団体コードを入力してください。";
      case "Group not found":
        return "入力された団体コードが不正です。団体コードをお確かめください。";
      case "Already joined this group":
        return "この団体には既に加入しています。";
      case "Group is full":
        return "この団体は既に満員です。";
      case "Failed to join group":
        return "団体への加入処理中にエラーが発生しました。しばらく時間をおいて再度お試しください。";
      default:
        return "団体への加入に失敗しました。しばらく時間をおいて再度お試しください。";
    }
  };

  const handleJoin = useCallback(async (force = false) => {
    if (!group) return;

    // ログインしていない場合はログイン画面へ遷移
    if (!session) {
      const currentPath = `/app/groups/${id}?autoJoin=true`;
      router.push(`/app/auth?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    setJoining(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupCode: group.groupCode,
          force: force,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMessage = getErrorMessage(
          data.error || "団体への加入に失敗しました",
          res.status
        );
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // 警告メッセージがあり、確認が必要な場合
      if (data.warning && data.requiresConfirmation && !force) {
        setWarningMessage(data.warning);
        setShowWarningModal(true);
        setJoining(false);
        return;
      }

      // 加入成功時は団体情報を再取得してページを更新
      showSnackbar("団体に加入しました", "success");
      setShowShareModal(true);
    } catch (error) {
      let errorMessage = "団体への加入に失敗しました。しばらく時間をおいて再度お試しください。";

      if (error instanceof Error) {
        // エラーメッセージが既に変換済みの場合はそのまま使用
        // ネットワークエラーの場合は別のメッセージを表示
        if (error.message.includes("fetch") || error.message.includes("network")) {
          errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認して再度お試しください。";
        } else {
          errorMessage = error.message;
        }
      }

      showSnackbar(errorMessage, "error");
    } finally {
      setJoining(false);
    }
  }, [group, session, id, router, showSnackbar]);

  const handleConfirmJoin = () => {
    setShowWarningModal(false);
    handleJoin(true);
  };

  // ログイン後に自動的に加入処理を実行（URLパラメータにautoJoin=trueがある場合）
  useEffect(() => {
    const autoJoin = searchParams.get("autoJoin") === "true";
    if (autoJoin && session && group && !isMember && !joining) {
      // URLパラメータを削除してから加入処理を実行
      const newUrl = window.location.pathname;
      router.replace(newUrl);
      handleJoin(false);
    }
  }, [session, group, isMember, joining, searchParams, router, handleJoin]);

  // URLパラメータにshowShare=trueがある場合、シェアモーダルを表示
  useEffect(() => {
    const showShare = searchParams.get("showShare") === "true";
    if (showShare && group && isMember) {
      // URLパラメータを削除
      const newUrl = window.location.pathname;
      router.replace(newUrl);
      // シェアモーダルを表示
      setShowShareModal(true);
    }
  }, [searchParams, group, isMember, router]);

  if (loading) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </section>
      </main>
    );
  } else if (!group) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-sm text-zinc-600">団体が見つかりません</p>
            <Link
              href="/app/groups"
              className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
            >
              ← 団体一覧に戻る
            </Link>
          </div>
        </section>
      </main>
    );
  } else {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8 min-h-[100vh]">
          <>
            <header className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Link
                    href="/app/groups"
                    className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
                  >
                    ← 団体一覧に戻る
                  </Link>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        {group.name}
                      </h1>
                      {group.isLeader && <OwnerBadge />}
                    </div>
                    {group.theme && (
                      <p className="mt-1 text-xs text-zinc-600 sm:text-sm">{group.theme}</p>
                    )}
                    <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                      {group.event.name} / {formatDate(group.event.event_date)}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* タブ */}
            <Tabs>
              <Tab
                isActive={activeTab === "info"}
                onClick={() => setActiveTab("info")}
              >
                団体情報
              </Tab>
              <Tab
                isActive={activeTab === "members"}
                onClick={() => setActiveTab("members")}
              >
                メンバー一覧
              </Tab>
              {isLoggedIn && isMember && (
                <Tab
                  isActive={activeTab === "messages"}
                  onClick={() => setActiveTab("messages")}
                  badge={hasUnreadMessages}
                >
                  団体メッセージ
                </Tab>
              )}
              {isLoggedIn && isMember && (
                <Tab
                  isActive={activeTab === "settings"}
                  onClick={() => setActiveTab("settings")}
                >
                  設定
                </Tab>
              )}
            </Tabs>

            {/* タブコンテンツ */}
            {activeTab === "info" ? (
              <GroupContents
                group={{
                  id: group.id,
                  groupCode: group.groupCode,
                  groupDescription: group.groupDescription,
                  ownerNote: group.ownerNote,
                  isLeader: group.isLeader,
                }}
                isMember={isMember}
                joining={joining}
                onJoin={handleJoin}
                onUpdate={fetchGroup}
              />
            ) : activeTab === "members" ? (
              <GroupMembers
                groupId={id}
                group={{
                  memberCount: group.memberCount,
                  maxMembers: group.maxMembers,
                  isLeader: group.isLeader,
                  leader: group.leader,
                  members: group.members,
                }}
                currentUserId={session?.user?.id}
                onUpdate={fetchGroup}
              />
            ) : activeTab === "messages" && isLoggedIn ? (
              <GroupMessage
                groupId={id}
                messages={messages}
                messagesLoading={messagesLoading}
                currentUserId={session?.user?.id}
                hoveredMessageId={hoveredMessageId}
                setHoveredMessageId={setHoveredMessageId}
                openEmojiPickerMessageId={openEmojiPickerMessageId}
                setOpenEmojiPickerMessageId={setOpenEmojiPickerMessageId}
                onReactionChange={() => fetchMessages(false, true)}
                isLeader={group.isLeader}
                isAnnouncement={isAnnouncement}
                setIsAnnouncement={setIsAnnouncement}
                messageContent={messageContent}
                setMessageContent={setMessageContent}
                sending={sending}
                onSendMessage={handleSendMessage}
                isMobile={isMobile}
              />
            ) : activeTab === "settings" && isLoggedIn ? (
              <GroupSettings
                isLeader={group.isLeader}
                isMember={isMember}
                processing={processing}
                onDisbandClick={() => setShowDisbandModal(true)}
                onTransferClick={() => setShowTransferModal(true)}
                onLeaveClick={() => setShowLeaveModal(true)}
              />
            ) : null}

            {/* モーダル */}
            <ConfirmModal
              isOpen={showDisbandModal}
              onClose={() => setShowDisbandModal(false)}
              onConfirm={handleDisband}
              title="団体を解散しますか？"
              message="本当に団体を解散しますか？解散すると二度と復元できません。"
              confirmLabel="解散する"
              cancelLabel="キャンセル"
            />

            <TransferOwnershipModal
              isOpen={showTransferModal}
              onClose={() => setShowTransferModal(false)}
              onConfirm={handleTransferOwnership}
              members={group.members}
              currentUserId={session?.user?.id || ""}
            />

            <ConfirmModal
              isOpen={showLeaveModal}
              onClose={() => setShowLeaveModal(false)}
              onConfirm={handleLeave}
              title="団体を抜けますか？"
              message="本当にこの団体を抜けますか？"
              confirmLabel="抜ける"
              cancelLabel="キャンセル"
              buttonVariant="error"
            />

            <GroupJoinWarningModal
              isOpen={showWarningModal}
              onClose={() => {
                setShowWarningModal(false);
              }}
              onConfirm={handleConfirmJoin}
              warningMessage={warningMessage}
            />

            <GroupShareModal
              isOpen={showShareModal}
              onClose={() => {
                setShowShareModal(false);
                window.location.reload();
              }}
              groupName={group.name}
              groupUrl={
                typeof window !== "undefined"
                  ? `${window.location.origin}/app/groups/${group.id}`
                  : ""
              }
            />

          </>
        </section>
      </main>
    );
  }
}

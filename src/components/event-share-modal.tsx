"use client";

import { useState, useEffect } from "react";
import { ModalBase } from "./modal-base";
import { Button } from "./button";

interface EventShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventTitle: string;
    eventUrl: string;
}

export function EventShareModal({
    isOpen,
    onClose,
    eventTitle,
    eventUrl,
}: EventShareModalProps) {
    const [hasWebShare, setHasWebShare] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "share" in navigator) {
            setHasWebShare(true);
        }
    }, []);

  const shareText = `${eventTitle}\n${eventUrl}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(eventUrl);

  // X（Twitter）でシェア
  const handleShareX = () => {
    const tweetText = `イベントが追加されました！\n${eventTitle}\n${eventUrl}`;
    const encodedTweetText = encodeURIComponent(tweetText);
    const url = `https://twitter.com/intent/tweet?text=${encodedTweetText}`;
    window.open(url, "_blank", "width=550,height=420");
  };

    // LINEでシェア
    const handleShareLine = () => {
        const url = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;
        window.open(url, "_blank", "width=550,height=420");
    };

    // Facebookでシェア
    const handleShareFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        window.open(url, "_blank", "width=550,height=420");
    };

    // Instagramでシェア（URLをコピー）
    const handleShareInstagram = async () => {
        // InstagramはWebから直接シェアできないため、URLとテキストをコピー
        try {
            await navigator.clipboard.writeText(shareText);
            alert("イベント情報をクリップボードにコピーしました。Instagramに貼り付けてシェアしてください。");
        } catch (error) {
            console.error("Failed to copy text:", error);
            alert("コピーに失敗しました");
        }
    };

    // コピー機能
    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(eventUrl);
            alert("URLをクリップボードにコピーしました");
        } catch (error) {
            console.error("Failed to copy URL:", error);
            alert("URLのコピーに失敗しました");
        }
    };

    // Web Share API（モバイル対応）
    const handleWebShare = async () => {
        if (typeof window !== "undefined" && "share" in navigator) {
            try {
                await navigator.share({
                    title: eventTitle,
                    text: eventTitle,
                    url: eventUrl,
                });
            } catch (error) {
                // ユーザーがキャンセルした場合などはエラーを無視
                if (error instanceof Error && error.name !== "AbortError") {
                    console.error("Failed to share:", error);
                }
            }
        } else {
            // Web Share APIが使えない場合はURLをコピー
            handleCopyUrl();
        }
    };

    return (
        <ModalBase
            isOpen={isOpen}
            onClose={onClose}
            title="このイベントをシェア"
            footer={
                <Button
                    variant="primary"
                    size="md"
                    rounded="md"
                    onClick={onClose}
                >
                    閉じる
                </Button>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-zinc-600">
                    イベントをSNSでシェアして、より多くの参加者に知ってもらいましょう。
                </p>

                <div className="space-y-2">
                    <div className="text-xs font-medium text-zinc-700 mb-2">
                        イベントタイトル
                    </div>
                    <div className="text-sm text-zinc-900 bg-zinc-50 rounded-md p-3">
                        {eventTitle}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-medium text-zinc-700 mb-2">
                        イベントURL
                    </div>
                    <div className="text-sm text-zinc-600 bg-zinc-50 rounded-md p-3 break-all">
                        {eventUrl}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    {/* X（Twitter） */}
                    <Button
                        variant="secondary"
                        size="md"
                        rounded="md"
                        onClick={handleShareX}
                        className="flex items-center justify-center gap-2"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span>X</span>
                    </Button>

                    {/* Instagram */}
                    <Button
                        variant="secondary"
                        size="md"
                        rounded="md"
                        onClick={handleShareInstagram}
                        className="flex items-center justify-center gap-2"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                        <span>Instagram</span>
                    </Button>

                    {/* LINE */}
                    <Button
                        variant="secondary"
                        size="md"
                        rounded="md"
                        onClick={handleShareLine}
                        className="flex items-center justify-center gap-2"
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.63.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.086.766.062 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
                                fill="#00C300"
                            />
                        </svg>
                        <span>LINE</span>
                    </Button>

                    {/* Web Share API / コピー */}
                    <Button
                        variant="secondary"
                        size="md"
                        rounded="md"
                        onClick={handleWebShare}
                        className="flex items-center justify-center gap-2"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                        </svg>
                        <span>{hasWebShare ? "シェア" : "コピー"}</span>
                    </Button>
                </div>
            </div>
        </ModalBase>
    );
}


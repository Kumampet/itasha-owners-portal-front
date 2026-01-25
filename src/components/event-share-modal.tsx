"use client";

import { ShareModal, ShareModalConfig } from "./common-share-modal";

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
    const config: ShareModalConfig = {
        title: "このイベントをシェア",
        description: "イベントをSNSでシェアして、より多くの参加者に知ってもらいましょう。",
        itemNameLabel: "イベントタイトル",
        itemUrlLabel: "イベントURL",
        itemName: eventTitle,
        itemUrl: eventUrl,
        tweetPrefix: "イベントが追加されました！",
        instagramCopyMessage: "イベント情報をクリップボードにコピーしました。Instagramに貼り付けてシェアしてください。",
    };

    return (
        <ShareModal
            isOpen={isOpen}
            onClose={onClose}
            config={config}
        />
    );
}


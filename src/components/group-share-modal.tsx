"use client";

import { ShareModal, ShareModalConfig } from "./common-share-modal";

interface GroupShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupName: string;
    groupUrl: string;
}

export function GroupShareModal({
    isOpen,
    onClose,
    groupName,
    groupUrl,
}: GroupShareModalProps) {
    const config: ShareModalConfig = {
        title: "この団体をシェア",
        description: "団体への加入をSNSでシェアして、他のメンバーにも知ってもらいましょう。",
        itemNameLabel: "団体名",
        itemUrlLabel: "団体URL",
        itemName: groupName,
        itemUrl: groupUrl,
        tweetPrefix: "団体に加入しました！",
        instagramCopyMessage: "団体情報をクリップボードにコピーしました。Instagramに貼り付けてシェアしてください。",
    };

    return (
        <ShareModal
            isOpen={isOpen}
            onClose={onClose}
            config={config}
        />
    );
}

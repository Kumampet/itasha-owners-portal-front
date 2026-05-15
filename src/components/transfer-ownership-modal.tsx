"use client";

import { useState } from "react";
import { ModalBase } from "./modal-base";
import { Button } from "./button";

type TransferOwnershipModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newLeaderId: string) => void;
    members: Array<{
        id: string;
        name: string | null;
        displayName?: string | null;
    }>;
    currentUserId: string;
};

export function TransferOwnershipModal({
    isOpen,
    onClose,
    onConfirm,
    members,
    currentUserId,
}: TransferOwnershipModalProps) {
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");

    // 自分以外のメンバーをフィルター
    const otherMembers = members.filter((m) => m.id !== currentUserId);

    const handleConfirm = () => {
        if (!selectedMemberId) {
            alert("譲渡先のメンバーを選択してください");
            return;
        }
        onConfirm(selectedMemberId);
        setSelectedMemberId("");
    };

    return (
        <ModalBase
            isOpen={isOpen}
            onClose={onClose}
            title="オーナー権限を譲渡"
            footer={
                <>
                    <Button
                        variant="secondary"
                        size="md"
                        rounded="md"
                        onClick={onClose}
                    >
                        キャンセル
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        rounded="md"
                        onClick={handleConfirm}
                        disabled={!selectedMemberId}
                    >
                        譲渡する
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm text-zinc-600">
                        本当に団体オーナー権限を譲渡しますか？
                    </p>
                    <p className="text-sm text-zinc-600">
                        権限の譲渡はメンバー間で合意の上、実施してください。譲渡に関するトラブル等は、サービス運用側では一切の責任を負いかねます。
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                        譲渡先のメンバーを選択
                    </label>
                    <select
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    >
                        <option value="">選択してください</option>
                        {otherMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.displayName || member.name || "名前未設定"}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </ModalBase>
    );
}


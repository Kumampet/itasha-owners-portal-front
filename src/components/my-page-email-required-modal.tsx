"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/button";

type MyPageEmailRequiredModalProps = {
    open: boolean;
};

export function MyPageEmailRequiredModal({ open }: MyPageEmailRequiredModalProps) {
    const router = useRouter();

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
                <h2 className="mb-2 text-lg font-semibold text-foreground">
                    メールアドレスの登録が必要です
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                    メールアドレスの登録が必要です。プロフィール編集画面でメールアドレスを設定してください。
                </p>
                <div className="flex gap-3">
                    <Button
                        onClick={() => router.push("/app/profile/edit")}
                        variant="primary"
                        size="md"
                        rounded="md"
                        fullWidth
                    >
                        プロフィール編集へ
                    </Button>
                </div>
            </div>
        </div>
    );
}

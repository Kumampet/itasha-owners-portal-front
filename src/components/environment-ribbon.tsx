"use client";

import { useState, useEffect } from "react";

/**
 * 環境を判定する関数
 * 本番環境以外（staging, local）の場合に環境名を返す
 * クライアント側でのみ実行される
 */
function getEnvironment(): string | null {
    // NEXT_PUBLIC_ENVIRONMENT環境変数が設定されている場合
    const envVar = process.env.NEXT_PUBLIC_ENVIRONMENT;
    if (envVar && envVar !== "production" && envVar !== "prod") {
        return envVar.toLowerCase();
    }

    // URLから判定
    const hostname = window.location.hostname;

    // localhostまたは127.0.0.1の場合はlocal
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
        return "local";
    }

    // stagingを含む場合はstaging
    if (hostname.includes("staging") || hostname.includes("stg")) {
        return "staging";
    }

    // その他の場合は本番環境とみなす（nullを返す）
    return null;
}

/**
 * 環境リボンコンポーネント
 * 本番環境以外の場合に画面左下端に斜めのリボンを表示
 */
export function EnvironmentRibbon() {
    const [environment, setEnvironment] = useState<string | null>(null);

    // クライアント側でのみ環境を判定
    useEffect(() => {
        // クライアント側でのみ実行されるため、useEffect内でsetStateを呼び出す
        // これはハイドレーションエラーを防ぐために必要な処理
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEnvironment(getEnvironment());
    }, []);

    // サーバー側レンダリング時は何も表示しない（ハイドレーションエラーを防ぐ）
    if (environment === null) {
        return null;
    }

    // 本番環境の場合は何も表示しない
    if (!environment) {
        return null;
    }

    // 環境名の表示テキストを決定
    const displayText = environment === "local" ? "LOCAL" : "STAGING";

    // 環境に応じた色を決定
    const colorClass =
        environment === "local"
            ? "bg-blue-600 text-white"
            : "bg-orange-600 text-white";

    return (
        <div
            className={`fixed z-[9999] ${colorClass} px-12 py-1.5 text-[10px] sm:text-xs font-bold shadow-lg pointer-events-none select-none`}
            style={{
                transform: "rotate(-45deg)",
                letterSpacing: "0.05em",
                bottom: "20px",
                right: "-30px",
            }}
            aria-label={`環境: ${displayText}`}
        >
            {displayText}
        </div>
    );
}


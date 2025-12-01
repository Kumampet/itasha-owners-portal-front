"use client";

import Link from "next/link";
import type { ReactNode, MouseEvent } from "react";
import { Card } from "@/components/card";

interface LinkCardProps {
    href: string;
    children: ReactNode;
    className?: string;
    cardClassName?: string;
}

export function LinkCard({
    href,
    children,
    className = "",
    cardClassName = "",
}: LinkCardProps) {
    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        // クリックされた要素がボタン、別のリンク、またはその子要素の場合はナビゲーションを防ぐ
        const target = e.target as HTMLElement;
        const currentTarget = e.currentTarget; // Link要素自体
        
        // ボタンのチェック
        const isButton = target.closest("button") !== null;
        
        // 別のリンク（親のLink要素以外）のチェック
        const linkElement = target.closest("a");
        const isLink = linkElement !== null && linkElement !== currentTarget;
        
        // data-no-link属性を持つ要素のチェック
        const isActionElement = target.closest("[data-no-link]") !== null;

        if (isButton || isLink || isActionElement) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // 通常のクリックはそのまま処理（Next.jsのLinkが処理）
    };

    return (
        <Link 
            href={href} 
            className={`block group transition ${className}`}
            onClick={handleClick}
        >
            <Card className={`transition group-hover:border-zinc-900 ${cardClassName}`}>
                {children}
            </Card>
        </Link>
    );
}


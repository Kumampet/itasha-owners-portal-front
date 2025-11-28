"use client";

import Link from "next/link";
import type { ReactNode } from "react";
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
    return (
        <Link href={href} className={`block group transition ${className}`}>
            <Card className={`transition group-hover:border-zinc-900 ${cardClassName}`}>
                {children}
            </Card>
        </Link>
    );
}


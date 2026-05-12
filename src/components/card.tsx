"use client";

import type { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: "default" | "muted";
}

export function Card({ children, className = "", variant = "default" }: CardProps) {
    const baseClasses =
        "rounded-2xl border border-border shadow-sm shadow-black/20 p-4 sm:p-5";
    const variantClasses = {
        default: "bg-card",
        muted: "bg-card-elevated",
    };

    const combinedClassName =
        `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

    return (
        <div className={combinedClassName}>
            {children}
        </div>
    );
}

interface CardTitleProps {
    children: ReactNode;
    className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
    return (
        <h2
            className={`text-sm font-semibold text-foreground sm:text-base ${className}`.trim()}
        >
            {children}
        </h2>
    );
}

interface CardContentProps {
    children: ReactNode;
    className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
    return (
        <div className={className || undefined}>
            {children}
        </div>
    );
}

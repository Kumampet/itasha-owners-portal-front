"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode, AnchorHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "emerald" | "success" | "danger";
type ButtonSize = "sm" | "md" | "lg";
type ButtonRounded = "full" | "md";

interface BaseButtonProps {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    rounded?: ButtonRounded;
    fullWidth?: boolean;
    className?: string;
}

interface ButtonAsButtonProps extends BaseButtonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
    as?: "button";
}

interface ButtonAsLinkProps extends BaseButtonProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href" | "children"> {
    as: "link";
    href: string;
    disabled?: boolean;
}

interface ButtonAsActionProps extends BaseButtonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
    as: "action";
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps | ButtonAsActionProps;

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "bg-accent-mint text-zinc-950 shadow-sm hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100",
    secondary:
        "border border-border bg-card-elevated text-foreground hover:bg-card disabled:opacity-40 disabled:hover:bg-card-elevated",
    emerald:
        "border-2 border-accent-mint/50 bg-accent-mint/10 text-accent-mint hover:bg-accent-mint/18 disabled:border-accent-mint/25 disabled:bg-accent-mint/5 disabled:text-muted",
    success: "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400 disabled:hover:bg-green-400",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 disabled:hover:bg-red-400",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
};

const roundedClasses: Record<ButtonRounded, string> = {
    full: "rounded-full",
    md: "rounded-md",
};

export function Button(props: ButtonProps) {
    const {
        children,
        variant = "primary",
        size = "md",
        rounded = "full",
        fullWidth = false,
        className = "",
        as,
        ...restProps
    } = props;

    const isAction = as === "action";
    const baseClasses = isAction
        ? "flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-mint focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        : "inline-flex items-center justify-center font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-mint focus-visible:ring-offset-2 focus-visible:ring-offset-background";
    const widthClass = fullWidth ? "w-full" : "";

    const combinedClassName = [
        baseClasses,
        isAction ? "" : variantClasses[variant],
        isAction ? "" : sizeClasses[size],
        isAction ? "" : roundedClasses[rounded],
        widthClass,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    if (as === "link") {
        const { href, disabled, ...linkProps } = restProps as ButtonAsLinkProps;
        const disabledClass = disabled ? "cursor-not-allowed opacity-50 pointer-events-none" : "";
        const finalClassName = `${combinedClassName} ${disabledClass}`.trim();

        if (disabled) {
            return (
                <span className={finalClassName}>
                    {children}
                </span>
            );
        }

        return (
            <Link href={href} className={combinedClassName} {...linkProps}>
                {children}
            </Link>
        );
    }

    if (as === "action") {
        const { disabled = false, ...actionProps } = restProps as ButtonAsActionProps;
        const disabledClass = disabled ? "cursor-not-allowed opacity-50" : "";
        const finalClassName = `${combinedClassName} ${disabledClass}`.trim();

        return (
            <button
                type="button"
                disabled={disabled}
                className={finalClassName}
                {...actionProps}
            >
                {children}
            </button>
        );
    }

    const { disabled = false, ...buttonProps } = restProps as ButtonAsButtonProps;
    const disabledClass = disabled ? "cursor-not-allowed opacity-50" : "";
    const finalClassName = `${combinedClassName} ${disabledClass}`.trim();

    return (
        <button
            type="button"
            disabled={disabled}
            className={finalClassName}
            {...buttonProps}
        >
            {children}
        </button>
    );
}


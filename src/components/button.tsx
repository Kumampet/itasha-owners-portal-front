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
    primary: "bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-400 disabled:hover:bg-zinc-400",
    secondary: "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-300",
    emerald: "border-2 border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:border-emerald-300 disabled:bg-emerald-50 disabled:text-emerald-300",
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
        ? "flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
        : "inline-flex items-center justify-center font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2";
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


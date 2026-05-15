"use client";

import type { ReactNode } from "react";

interface ModalBaseProps {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
    footer: ReactNode;
}

export function ModalBase({
    isOpen,
    onClose,
    title,
    children,
    footer,
}: ModalBaseProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div 
                className="rounded-lg bg-white p-6 shadow-lg max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="mb-4 text-lg font-semibold text-zinc-900">{title}</h2>
                <div className="mb-6">{children}</div>
                <div className="flex justify-end gap-2">{footer}</div>
            </div>
        </div>
    );
}


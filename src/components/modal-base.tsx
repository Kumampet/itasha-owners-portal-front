"use client";

interface ModalBaseProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="rounded-lg bg-white p-6 shadow-lg max-w-md w-full mx-4">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900">{title}</h2>
                <div className="mb-6">{children}</div>
                <div className="flex justify-end gap-2">{footer}</div>
            </div>
        </div>
    );
}


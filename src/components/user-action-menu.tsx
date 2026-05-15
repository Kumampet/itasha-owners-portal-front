"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/button";

type UserActionMenuProps = {
  onBanClick: () => void;
  onRoleChangeClick: () => void;
  onDisplayNameChangeClick: () => void;
  onDeleteClick: () => void;
  onRestoreClick: () => void;
  onPermanentDeleteClick: () => void;
  isBanned: boolean;
  isDeleted: boolean;
};

export function UserActionMenu({
  onBanClick,
  onRoleChangeClick,
  onDisplayNameChangeClick,
  onDeleteClick,
  onRestoreClick,
  onPermanentDeleteClick,
  isBanned,
  isDeleted,
}: UserActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外をクリックしたら閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="secondary"
        size="sm"
        rounded="full"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5"
        title="操作メニュー"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-zinc-200 bg-white shadow-lg">
          <div className="py-1">
            {isDeleted ? (
              <>
                <button
                  onClick={() => {
                    onRestoreClick();
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
                >
                  復帰する
                </button>
                <button
                  onClick={() => {
                    onPermanentDeleteClick();
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  完全削除
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onBanClick();
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  {isBanned ? "BAN解除" : "BANする"}
                </button>
                <button
                  onClick={() => {
                    onRoleChangeClick();
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  権限変更
                </button>
                <button
                  onClick={() => {
                    onDisplayNameChangeClick();
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  表示名変更
                </button>
                <button
                  onClick={() => {
                    onDeleteClick();
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  削除する
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


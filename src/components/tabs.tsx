"use client";

import type { ReactNode } from "react";

interface TabsProps {
  children: ReactNode;
  className?: string;
}

export function Tabs({ children, className = "" }: TabsProps) {
  return (
    <div className={`flex gap-2 border-b border-zinc-200 ${className}`}>
      {children}
    </div>
  );
}

interface TabProps {
  children: ReactNode;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  badge?: boolean;
}

export function Tab({ children, isActive, onClick, className = "", badge = false }: TabProps) {
  return (
    <div
      onClick={onClick}
      className={`relative whitespace-nowrap px-2 py-2 text-xs font-medium transition cursor-pointer sm:px-4 sm:text-sm ${isActive
          ? "border-b-2 border-zinc-900 text-zinc-900"
          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
        } ${className}`}
    >
      {children}
      {badge && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" title="新着メッセージあり"></span>
      )}
    </div>
  );
}


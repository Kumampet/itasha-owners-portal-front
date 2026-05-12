"use client";

import type { ReactNode } from "react";

interface TabsProps {
  children: ReactNode;
  className?: string;
}

export function Tabs({ children, className = "" }: TabsProps) {
  return (
    <div className={`flex gap-2 border-b border-border ${className}`}>
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
          ? "border-b-2 border-border-strong text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
        } ${className}`}
    >
      {children}
      {badge && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" title="新着メッセージあり"></span>
      )}
    </div>
  );
}


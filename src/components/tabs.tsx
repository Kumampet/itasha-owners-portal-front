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
}

export function Tab({ children, isActive, onClick, className = "" }: TabProps) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition cursor-pointer ${
        isActive
          ? "border-b-2 border-zinc-900 text-zinc-900"
          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
      } ${className}`}
    >
      {children}
    </div>
  );
}


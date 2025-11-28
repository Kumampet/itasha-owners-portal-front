"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AccordionContextType {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
  allowMultiple?: boolean;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("AccordionItem must be used within Accordion");
  }
  return context;
}

interface AccordionProps {
  children: ReactNode;
  className?: string;
  allowMultiple?: boolean;
  defaultOpen?: string[];
}

export function Accordion({
  children,
  className = "",
  allowMultiple = false,
  defaultOpen = [],
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(value);
      }
      return newSet;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, allowMultiple }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  value: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AccordionItem({
  value,
  title,
  children,
  className = "",
  contentClassName = "",
}: AccordionItemProps) {
  const { openItems, toggleItem } = useAccordionContext();
  const isOpen = openItems.has(value);

  return (
    <div className={`border-t border-zinc-200 pt-6 ${className}`}>
      <div
        onClick={() => toggleItem(value)}
        className="flex w-full cursor-pointer items-center justify-between text-left transition hover:bg-zinc-50"
      >
        <div className="flex-1">{title}</div>
        <svg
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && (
        <div className={`mt-4 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
}

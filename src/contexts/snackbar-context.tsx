"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type SnackbarSeverity = "success" | "error" | "warning" | "info";

export interface SnackbarMessage {
  id: string;
  message: string;
  severity: SnackbarSeverity;
  duration?: number; // ミリ秒、デフォルトは3000
}

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: SnackbarSeverity, duration?: number) => void;
  messages: SnackbarMessage[];
  removeMessage: (id: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<SnackbarMessage[]>([]);

  const showSnackbar = useCallback(
    (message: string, severity: SnackbarSeverity = "info", duration = 3000) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newMessage: SnackbarMessage = {
        id,
        message,
        severity,
        duration,
      };

      setMessages((prev) => [...prev, newMessage]);

      // 自動的に削除
      if (duration > 0) {
        setTimeout(() => {
          setMessages((prev) => prev.filter((msg) => msg.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, messages, removeMessage }}>
      {children}
    </SnackbarContext.Provider>
  );
}

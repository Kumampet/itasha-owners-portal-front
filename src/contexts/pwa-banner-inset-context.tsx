"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PwaBannerInsetContextValue = {
  /** 下部固定 PWA バナーぶんフッターに足すスクロール用余白（px） */
  footerInsetPx: number;
  setFooterInsetPx: (px: number) => void;
};

const PwaBannerInsetContext =
  createContext<PwaBannerInsetContextValue | null>(null);

export function PwaBannerInsetProvider({ children }: { children: ReactNode }) {
  const [footerInsetPx, setFooterInsetPxState] = useState(0);

  const setFooterInsetPx = useCallback((px: number) => {
    setFooterInsetPxState(
      Number.isFinite(px) && px > 0 ? Math.ceil(px) : 0,
    );
  }, []);

  const value = useMemo(
    () => ({ footerInsetPx, setFooterInsetPx }),
    [footerInsetPx, setFooterInsetPx],
  );

  return (
    <PwaBannerInsetContext.Provider value={value}>
      {children}
    </PwaBannerInsetContext.Provider>
  );
}

export function usePwaBannerInset() {
  const ctx = useContext(PwaBannerInsetContext);
  if (!ctx) {
    return {
      footerInsetPx: 0,
      setFooterInsetPx: () => {
        /* no-op when outside provider */
      },
    };
  }
  return ctx;
}

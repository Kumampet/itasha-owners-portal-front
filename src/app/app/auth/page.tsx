// アプリ側のログインページ

"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthFormCard } from "./auth-form-card";
import { AuthHeroPanel } from "./auth-hero-panel";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { SiteHeader } from "@/components/site-header";

/** PC 用。スマホは別画像予定のため、現状は同じアセットを仮利用。 */
const AUTH_PAGE_BG_SRC = "/images/auth_bg_pc.svg";

function AuthPageBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 isolate"
      aria-hidden
    >
      <div className="absolute inset-0 bg-background" />
      {/* CSS url() が巨大 SVG で描画されない環境があるため img で読み込む */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 全面背景 */}
      <img
        alt=""
        className="absolute inset-0 block h-full w-full object-cover object-center"
        decoding="async"
        fetchPriority="high"
        src={AUTH_PAGE_BG_SRC}
      />
    </div>
  );
}

function AuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app/mypage";
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const isFromInviteLink = callbackUrl.includes("/app/groups/join");

  const handleSignIn = async (provider: "google" | "twitter") => {
    setIsLoading(provider);
    try {
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        console.error("Sign in error:", result.error);
        setIsLoading(null);
      } else if (result?.ok && result?.url) {
        window.location.href = result.url;
      } else if (result?.ok) {
        window.location.href = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(null);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-hidden">
      <AuthPageBackground />

      <SiteHeader hideAuthUi />

      <main className="relative z-10 flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-14">
          <div className="order-1 flex items-center lg:order-1 lg:justify-end">
            <div className="w-full max-w-md lg:max-w-none">
              <AuthFormCard
                isFromInviteLink={isFromInviteLink}
                isLoading={isLoading}
                onGoogle={() => void handleSignIn("google")}
                onTwitter={() => void handleSignIn("twitter")}
              />
            </div>
          </div>

          <div className="order-2 flex min-h-0 lg:order-2 lg:items-stretch">
            <AuthHeroPanel />
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <PublicSiteFooter />
      </div>
    </div>
  );
}

function AuthPageFallback() {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-hidden">
      <AuthPageBackground />

      <header
        className="sticky top-0 z-50 shrink-0 border-b border-border bg-background/90"
        aria-hidden
      >
        <div className="mx-auto h-14 max-w-7xl animate-pulse px-4 sm:px-6">
          <div className="flex h-full items-center justify-between">
            <div className="h-8 w-28 rounded-md bg-card-elevated" />
            <div className="hidden flex-1 justify-center gap-6 px-8 lg:flex">
              <div className="h-4 w-16 rounded bg-card-elevated/80" />
              <div className="h-4 w-20 rounded bg-card-elevated/80" />
              <div className="h-4 w-24 rounded bg-card-elevated/80" />
            </div>
            <div className="flex h-10 w-10 shrink-0 rounded-lg border border-border bg-card lg:hidden" />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-14">
          <div className="flex justify-center lg:justify-end">
            <div className="h-[420px] w-full max-w-md animate-pulse rounded-2xl border border-border bg-card lg:max-w-none" />
          </div>
          <div className="hidden min-h-[320px] animate-pulse rounded-2xl border border-border bg-card-elevated lg:block" />
        </div>
      </main>

      <div className="relative z-10">
        <PublicSiteFooter />
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AuthForm />
    </Suspense>
  );
}

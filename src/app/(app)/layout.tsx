"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { DisplayNameModal } from "@/components/display-name-modal";
import { EmailRequiredBanner } from "@/components/email-required-banner";
import { SiteHeader } from "@/components/site-header";
import { PublicSiteFooter } from "@/components/public-site-footer";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [hasCheckedDisplayName, setHasCheckedDisplayName] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !document.head) {
      return;
    }

    let metaRobots = document.querySelector(
      'meta[name="robots"]',
    ) as HTMLMetaElement | null;

    if (pathname?.startsWith("/app")) {
      if (!metaRobots) {
        metaRobots = document.createElement("meta");
        metaRobots.setAttribute("name", "robots");
        try {
          document.head.appendChild(metaRobots);
        } catch (error) {
          console.debug("Meta tag append error (safe to ignore):", error);
          return;
        }
      }
      metaRobots.setAttribute("content", "noindex, nofollow");
    } else if (metaRobots) {
      metaRobots.setAttribute("content", "index, follow");
    }
  }, [pathname]);

  useEffect(() => {
    if (status === "loading" || hasCheckedDisplayName) return;
    if (pathname?.startsWith("/admin")) return;

    if (session?.user) {
      const laterCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("display_name_later="));

      if (laterCookie) {
        const cookieValue = laterCookie.split("=")[1];
        const expireDate = new Date(cookieValue);
        const now = new Date();

        if (now > expireDate) {
          document.cookie =
            "display_name_later=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          if (!session.user.displayName) {
            setShowDisplayNameModal(true);
            setHasCheckedDisplayName(true);
          }
        } else {
          setHasCheckedDisplayName(true);
        }
      } else {
        if (!session.user.displayName) {
          setShowDisplayNameModal(true);
          setHasCheckedDisplayName(true);
        } else {
          setHasCheckedDisplayName(true);
        }
      }
    } else {
      setHasCheckedDisplayName(true);
    }
  }, [session, status, pathname, hasCheckedDisplayName]);

  const handleSaveDisplayName = async (displayName: string) => {
    try {
      const res = await fetch("/api/user/display-name", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName }),
      });

      if (!res.ok) {
        throw new Error("Failed to save display name");
      }

      await fetch("/api/auth/session?update");
      setShowDisplayNameModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to save display name:", error);
      throw error;
    }
  };

  const handleLater = () => {
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 7);

    document.cookie = `display_name_later=${expireDate.toISOString()}; expires=${expireDate.toUTCString()}; path=/;`;
    setShowDisplayNameModal(false);
    setHasCheckedDisplayName(true);
  };

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <PublicSiteFooter />
      </div>
      <DisplayNameModal
        isOpen={showDisplayNameModal}
        onClose={() => {
          setShowDisplayNameModal(false);
          setHasCheckedDisplayName(true);
        }}
        onSave={handleSaveDisplayName}
        onLater={handleLater}
      />
      <EmailRequiredBanner />
    </>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

export const APP_PAGE_HEADER_BACK_NAV_CLASSNAME =
  "text-xs font-semibold uppercase tracking-wide text-accent-mint";

export type AppPageHeaderProps = {
  leading?: ReactNode;
  eyebrow?: string;
  title: string;
  size?: "lg" | "md";
  afterTitle?: ReactNode;
  children?: ReactNode;
};

export function AppPageHeaderBackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={APP_PAGE_HEADER_BACK_NAV_CLASSNAME}>
      {children}
    </Link>
  );
}

export function AppPageHeader({
  leading,
  eyebrow,
  title,
  size = "lg",
  afterTitle,
  children,
}: AppPageHeaderProps) {
  const titleClassName =
    size === "lg"
      ? "text-2xl font-semibold tracking-tight sm:text-3xl"
      : "text-xl font-semibold tracking-tight sm:text-2xl";

  const heading =
    afterTitle != null ? (
      <div className="flex flex-wrap items-center gap-2">
        <h1 className={titleClassName}>{title}</h1>
        {afterTitle}
      </div>
    ) : (
      <h1 className={titleClassName}>{title}</h1>
    );

  return (
    <header className="space-y-2">
      {leading}
      {eyebrow != null && eyebrow !== "" ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-mint">
          {eyebrow}
        </p>
      ) : null}
      <div>
        {heading}
        {children}
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";

export function AuthHeroPanel() {
  return (
    <div className="relative isolate flex min-h-[220px] w-full overflow-hidden rounded-2xl border border-border-strong bg-card-elevated shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] lg:min-h-0 lg:flex-1">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(135deg, transparent 38%, rgb(139 139 154 / 0.07) 38%, rgb(139 139 154 / 0.07) 40%, transparent 40%),
            linear-gradient(-135deg, transparent 38%, rgb(139 139 154 / 0.06) 38%, rgb(139 139 154 / 0.06) 40%, transparent 40%)
          `,
          backgroundSize: "56px 56px",
          backgroundPosition: "0 0, 28px 14px",
        }}
      />

      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-accent-mint/25 blur-[100px]" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-accent-rose/20 blur-[110px]" />
      <div className="pointer-events-none absolute right-12 top-12 h-32 w-32 rounded-full border border-accent-mint/25 bg-accent-mint/5 blur-sm" />

      <div className="relative flex w-full flex-col justify-between gap-8 p-7 sm:p-9 lg:p-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-rose">
            いたなび！
          </p>
          <h2 className="mt-3 text-balance text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-[1.65rem]">
            イベントの予定と併せの管理を、
            <span className="text-accent-mint">このひとつの場所</span>
            で。
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            締切や支払期限の見落としを減らし、団体での参加準備までスムーズに。ログインするとマイページと団体機能をご利用いただけます。
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-background/55 px-4 py-2 text-xs font-medium text-foreground backdrop-blur-sm transition hover:border-accent-mint/40 hover:bg-card hover:text-accent-mint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-mint"
        >
          <span aria-hidden className="h-px w-5 bg-gradient-to-r from-accent-mint/80 to-accent-rose/60" />
          サービス概要を見る
        </Link>
      </div>
    </div>
  );
}

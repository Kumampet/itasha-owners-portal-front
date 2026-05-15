import type { ReactNode } from "react";

/** {@link HomeTopEventColumns} のカラム見出しバーと同系 */
const SECTION_HEADING_BAR_CLASS =
  "mt-1 h-10 w-[2px] shrink-0 rounded-full bg-gradient-to-b from-accent-mint via-accent-mint/75 to-accent-rose/65 sm:mt-1.5 sm:h-[3rem] sm:w-[3px]";

const SECTION_HEADING_TEXT_CLASS =
  "text-xl font-semibold tracking-tight text-foreground sm:text-2xl sm:tracking-tight";

/**
 * ホームのイベントカラム見出しと同系の左グラデーションバーを付与した章見出し。
 */
export function SectionHeadingWithAccent({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 mb-4 flex items-start gap-3.5 sm:gap-4">
      <div className={SECTION_HEADING_BAR_CLASS} aria-hidden />
      <div className="min-w-0 flex-1 border-b border-border/80 pb-4 sm:border-0 sm:pb-0">
        <h2 className={SECTION_HEADING_TEXT_CLASS}>{children}</h2>
      </div>
    </div>
  );
}

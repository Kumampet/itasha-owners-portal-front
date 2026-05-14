import type { ReactNode } from "react";

/** {@link HomeTopEventColumns} のカラム見出しバーをラベル向けに縮小したもの */
const LABEL_BAR_CLASS =
  "mt-0.5 h-[1.125rem] w-[2px] shrink-0 rounded-full bg-gradient-to-b from-accent-mint via-accent-mint/75 to-accent-rose/65 sm:mt-1 sm:h-[1.375rem] sm:w-[2.5px]";

const LABEL_TEXT_CLASS =
  "block text-sm font-semibold tracking-tight text-foreground sm:text-[15px]";

const HINT_CLASS =
  "mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-[13px]";

/**
 * 各フォーム項目のラベル行。ホームのイベントカラム見出しと同系の左グラデーションバーを付与する。
 */
export function FormFieldLabelWithAccent(props: {
  htmlFor?: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  const { htmlFor, children, hint } = props;
  return (
    <div className="flex items-start gap-2.5 sm:gap-3">
      <div className={LABEL_BAR_CLASS} aria-hidden />
      <div className="min-w-0 flex-1 border-b border-border/70 pb-2 sm:border-0 sm:pb-0">
        <label htmlFor={htmlFor} className={LABEL_TEXT_CLASS}>
          {children}
        </label>
        {hint != null ? <div className={HINT_CLASS}>{hint}</div> : null}
      </div>
    </div>
  );
}

/** フォーム入力の共通クラス（カードなしレイアウト用） */
export const formFieldInputClassName =
  "mt-2 block w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm shadow-sm transition placeholder:text-muted-foreground/70 focus:border-accent-mint/45 focus:outline-none focus:ring-2 focus:ring-accent-mint/15";

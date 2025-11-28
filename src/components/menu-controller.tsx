"use client";

interface MenuControllerProps {
  onClick: () => void;
  variant?: "open" | "close";
  className?: string;
  ariaLabel?: string;
}

export function MenuController({
  onClick,
  variant = "open",
  className = "",
  ariaLabel,
}: MenuControllerProps) {
  const defaultAriaLabel = variant === "open" ? "メニューを開く" : "メニューを閉じる";
  const baseClasses =
    variant === "open"
      ? "flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
      : "flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} cursor-pointer ${className}`}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || defaultAriaLabel}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {variant === "open" ? (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </div>
  );
}


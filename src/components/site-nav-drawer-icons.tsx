import type { SiteNavDrawerIconKey } from "@/config/site-nav";

const iconShell =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full";
const svgClass = "h-5 w-5";

/** サイドドロワー／マイページのカードと同系の Heroicons 風 SVG */
export function SiteNavDrawerIcon({
  icon,
  active,
}: {
  icon: SiteNavDrawerIconKey;
  active: boolean;
}) {
  let palette: string;
  switch (icon) {
    case "events":
      palette = active
        ? "bg-accent-mint/25 text-accent-mint"
        : "bg-blue-500/15 text-blue-400";
      break;
    case "about":
      palette = active
        ? "bg-accent-mint/25 text-accent-mint"
        : "bg-violet-500/15 text-violet-400";
      break;
    case "event-submission":
      palette = active
        ? "bg-accent-mint/25 text-accent-mint"
        : "bg-pink-500/15 text-pink-400";
      break;
    case "contact":
      palette = active
        ? "bg-accent-mint/25 text-accent-mint"
        : "bg-emerald-500/15 text-emerald-400";
      break;
  }

  const paths = (
    <>
      {icon === "events" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      )}
      {icon === "about" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      )}
      {icon === "event-submission" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      )}
      {icon === "contact" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      )}
    </>
  );

  return (
    <span className={`${iconShell} ${palette}`} aria-hidden>
      <svg
        className={`${svgClass}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {paths}
      </svg>
    </span>
  );
}

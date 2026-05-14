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
  const palette =
    icon === "events"
      ? active
        ? "bg-accent-mint/25 text-accent-mint"
        : "bg-blue-500/15 text-blue-400"
      : icon === "about"
        ? active
          ? "bg-accent-mint/25 text-accent-mint"
          : "bg-violet-500/15 text-violet-400"
        : icon === "event-submission"
          ? active
            ? "bg-accent-mint/25 text-accent-mint"
            : "bg-pink-500/15 text-pink-400"
          : icon === "contact"
            ? active
              ? "bg-accent-mint/25 text-accent-mint"
              : "bg-emerald-500/15 text-emerald-400"
            : active
              ? "bg-accent-mint/25 text-accent-mint"
              : "bg-indigo-500/15 text-indigo-400";

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
      {icon === "organizer" && (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </>
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

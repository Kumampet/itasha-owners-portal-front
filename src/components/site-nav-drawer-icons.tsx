import type { ComponentType } from "react";
import type { SiteNavDrawerIconKey } from "@/config/site-nav";
import type { OutlineIcon24Props } from "@/components/icons";
import {
  IconCalendar,
  IconEnvelope,
  IconInformationCircle,
  IconPlus,
} from "@/components/icons";

const iconShell =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full";
const svgClass = "h-5 w-5";

const iconByKey: Record<
  SiteNavDrawerIconKey,
  ComponentType<OutlineIcon24Props>
> = {
  events: IconCalendar,
  about: IconInformationCircle,
  "event-submission": IconPlus,
  contact: IconEnvelope,
};

/** サイドドロワー／マイページのカードと同系の Heroicons 風 SVG（共通: `src/components/icons`） */
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

  const Icon = iconByKey[icon];

  return (
    <span className={`${iconShell} ${palette}`} aria-hidden>
      <Icon className={svgClass} />
    </span>
  );
}

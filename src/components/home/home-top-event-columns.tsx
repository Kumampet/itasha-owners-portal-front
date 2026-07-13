import Link from "next/link";
import Image from "next/image";
import { EventDayBadge } from "@/components/event-day-badge";

export type HomeEventBrief = {
  id: string;
  name: string;
  description: string;
  event_date: string;
  event_end_date: string | null;
  is_multi_day: boolean;
  image_url: string | null;
};

function formatEventPeriod(event: HomeEventBrief): string {
  const start = new Date(event.event_date);
  const startFmt = start.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
  if (event.is_multi_day && event.event_end_date) {
    const end = new Date(event.event_end_date);
    return `${startFmt} 〜 ${end.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      weekday: "short",
    })}`;
  }
  return startFmt;
}

function HomeEventRow({ event }: { event: HomeEventBrief }) {
  const period = formatEventPeriod(event);
  const hasImage =
    typeof event.image_url === "string" &&
    event.image_url.trim().length > 0;

  return (
    <li>
      <Link
        href={`/events/${event.id}`}
        className="group flex gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-accent-mint/40 hover:bg-accent-mint/[0.06] sm:gap-4 sm:p-4"
      >
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-card-elevated sm:h-[4.25rem] sm:w-28">
          {hasImage ? (
            <Image
              src={event.image_url as string}
              alt=""
              fill
              className="object-cover"
              sizes="112px"
              unoptimized={Boolean(event.image_url?.startsWith("http") || event.image_url?.startsWith("/api/"))}
            />
          ) : (
            <Image
              src="/images/main_logo_v2.svg"
              alt=""
              fill
              className="object-contain"
              sizes="112px"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold text-accent-mint sm:text-xs">
              {period}
            </p>
            {/* 開催まであと何日or開催中かを表示 */}
            <EventDayBadge eventDateISO={event.event_date} eventEndDateISO={event.event_end_date} />
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-accent-mint sm:text-base">
            {event.name}
          </h3>
          {event.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

function EventColumn(props: {
  title: string;
  subtitle?: string;
  events: HomeEventBrief[];
  emptyHint: string;
}) {
  const { title, subtitle, events, emptyHint } = props;
  return (
    <section className="flex flex-col gap-5 lg:gap-6">
      <header className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:gap-4">
          <div
            className="mt-1 h-10 w-[2px] shrink-0 rounded-full bg-gradient-to-b from-accent-mint via-accent-mint/75 to-accent-rose/65 sm:mt-1.5 sm:h-[3rem] sm:w-[3px]"
            aria-hidden
          />
          <div className="min-w-0 flex-1 border-b border-border/80 pb-4 sm:border-0 sm:pb-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl sm:tracking-tight">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          href="/events"
          className="group/footer inline-flex shrink-0 items-center gap-1 whitespace-nowrap pt-0.5 text-sm font-medium text-accent-mint transition hover:gap-1.5 sm:pt-1"
        >
          <span className="border-b border-transparent group-hover/footer:border-accent-mint">
            もっと見る
          </span>
          <span aria-hidden className="transition-transform group-hover/footer:translate-x-0.5">
            →
          </span>
        </Link>
      </header>
      {events.length === 0 ? (
        <p className="border-y border-dashed border-border/70 py-10 text-center text-sm text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        <ul className="flex flex-col gap-3 sm:gap-3.5">
          {events.map((e) => (
            <HomeEventRow key={e.id} event={e} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function HomeTopEventColumns(props: {
  recent: HomeEventBrief[];
  upcoming: HomeEventBrief[];
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
      <EventColumn
        title="開催が近いイベント"
        subtitle="開催日が近い順"
        events={props.upcoming}
        emptyHint="直近開催予定のイベントがありません。"
      />
      <EventColumn
        title="新着イベント"
        subtitle="最近カレンダーに追加されたイベント"
        events={props.recent}
        emptyHint="まだ公開中の新着イベントがありません。"
      />
    </div>
  );
}

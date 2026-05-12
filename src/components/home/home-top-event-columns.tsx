import Link from "next/link";
import Image from "next/image";

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
              unoptimized={Boolean(event.image_url?.startsWith("http"))}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-mint/15 to-accent-mint-subtle text-[11px] font-medium text-foreground">
              イベント
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-accent-mint sm:text-xs">
            {period}
          </p>
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
    <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-lg shadow-black/25 sm:p-7">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted sm:text-sm">{subtitle}</p>
        ) : null}
      </div>
      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card-elevated px-4 py-8 text-center text-sm text-muted">
          {emptyHint}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((e) => (
            <HomeEventRow key={e.id} event={e} />
          ))}
        </ul>
      )}
      <Link
        href="/events"
        className="text-center text-xs font-medium text-accent-mint underline-offset-2 hover:underline sm:text-sm"
      >
        すべてのイベントを見る
      </Link>
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
        title="新着イベント"
        subtitle="最近カレンダーに追加されたイベント"
        events={props.recent}
        emptyHint="まだ公開中の新着イベントがありません。"
      />
      <EventColumn
        title="開催が近いイベント"
        subtitle="開催日が近い順（これから楽しめるイベント）"
        events={props.upcoming}
        emptyHint="直近開催予定のイベントがありません。"
      />
    </div>
  );
}

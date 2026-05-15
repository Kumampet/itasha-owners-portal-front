import Link from "next/link";
import { SERVICE_OVERVIEW_ITEMS } from "@/content/service-overview";

export function ServiceOverviewSection() {
  return (
    <section
      aria-labelledby="service-overview-heading"
      className="grid gap-4 rounded-3xl bg-card-elevated p-5 sm:grid-cols-2 sm:gap-6 sm:p-8"
    >
      <h2 id="service-overview-heading" className="sr-only">
        サービス概要
      </h2>

      {SERVICE_OVERVIEW_ITEMS.map((item) => (
        <article key={item.id} className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {item.summary}
          </p>
        </article>
      ))}

      <div className="col-span-full flex justify-center pt-1 sm:pt-2">
        <Link
          href="/about"
          className="text-xs font-semibold text-muted-foreground underline-offset-2 transition hover:text-accent-mint hover:underline sm:text-sm"
        >
          サービス概要をすべて読む →
        </Link>
      </div>
    </section>
  );
}

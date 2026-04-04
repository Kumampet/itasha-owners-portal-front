import { Suspense } from "react";
import EventsPageClient from "./events-page-client";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 px-4 pb-16 pt-6 sm:pb-12 sm:pt-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </main>
      }
    >
      <EventsPageClient />
    </Suspense>
  );
}

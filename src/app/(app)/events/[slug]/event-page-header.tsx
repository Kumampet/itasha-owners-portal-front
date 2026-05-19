import { EventKeywordsContainer } from "./event-keywords-container";
import { EventTagsContainer, type EventTagItem } from "./event-tags-container";
import { EventThumbnailImageContainer } from "./event-thumbnail-image-container";
import { EventPageShareButtons } from "./event-page-share-buttons";

export type EventPageHeaderProps = {
  name: string;
  image_url: string | null;
  keywords: unknown;
  tags: EventTagItem[] | null | undefined;
  shareUrl: string;
};

export function EventPageHeader({
  name,
  image_url,
  keywords,
  tags,
  shareUrl,
}: EventPageHeaderProps) {
  return (
    <header className="space-y-3">
      <EventThumbnailImageContainer src={image_url} alt={name} />
      <EventPageShareButtons eventTitle={name} eventUrl={shareUrl} />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {name}
      </h1>
      <EventKeywordsContainer keywords={keywords} />
      <EventTagsContainer tags={tags} />
    </header>
  );
}

export type EventTagItem = {
  tag: { name: string };
};

type EventTagsContainerProps = {
  tags: EventTagItem[] | null | undefined;
};

export function EventTagsContainer({ tags }: EventTagsContainerProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <>
      {tags.map((eventTag, idx) => (
        <span
          key={idx}
          className="rounded-full bg-card-elevated px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          {eventTag.tag.name}
        </span>
      ))}
    </>
  );
}

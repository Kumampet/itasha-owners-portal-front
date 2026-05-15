import Image from "next/image";

type EventThumbnailImageContainerProps = {
  src: string | null | undefined;
  alt: string;
};

export function EventThumbnailImageContainer({
  src,
  alt,
}: EventThumbnailImageContainerProps) {
  const trimmed = src?.trim();
  if (!trimmed) return null;

  const unoptimized =
    trimmed.startsWith("/api/") || trimmed.startsWith("http");

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
      <Image
        src={trimmed}
        alt={alt}
        fill
        priority
        sizes="(max-width: 896px) 100vw, 896px"
        className="object-contain"
        unoptimized={unoptimized}
      />
    </div>
  );
}

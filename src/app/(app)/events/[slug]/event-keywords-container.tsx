type EventKeywordsContainerProps = {
  keywords: unknown;
};

export function EventKeywordsContainer({
  keywords,
}: EventKeywordsContainerProps) {
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return null;
  }

  return (
    <>
      {(keywords as string[]).map((keyword: string, idx: number) => (
        <span key={idx}>{keyword}</span>
      ))}
    </>
  );
}

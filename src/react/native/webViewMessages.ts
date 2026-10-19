export type ReaderWebViewMessage = Record<string, unknown> & {
  type?: string;
};

export type VersePageMap = {
  pageByVerseId: Record<string, number>;
  verseIdsByPage: Record<number, string[]>;
  signature: string;
};

export function parseReaderWebViewMessage(
  data?: string,
): ReaderWebViewMessage | null {
  if (!data) return null;
  try {
    const message: unknown = JSON.parse(data);
    return message && typeof message === "object" && !Array.isArray(message)
      ? (message as ReaderWebViewMessage)
      : null;
  } catch {
    return null;
  }
}

export function mapVersePages(pagesValue: unknown): VersePageMap {
  const pages = Array.isArray(pagesValue) ? pagesValue : [];
  const pageByVerseId: Record<string, number> = {};
  const verseIdsByPage: Record<number, string[]> = {};

  for (const page of pages) {
    if (!page || typeof page !== "object") continue;
    const pageRecord = page as Record<string, unknown>;
    const pageNumber = Number(pageRecord.pageNumber);
    if (!Number.isInteger(pageNumber) || pageNumber <= 0) continue;

    const verseIds = Array.isArray(pageRecord.verseIds)
      ? pageRecord.verseIds.map(String)
      : [];
    verseIdsByPage[pageNumber] = verseIds;
    for (const verseId of verseIds) pageByVerseId[verseId] = pageNumber;
  }

  return {
    pageByVerseId,
    verseIdsByPage,
    signature: JSON.stringify(pages),
  };
}

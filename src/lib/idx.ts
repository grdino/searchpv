export const IDX_SEARCH_URL =
  "https://idx.serachpv.com/idx/search/?Limit=150&ListingId=";

export function buildIdxUrl(listingIds: string) {
  const limitedIds = listingIds
    .split(",")
    .slice(0, 75)
    .join(",");

  return `${IDX_SEARCH_URL}${limitedIds}`;
}
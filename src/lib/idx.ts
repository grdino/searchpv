export const IDX_SEARCH_URL =
  "https://ronmorgan.net/idx/search/?Limit=400&ListingId=";

export function buildIdxUrl(listingIds: string) {
  return `${IDX_SEARCH_URL}${listingIds}`;
}
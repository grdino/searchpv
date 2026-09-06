export const SAVED_ITEMS_STORAGE_KEY = "searchpv:saved-items:v1";
export const SAVED_ITEMS_CHANGED_EVENT = "searchpv:saved-items-changed";

export type SavedItemType = "area" | "property" | "search";

export type SavedItem = {
  id: string;
  type: SavedItemType;
  referenceId: string;
  title: string;
  subtitle?: string;
  href: string;
  savedAt: string;
  metadata?: Record<string, unknown>;
};

function isSavedItem(value: unknown): value is SavedItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedItem>;

  return (
    typeof item.id === "string" &&
    (item.type === "area" || item.type === "property" || item.type === "search") &&
    typeof item.referenceId === "string" &&
    typeof item.title === "string" &&
    typeof item.href === "string" &&
    typeof item.savedAt === "string"
  );
}

export function getSavedItems(): SavedItem[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(SAVED_ITEMS_STORAGE_KEY) ?? "[]",
    );

    return Array.isArray(parsed) ? parsed.filter(isSavedItem) : [];
  } catch {
    return [];
  }
}

function writeSavedItems(items: SavedItem[]) {
  window.localStorage.setItem(SAVED_ITEMS_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(SAVED_ITEMS_CHANGED_EVENT));
}

export function saveItem(item: Omit<SavedItem, "savedAt"> & { savedAt?: string }) {
  const nextItem: SavedItem = {
    ...item,
    savedAt: item.savedAt ?? new Date().toISOString(),
  };

  const remaining = getSavedItems().filter((saved) => saved.id !== nextItem.id);
  writeSavedItems([nextItem, ...remaining]);
  return nextItem;
}

export function removeSavedItem(id: string) {
  writeSavedItems(getSavedItems().filter((item) => item.id !== id));
}

export function isItemSaved(id: string) {
  return getSavedItems().some((item) => item.id === id);
}

export function toggleSavedItem(item: Omit<SavedItem, "savedAt">) {
  if (isItemSaved(item.id)) {
    removeSavedItem(item.id);
    return false;
  }

  saveItem(item);
  return true;
}

export async function shareUrl(title: string, url: string) {
  const absoluteUrl = new URL(url, window.location.origin).toString();

  if (navigator.share) {
    try {
      await navigator.share({ title, url: absoluteUrl });
      return "shared" as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled" as const;
      }
    }
  }

  await navigator.clipboard.writeText(absoluteUrl);
  return "copied" as const;
}

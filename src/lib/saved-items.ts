export const SAVED_ITEMS_STORAGE_KEY =
  "searchpv:saved-items:v1";

export const SAVED_ITEMS_CHANGED_EVENT =
  "searchpv:saved-items-changed";

const ANONYMOUS_VISITOR_STORAGE_KEY =
  "searchpv:anonymous-visitor-id:v1";

export type SavedItemType =
  | "area"
  | "property"
  | "search";

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

type SavedItemEventType = "save" | "remove";

function isSavedItem(
  value: unknown,
): value is SavedItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<SavedItem>;

  return (
    typeof item.id === "string" &&
    (item.type === "area" ||
      item.type === "property" ||
      item.type === "search") &&
    typeof item.referenceId === "string" &&
    typeof item.title === "string" &&
    typeof item.href === "string" &&
    typeof item.savedAt === "string"
  );
}

function getAnonymousVisitorId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existingId =
      window.localStorage.getItem(
        ANONYMOUS_VISITOR_STORAGE_KEY,
      );

    if (existingId) {
      return existingId;
    }

    const newId = window.crypto.randomUUID();

    window.localStorage.setItem(
      ANONYMOUS_VISITOR_STORAGE_KEY,
      newId,
    );

    return newId;
  } catch {
    return null;
  }
}

function getDeviceType():
  | "mobile"
  | "tablet"
  | "desktop" {
  if (typeof window === "undefined") {
    return "desktop";
  }

  const width = window.innerWidth;

  if (width < 768) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

function recordSavedItemEvent(
  eventType: SavedItemEventType,
  item: Pick<
    SavedItem,
    "type" | "referenceId" | "title"
  >,
) {
  if (typeof window === "undefined") {
    return;
  }

  const anonymousVisitorId =
    getAnonymousVisitorId();

  if (!anonymousVisitorId) {
    return;
  }

  const payload = {
    anonymousVisitorId,
    eventType,
    itemType: item.type,
    referenceId: item.referenceId,
    itemTitle: item.title,
    sourcePath: window.location.pathname,
    deviceType: getDeviceType(),
  };

  void fetch("/api/analytics/save-event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /*
     * Analytics must never prevent a visitor
     * from saving or removing an item.
     */
  });
}

export function getSavedItems(): SavedItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(
        SAVED_ITEMS_STORAGE_KEY,
      ) ?? "[]",
    );

    return Array.isArray(parsed)
      ? parsed.filter(isSavedItem)
      : [];
  } catch {
    return [];
  }
}

function writeSavedItems(items: SavedItem[]) {
  window.localStorage.setItem(
    SAVED_ITEMS_STORAGE_KEY,
    JSON.stringify(items),
  );

  window.dispatchEvent(
    new CustomEvent(
      SAVED_ITEMS_CHANGED_EVENT,
    ),
  );
}

export function saveItem(
  item: Omit<SavedItem, "savedAt"> & {
    savedAt?: string;
  },
) {
  const currentItems = getSavedItems();

  const alreadySaved = currentItems.some(
    (saved) => saved.id === item.id,
  );

  const nextItem: SavedItem = {
    ...item,
    savedAt:
      item.savedAt ?? new Date().toISOString(),
  };

  const remaining = currentItems.filter(
    (saved) => saved.id !== nextItem.id,
  );

  writeSavedItems([nextItem, ...remaining]);

  if (!alreadySaved) {
    recordSavedItemEvent("save", nextItem);
  }

  return nextItem;
}

export function removeSavedItem(id: string) {
  const currentItems = getSavedItems();

  const itemBeingRemoved = currentItems.find(
    (item) => item.id === id,
  );

  writeSavedItems(
    currentItems.filter(
      (item) => item.id !== id,
    ),
  );

  if (itemBeingRemoved) {
    recordSavedItemEvent(
      "remove",
      itemBeingRemoved,
    );
  }
}

export function isItemSaved(id: string) {
  return getSavedItems().some(
    (item) => item.id === id,
  );
}

export function toggleSavedItem(
  item: Omit<SavedItem, "savedAt">,
) {
  if (isItemSaved(item.id)) {
    removeSavedItem(item.id);
    return false;
  }

  saveItem(item);
  return true;
}

export async function shareUrl(
  title: string,
  url: string,
) {
  const absoluteUrl = new URL(
    url,
    window.location.origin,
  ).toString();

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url: absoluteUrl,
      });

      return "shared" as const;
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return "cancelled" as const;
      }
    }
  }

  await navigator.clipboard.writeText(
    absoluteUrl,
  );

  return "copied" as const;
}
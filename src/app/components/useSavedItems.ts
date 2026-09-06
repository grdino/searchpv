"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getSavedItems,
  SAVED_ITEMS_CHANGED_EVENT,
  SAVED_ITEMS_STORAGE_KEY,
  type SavedItem,
} from "@/lib/saved-items";

export function useSavedItems() {
  const [items, setItems] = useState<SavedItem[]>([]);

  const refresh = useCallback(() => {
    setItems(getSavedItems());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVED_ITEMS_STORAGE_KEY) refresh();
    };

    refresh();
    window.addEventListener(SAVED_ITEMS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(SAVED_ITEMS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return { items, count: items.length, refresh };
}

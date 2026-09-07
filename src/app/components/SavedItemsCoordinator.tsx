"use client";

import { Check, Mail, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  getSavedItems,
  OPEN_SAVE_EMAIL_EVENT,
  replaceSavedItems,
  SAVED_ITEM_FEEDBACK_EVENT,
  SAVED_SYNC_STATUS_EVENT,
  type SavedItem,
  type SavedItemFeedbackDetail,
} from "@/lib/saved-items";

const SYNCED_USER_STORAGE_KEY = "searchpv:saved-user-id:v1";

type RemoteSavedItem = {
  item_id: string;
  item_type: SavedItem["type"];
  reference_id: string;
  title: string;
  subtitle: string | null;
  href: string;
  metadata: Record<string, unknown> | null;
  saved_at: string;
};

export default function SavedItemsCoordinator() {
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<"local" | "synced" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const userIdRef = useRef<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createClient();

    function publishStatus(nextEmail: string | null) {
      window.dispatchEvent(
        new CustomEvent(SAVED_SYNC_STATUS_EVENT, {
          detail: { email: nextEmail },
        }),
      );
    }

    async function applySession(
      user: { id: string; email?: string } | null,
    ) {
      userIdRef.current = user?.id ?? null;
      const nextEmail = user?.email ?? null;
      setVerifiedEmail(nextEmail);
      publishStatus(nextEmail);

      if (user) {
        await synchronizeSavedItems(supabase, user.id);
      }
    }

    void supabase.auth.getUser().then(({ data }) => {
      void applySession(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void applySession(session?.user ?? null);
      },
    );

    function showToast(kind: "local" | "synced") {
      setToast(kind);

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 9000);
    }

    function onSavedFeedback(event: Event) {
      const detail = (event as CustomEvent<SavedItemFeedbackDetail>).detail;
      if (!detail?.item) return;

      const userId = userIdRef.current;

      if (userId) {
        if (detail.action === "save") {
          void upsertRemoteItem(supabase, userId, detail.item);
          showToast("synced");
        } else {
          void deleteRemoteItem(supabase, userId, detail.item.id);
        }
      } else if (detail.action === "save") {
        showToast("local");
      }
    }

    function openDialog() {
      setDialogOpen(true);
      setSent(false);
      setErrorMessage("");
    }

    window.addEventListener(SAVED_ITEM_FEEDBACK_EVENT, onSavedFeedback);
    window.addEventListener(OPEN_SAVE_EMAIL_EVENT, openDialog);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener(SAVED_ITEM_FEEDBACK_EVENT, onSavedFeedback);
      window.removeEventListener(OPEN_SAVE_EMAIL_EVENT, openDialog);

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  async function requestVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setErrorMessage("");

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
/*    callbackUrl.searchParams.set("next", "/saved"); */

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl.toString(),
        shouldCreateUser: true,
      },
    });

    setSending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <>
      {toast ? (
        <div className="fixed inset-x-4 bottom-4 z-[10000] mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_20px_55px_rgba(15,23,42,.24)]">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <Check size={18} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-950">
                {toast === "synced"
                  ? "Saved across devices"
                  : "Saved on this device"}
              </p>

              {toast === "local" ? (
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Keep your saves available on your phone, tablet, and computer with your email.
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-600">
                  Connected to {verifiedEmail}.
                </p>
              )}

              {toast === "local" ? (
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="mt-2 text-xs font-black text-emerald-800 underline decoration-emerald-300 underline-offset-2"
                >
                  Keep Across Devices
                </button>
              ) : null}
            </div>

            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setToast(null)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      ) : null}

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-email-title"
        >
          <div className="w-full max-w-md rounded-[24px] border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <Mail size={21} />
              </span>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setDialogOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <h2 id="save-email-title" className="mt-4 text-xl font-black text-slate-950">
              Keep your saves across devices
            </h2>

            {sent ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-black text-emerald-950">Check your email</p>
                <p className="mt-1 text-sm leading-6 text-emerald-900">
                  We sent a secure verification link to {email.trim()}. Open it to connect your saved items.
                </p>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter your email and we’ll send a secure link. No password is required, and this does not subscribe you to promotional email.
                </p>

                <form onSubmit={requestVerification} className="mt-5">
                  <label className="block text-sm font-bold text-slate-800">
                    Email address
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  {errorMessage ? (
                    <p className="mt-3 text-sm font-semibold text-red-700">{errorMessage}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={sending}
                    className="mt-4 w-full rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Email Me a Secure Link"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

async function synchronizeSavedItems(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("saved_item")
    .select("item_id,item_type,reference_id,title,subtitle,href,metadata,saved_at")
    .order("saved_at", { ascending: false });

  if (error) {
    console.error("Unable to load synchronized saves:", error);
    return;
  }

  const remoteItems = ((data ?? []) as RemoteSavedItem[]).map(fromRemoteItem);
  const localItems = getSavedItems();
  const previousUserId = window.localStorage.getItem(SYNCED_USER_STORAGE_KEY);

  if (previousUserId === userId || (previousUserId && previousUserId !== userId)) {
    replaceSavedItems(remoteItems);
    window.localStorage.setItem(SYNCED_USER_STORAGE_KEY, userId);
    return;
  }

  const merged = mergeItems(localItems, remoteItems);

  if (merged.length) {
    const { error: upsertError } = await supabase
      .from("saved_item")
      .upsert(
        merged.map((item) => toRemoteItem(userId, item)),
        { onConflict: "user_id,item_id" },
      );

    if (upsertError) {
      console.error("Unable to synchronize saved items:", upsertError);
      return;
    }
  }

  replaceSavedItems(merged);
  window.localStorage.setItem(SYNCED_USER_STORAGE_KEY, userId);
}

async function upsertRemoteItem(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  item: SavedItem,
) {
  const { error } = await supabase
    .from("saved_item")
    .upsert(toRemoteItem(userId, item), {
      onConflict: "user_id,item_id",
    });

  if (error) console.error("Unable to save across devices:", error);
}

async function deleteRemoteItem(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  itemId: string,
) {
  const { error } = await supabase
    .from("saved_item")
    .delete()
    .eq("user_id", userId)
    .eq("item_id", itemId);

  if (error) console.error("Unable to remove synchronized save:", error);
}

function toRemoteItem(userId: string, item: SavedItem) {
  return {
    user_id: userId,
    item_id: item.id,
    item_type: item.type,
    reference_id: item.referenceId,
    title: item.title,
    subtitle: item.subtitle ?? null,
    href: item.href,
    metadata: item.metadata ?? null,
    saved_at: item.savedAt,
    updated_at: new Date().toISOString(),
  };
}

function fromRemoteItem(item: RemoteSavedItem): SavedItem {
  return {
    id: item.item_id,
    type: item.item_type,
    referenceId: item.reference_id,
    title: item.title,
    subtitle: item.subtitle ?? undefined,
    href: item.href,
    savedAt: item.saved_at,
    metadata: item.metadata ?? undefined,
  };
}

function mergeItems(localItems: SavedItem[], remoteItems: SavedItem[]) {
  const merged = new Map<string, SavedItem>();

  for (const item of [...remoteItems, ...localItems]) {
    const existing = merged.get(item.id);
    if (!existing || item.savedAt > existing.savedAt) merged.set(item.id, item);
  }

  return [...merged.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

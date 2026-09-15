import type { Metadata } from "next";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import Header from "@/app/components/Header";
import { createOfficeClient } from "@/lib/supabase/office-server";

export const metadata: Metadata = {
  title: "Saved-Item Analytics | SearchPV Office",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = "force-dynamic";

type RangeKey = "7d" | "30d" | "90d" | "all";

type SavedEvent = {
  event_ky: number;
  anonymous_visitor_id: string;
  user_id: string | null;
  email: string | null;
  event_type: "save" | "remove";
  item_type: "area" | "property" | "search";
  reference_id: string;
  item_title: string | null;
  source_path: string | null;
  device_type: "mobile" | "tablet" | "desktop" | null;
  created_at: string;
};

type ConnectedSavedItem = {
  user_id: string;
  email: string;
  item_id: string;
  item_type: "area" | "property" | "search";
  reference_id: string;
  title: string;
  subtitle: string | null;
  href: string;
  metadata: Record<string, unknown> | null;
  saved_at: string;
  updated_at: string;
};

type ConnectedSaver = {
  userId: string;
  email: string;
  total: number;
  properties: number;
  searches: number;
  areas: number;
  lastSave: string;
};

type SearchParams = {
  range?: string;
};

const rangeOptions: Array<{
  key: RangeKey;
  label: string;
}> = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "all", label: "All Time" },
];

export default async function SavedAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selectedRange = parseRange(params.range);

  const officeSupabase = await createOfficeClient();

  const [{ events, truncated }, connectedItems] = await Promise.all([
    loadSavedEvents(officeSupabase),
    loadConnectedSavedItems(officeSupabase),
  ]);

  const connectedSavers = buildConnectedSavers(connectedItems);

  const filteredEvents = filterByRange(
    events,
    selectedRange,
  );

  const saveEvents = filteredEvents.filter(
    (event) => event.event_type === "save",
  );

  const removeEvents = filteredEvents.filter(
    (event) => event.event_type === "remove",
  );

  const uniqueSavingVisitors = new Set(
    saveEvents.map(
      (event) => event.anonymous_visitor_id,
    ),
  ).size;

  const retainedItems = getRetainedItems(events);

  const retainedVisitors = new Set(
    retainedItems.map(
      (event) => event.anonymous_visitor_id,
    ),
  ).size;

  const typeCounts = countBy(
    saveEvents,
    (event) => event.item_type,
  );

  const deviceCounts = countBy(
    saveEvents,
    (event) => event.device_type ?? "unknown",
  );

  const mostSaved = buildMostSaved(saveEvents);
  const dailyActivity =
    buildDailyActivity(filteredEvents);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Header />

        <section className="rounded-2xl bg-slate-950 px-6 py-7 text-white">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                SearchPV Office
              </p>

              <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                Saved-Item Analytics
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Save activity across SearchPV, including anonymous usage and
                verified users who choose to keep their saves across devices.
              </p>
            </div>

            <Link
              href="/office"
              className="rounded-full border border-slate-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              ← Private Office
            </Link>
          </div>

          <nav className="mt-6 flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <Link
                key={option.key}
                href={
                  option.key === "30d"
                    ? "/office/saved-analytics"
                    : `/office/saved-analytics?range=${option.key}`
                }
                className={[
                  "rounded-full border px-4 py-2 text-xs font-black transition",
                  selectedRange === option.key
                    ? "border-emerald-300 bg-emerald-300 text-slate-950"
                    : "border-slate-600 bg-white/5 text-white hover:border-slate-400",
                ].join(" ")}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </section>

        {truncated ? (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Analytics contain more than 20,000 events.
            This first dashboard is displaying the most
            recent 20,000.
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Connected Savers"
            value={connectedSavers.length}
            detail="Verified emails with current saves"
          />

          <StatCard
            label="Connected Saved Items"
            value={connectedItems.length}
            detail="Current saves kept across devices"
          />
        </section>

        <section className="mt-6">
          <DataCard title="Connected Savers">
            {connectedSavers.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3 text-right">Saves</th>
                      <th className="px-3 py-3 text-right">Properties</th>
                      <th className="px-3 py-3 text-right">Searches</th>
                      <th className="px-3 py-3 text-right">Areas</th>
                      <th className="px-3 py-3">Last Save</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {connectedSavers.map((saver) => (
                      <tr key={saver.userId}>
                        <td className="px-3 py-3 font-bold text-slate-900">
                          <a
                            href={`mailto:${saver.email}`}
                            className="text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-950"
                          >
                            {saver.email}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-right font-black text-slate-950">
                          {saver.total}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-700">
                          {saver.properties}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-700">
                          {saver.searches}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-700">
                          {saver.areas}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                          {formatDateTime(saver.lastSave)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-sm text-slate-500">
                No verified users currently have synchronized saves.
              </p>
            )}
          </DataCard>
        </section>

        <section className="mt-6">
          <DataCard title="Connected Saved Items">
            {connectedItems.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Saved Item</th>
                      <th className="px-3 py-3">Saved</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {connectedItems.map((item) => (
                      <tr key={`${item.user_id}:${item.item_id}`}>
                        <td className="px-3 py-3 font-semibold text-slate-700">
                          <a
                            href={`mailto:${item.email}`}
                            className="text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-950"
                          >
                            {item.email}
                          </a>
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-700">
                          {formatItemType(item.item_type)}
                        </td>
                        <td className="max-w-[420px] px-3 py-3">
                          <Link
                            href={item.href}
                            className="font-bold text-slate-900 hover:text-emerald-800"
                          >
                            {item.title}
                          </Link>
                          {item.subtitle ? (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.subtitle}
                            </p>
                          ) : null}
                          <p className="mt-0.5 break-all text-xs text-slate-400">
                            {item.reference_id}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                          {formatDateTime(item.saved_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-sm text-slate-500">
                No synchronized saved items are currently stored.
              </p>
            )}
          </DataCard>
        </section>

        <section className="mt-8 border-t border-slate-300 pt-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Anonymous Activity
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Save and remove behavior from all visitors, including people who have not connected an email.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Save Actions"
            value={saveEvents.length}
            detail={rangeLabel(selectedRange)}
          />

          <StatCard
            label="Unique Savers"
            value={uniqueSavingVisitors}
            detail={rangeLabel(selectedRange)}
          />

          <StatCard
            label="Remove Actions"
            value={removeEvents.length}
            detail={rangeLabel(selectedRange)}
          />

          <StatCard
            label="Currently Retained"
            value={retainedItems.length}
            detail={`${retainedVisitors.toLocaleString()} anonymous visitors`}
          />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <BreakdownCard
            title="Saves by Type"
            rows={[
              {
                label: "Property searches and reports",
                value: typeCounts.search ?? 0,
              },
              {
                label: "Atlas areas",
                value: typeCounts.area ?? 0,
              },
              {
                label: "Properties",
                value: typeCounts.property ?? 0,
              },
            ]}
          />

          <BreakdownCard
            title="Saves by Device"
            rows={[
              {
                label: "Mobile",
                value: deviceCounts.mobile ?? 0,
              },
              {
                label: "Tablet",
                value: deviceCounts.tablet ?? 0,
              },
              {
                label: "Desktop",
                value: deviceCounts.desktop ?? 0,
              },
              {
                label: "Unknown",
                value: deviceCounts.unknown ?? 0,
              },
            ]}
          />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <DataCard title="Most-Saved Items">
            {mostSaved.length ? (
              <div className="divide-y divide-slate-100">
                {mostSaved.slice(0, 15).map((item) => (
                  <div
                    key={`${item.itemType}:${item.referenceId}`}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">
                        {item.title}
                      </p>

                      <p className="mt-0.5 break-all text-xs text-slate-500">
                        {item.referenceId}
                      </p>

                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                        {formatItemType(item.itemType)}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-900">
                      {item.visitorCount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </DataCard>

          <DataCard title="Activity by Day">
            {dailyActivity.length ? (
              <div className="divide-y divide-slate-100">
                {dailyActivity.slice(0, 30).map((day) => (
                  <div
                    key={day.date}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-5 py-3 text-sm"
                  >
                    <span className="font-bold text-slate-800">
                      {formatDay(day.date)}
                    </span>

                    <span className="text-emerald-700">
                      {day.saves} saved
                    </span>

                    <span className="text-slate-500">
                      {day.removes} removed
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </DataCard>
        </section>

        <section className="mt-6">
          <DataCard title="Recent Activity">
            {filteredEvents.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[850px] w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">When</th>
                      <th className="px-3 py-3">Action</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Item</th>
                      <th className="px-3 py-3">Device</th>
                      <th className="px-3 py-3">Visitor</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredEvents
                      .slice(0, 50)
                      .map((event) => (
                        <tr key={event.event_ky}>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                            {formatDateTime(
                              event.created_at,
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className={[
                                "rounded-full px-2.5 py-1 text-xs font-black",
                                event.event_type === "save"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-slate-200 text-slate-700",
                              ].join(" ")}
                            >
                              {event.event_type}
                            </span>
                          </td>

                          <td className="px-3 py-3 font-semibold text-slate-700">
                            {formatItemType(
                              event.item_type,
                            )}
                          </td>

                          <td className="max-w-[320px] px-3 py-3">
                            <p className="font-bold text-slate-900">
                              {event.item_title ||
                                event.reference_id}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {event.reference_id}
                            </p>
                          </td>

                          <td className="px-3 py-3 capitalize text-slate-600">
                            {event.device_type || "Unknown"}
                          </td>

                          <td
                            className="px-3 py-3 text-xs text-slate-600"
                            title={`Visitor ID: ${event.anonymous_visitor_id}`}
                          >
                            {event.email ? (
                              <a
                                href={`mailto:${event.email}`}
                                className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-950"
                              >
                                {event.email}
                              </a>
                            ) : (
                              <span className="font-semibold text-slate-500">
                                Anonymous
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}
          </DataCard>
        </section>
      </div>
    </main>
  );
}

async function loadConnectedSavedItems(
  supabase: SupabaseClient,
): Promise<ConnectedSavedItem[]> {
  const { data, error } = await supabase.rpc(
    "office_saved_items",
  );

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ConnectedSavedItem[];
}

function buildConnectedSavers(
  items: ConnectedSavedItem[],
): ConnectedSaver[] {
  const grouped = new Map<string, ConnectedSaver>();

  for (const item of items) {
    const current = grouped.get(item.user_id) ?? {
      userId: item.user_id,
      email: item.email,
      total: 0,
      properties: 0,
      searches: 0,
      areas: 0,
      lastSave: item.saved_at,
    };

    current.total += 1;

    if (item.item_type === "property") current.properties += 1;
    if (item.item_type === "search") current.searches += 1;
    if (item.item_type === "area") current.areas += 1;

    if (item.saved_at > current.lastSave) {
      current.lastSave = item.saved_at;
    }

    grouped.set(item.user_id, current);
  }

  return [...grouped.values()].sort(
    (a, b) =>
      b.lastSave.localeCompare(a.lastSave) ||
      a.email.localeCompare(b.email),
  );
}

async function loadSavedEvents(
  supabase: SupabaseClient,
) {
  const maximumEvents = 20_000;

  const { data, error } = await supabase.rpc(
    "office_saved_item_events",
  );

  if (error) {
    throw new Error(error.message);
  }

  const allEvents = (data ?? []) as SavedEvent[];
  const truncated = allEvents.length > maximumEvents;

  return {
    events: allEvents.slice(0, maximumEvents),
    truncated,
  };
}

function getRetainedItems(events: SavedEvent[]) {
  const latestByItem = new Map<string, SavedEvent>();

  for (const event of events) {
    const key = [
      event.anonymous_visitor_id,
      event.item_type,
      event.reference_id,
    ].join("|");

    if (!latestByItem.has(key)) {
      latestByItem.set(key, event);
    }
  }

  return [...latestByItem.values()].filter(
    (event) => event.event_type === "save",
  );
}

function filterByRange(
  events: SavedEvent[],
  range: RangeKey,
) {
  if (range === "all") {
    return events;
  }

  const days =
    range === "7d"
      ? 7
      : range === "90d"
        ? 90
        : 30;

  const cutoff = Date.now() - days * 86_400_000;

  return events.filter(
    (event) =>
      new Date(event.created_at).getTime() >= cutoff,
  );
}

function countBy<T>(
  rows: T[],
  getKey: (row: T) => string,
) {
  const counts: Record<string, number> = {};

  for (const row of rows) {
    const key = getKey(row);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}

function buildMostSaved(events: SavedEvent[]) {
  const grouped = new Map<
    string,
    {
      itemType: SavedEvent["item_type"];
      referenceId: string;
      title: string;
      visitors: Set<string>;
    }
  >();

  for (const event of events) {
    const key =
      `${event.item_type}:${event.reference_id}`;

    const existing = grouped.get(key);

    if (existing) {
      existing.visitors.add(
        event.anonymous_visitor_id,
      );
      continue;
    }

    grouped.set(key, {
      itemType: event.item_type,
      referenceId: event.reference_id,
      title:
        event.item_title ||
        event.reference_id,
      visitors: new Set([
        event.anonymous_visitor_id,
      ]),
    });
  }

  return [...grouped.values()]
    .map((item) => ({
      itemType: item.itemType,
      referenceId: item.referenceId,
      title: item.title,
      visitorCount: item.visitors.size,
    }))
    .sort(
      (a, b) =>
        b.visitorCount - a.visitorCount ||
        a.title.localeCompare(b.title),
    );
}

function buildDailyActivity(
  events: SavedEvent[],
) {
  const grouped = new Map<
    string,
    {
      date: string;
      saves: number;
      removes: number;
    }
  >();

  for (const event of events) {
    const date = event.created_at.slice(0, 10);

    const current = grouped.get(date) ?? {
      date,
      saves: 0,
      removes: 0,
    };

    if (event.event_type === "save") {
      current.saves += 1;
    } else {
      current.removes += 1;
    }

    grouped.set(date, current);
  }

  return [...grouped.values()].sort(
    (a, b) => b.date.localeCompare(a.date),
  );
}

function parseRange(value: string | undefined): RangeKey {
  if (
    value === "7d" ||
    value === "90d" ||
    value === "all"
  ) {
    return value;
  }

  return "30d";
}

function rangeLabel(range: RangeKey) {
  if (range === "7d") return "Last 7 days";
  if (range === "90d") return "Last 90 days";
  if (range === "all") return "All recorded activity";

  return "Last 30 days";
}

function formatItemType(
  type: SavedEvent["item_type"],
) {
  if (type === "area") return "Atlas Area";
  if (type === "property") return "Property";

  return "Search / Report";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-slate-950">
        {value.toLocaleString()}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
    </article>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    label: string;
    value: number;
  }>;
}) {
  const maximum = Math.max(
    1,
    ...rows.map((row) => row.value),
  );

  return (
    <DataCard title={title}>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-slate-700">
                {row.label}
              </span>

              <span className="font-black text-slate-950">
                {row.value.toLocaleString()}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{
                  width: `${Math.max(
                    row.value > 0 ? 5 : 0,
                    (row.value / maximum) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
}

function DataCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-black text-slate-950">
        {title}
      </h2>

      <div className="mt-4">{children}</div>
    </article>
  );
}

function EmptyState() {
  return (
    <p className="py-6 text-sm text-slate-500">
      No saved-item activity was recorded during this
      period.
    </p>
  );
}
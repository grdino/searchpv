type NearbyRollup = {
  walkability_score: number | null;
  walkability_label: string | null;
  walkability_summary: string | null;
  lifestyle_summary: string | null;

  restaurant_count: number | null;
  cafe_count: number | null;
  bar_count: number | null;
  grocery_count: number | null;
  pharmacy_count: number | null;
  gallery_count: number | null;
  gym_count: number | null;
  park_count: number | null;
};

type NearbyPlace = {
  place_category: string;
  place_name: string;
  distance_m: number | null;
  walk_minutes: number | null;
  why_it_matters: string | null;
  display_order: number | null;
  is_highlight: boolean | null;
};

export default function NearbySection({
  developmentName,
  rollup,
  places,
}: {
  developmentName: string;
  rollup: NearbyRollup | null;
  places: NearbyPlace[];
}) {
  const highlights = buildHighlights(places);

  return (
    <div style={{ paddingTop: "48px" }}>
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          padding: "32px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
          border: "1px solid #f1f5f9",
        }}
      >
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          Nearby
        </div>

        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Around {developmentName}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Daily convenience, lifestyle access, and nearby amenities.
            </p>
          </div>

          {rollup?.walkability_score !== null &&
            rollup?.walkability_score !== undefined && (
              <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Walkability</span>
                  <span
                    title="SearchPV walkability is based on nearby restaurants, cafés, grocery options, pharmacies, parks, gyms, galleries, and beach proximity within approximately 500 meters. Scores are generated from mapped place data and should be used as a general lifestyle indicator, not a formal walk score."
                    className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-500 text-[10px] text-slate-300"
                  >
                    ?
                  </span>
                </div>
                <div className="mt-1 flex items-end gap-2">
                  <span className="text-4xl font-extrabold">
                    {rollup.walkability_score}
                  </span>
                  <span className="pb-1 text-sm font-bold text-slate-300">
                    {rollup.walkability_label ?? "Not Rated"}
                  </span>
                </div>
              </div>
            )}
        </div>

        {rollup ? (
          <div className="mt-8 rounded-3xl bg-slate-50 p-6">
            <h3 className="text-lg font-bold">Walkability</h3>

            {rollup.walkability_summary && (
              <p className="mt-3 leading-7 text-slate-700">
                {rollup.walkability_summary}
              </p>
            )}

            {rollup.lifestyle_summary && (
              <p className="mt-3 leading-7 text-slate-700">
                {rollup.lifestyle_summary}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <NearbyStat label="Restaurants" value={rollup.restaurant_count} />
              <NearbyStat label="Cafés" value={rollup.cafe_count} />
              <NearbyStat label="Bars" value={rollup.bar_count} />
              <NearbyStat label="Grocery" value={rollup.grocery_count} />
              <NearbyStat label="Pharmacies" value={rollup.pharmacy_count} />
              <NearbyStat label="Galleries" value={rollup.gallery_count} />
              <NearbyStat label="Gyms" value={rollup.gym_count} />
              <NearbyStat label="Parks" value={rollup.park_count} />
            </div>
          </div>
        ) : (
          <p className="mt-6 leading-7 text-slate-700">
            Nearby lifestyle data has not been added yet for this development.
          </p>
        )}

        {highlights.length > 0 && (
          <section className="mt-10 border-t border-slate-200 pt-8">
            <h3 className="text-lg font-bold">Closest Highlights</h3>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {highlights.map((place) => {
                const display = getDisplayCategory(place);

                return (
                  <div
                    key={`${place.place_category}-${place.place_name}`}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                        {display.icon}
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {display.label}
                        </div>

                        <div className="mt-1 text-lg font-extrabold text-slate-900">
                          {place.place_name}
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-600">
                          {formatDistance(place.distance_m)}
                          {place.walk_minutes
                            ? ` • ${place.walk_minutes} min walk`
                            : ""}
                        </div>

                        {display.reason && (
                          <div className="mt-2 text-sm text-slate-500">
                            {display.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <p className="mt-6 text-xs text-slate-400">
          Nearby place data © OpenStreetMap contributors.
        </p>
      </section>
    </div>
  );
}

function NearbyStat({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  if (!value) return null;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
    </div>
  );
}

function buildHighlights(places: NearbyPlace[]) {
  const preferredOrder = [
    "beach",
    "grocery",
    "pharmacy",
    "hospital_urgent_care",
    "restaurant",
    "cafe",
    "bar",
    "gym",
    "park",
    "gallery",
    "marina",
    "golf",
  ];

  const byCategory = new Map<string, NearbyPlace>();

  for (const category of preferredOrder) {
    const best = places
      .filter((place) => place.place_category === category)
      .sort(
        (a, b) =>
          Number(a.distance_m ?? 999999) - Number(b.distance_m ?? 999999)
      )[0];

    if (best) byCategory.set(category, best);
  }

  return preferredOrder
    .map((category) => byCategory.get(category))
    .filter(Boolean)
    .slice(0, 8) as NearbyPlace[];
}

function getDisplayCategory(place: NearbyPlace) {
  const category = place.place_category;

  const map: Record<
    string,
    {
      label: string;
      icon: string;
      reason: string;
    }
  > = {
    beach: {
      label: "Beach",
      icon: "🏖️",
      reason: "Beach access",
    },
    grocery: {
      label: "Grocery",
      icon: "🛒",
      reason: "Daily convenience",
    },
    pharmacy: {
      label: "Pharmacy",
      icon: "💊",
      reason: "Everyday necessity",
    },
    hospital_urgent_care: {
      label: "Medical",
      icon: "🏥",
      reason: "Practical consideration",
    },
    restaurant: {
      label: "Restaurant",
      icon: "🍽️",
      reason: "Dining",
    },
    cafe: {
      label: "Café",
      icon: "☕",
      reason: "Daily lifestyle",
    },
    bar: {
      label: "Bar",
      icon: "🍸",
      reason: "Nightlife",
    },
    gym: {
      label: "Gym",
      icon: "🏋️",
      reason: "Fitness",
    },
    park: {
      label: "Park",
      icon: "🌳",
      reason: "Outdoor space",
    },
    gallery: {
      label: "Gallery",
      icon: "🎨",
      reason: "Arts and culture",
    },
    marina: {
      label: "Marina",
      icon: "⛵",
      reason: "Boating access",
    },
    golf: {
      label: "Golf",
      icon: "⛳",
      reason: "Golf lifestyle",
    },
    public_transit: {
      label: "Transit",
      icon: "🚌",
      reason: "Mobility",
    },
  };

  return (
    map[category] ?? {
      label: category,
      icon: "📍",
      reason: place.why_it_matters ?? "",
    }
  );
}

function formatDistance(value: number | null | undefined) {
  if (value === null || value === undefined) return "";

  if (value < 1000) return `${value.toLocaleString()} m`;

  return `${(value / 1000).toFixed(1)} km`;
}

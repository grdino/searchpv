import Link from "next/link";

import Header from "@/app/components/Header";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import MainSloganBranding from "@/app/components/MainSloganBranding";

import { requireOfficeAppAccess } from "@/lib/office-auth";
import { createOfficeClient } from "@/lib/supabase/office-server";
import PublicationButton from "./PublicationButton";
import DevelopmentPhotoUploader from "./DevelopmentPhotoUploader";
import DeletePhotoButton from "./DeletePhotoButton";

import {
  saveBuildingFacts,
  saveDevelopmentContent,
  saveDevelopmentAmenities,
  saveDevelopmentDetails,
  saveDevelopmentNearby,
  saveDevelopmentSeo,
  saveDevelopmentReview,
  setDevelopmentPublication,
  updateDevelopmentPhoto,
  setPrimaryDevelopmentPhoto,
  moveDevelopmentPhoto,
  deleteDevelopmentPhoto,
} from "./actions";

export const dynamic = "force-dynamic";

type Development = {
  development_profile_id: number;
  development_name: string;
  zone_slug: string;
  area_slug: string;
  community_slug: string;
  development_slug: string;
  is_published: boolean;
  is_profiled: boolean;
  profile_priority: number | null;
  priority_reason: string | null;
  notes: string | null;
  source_notes: string | null;
  reviewed_by: string | null;
  last_reviewed: string | null;
  profile_status: string | null;
  content_status: string | null;
  num_units: number | null;
  num_buildings: number | null;
  floors: number | null;
  completion_year: number | null;
  developer: string | null;
  units_studio: number | null;
  units_1br: number | null;
  units_2br: number | null;
  units_3br: number | null;
  units_4br_plus: number | null;
  unit_mix_notes: string | null;
  unit_mix_source: string | null;
  description: string | null;
  overview: string | null;
  building_facts: string | null;
  location_description: string | null;
  lifestyle: string | null;
  searchpv_insights: string | null;
  buyer_notes: string | null;
  investor_notes: string | null;
  has_pool: boolean | null;
  has_gym: boolean | null;
  has_security: boolean | null;
  has_elevator: boolean | null;
  has_parking: boolean | null;
  has_rooftop: boolean | null;
  has_jacuzzi: boolean | null;
  has_bbq: boolean | null;
  has_concierge: boolean | null;
  has_coworking: boolean | null;
  has_steam_room: boolean | null;
  has_sauna: boolean | null;
  has_spa: boolean | null;
  has_storage: boolean | null;
  has_lockoff_units: boolean | null;
  has_lobby: boolean | null;
  has_restaurant_retail: boolean | null;
  pet_policy: string | null;
  rental_policy: string | null;
  parking: string | null;
  hoa_notes: string | null;
  official_name: string | null;
  profile_title: string | null;
  address: string | null;
  cross_streets: string | null;
  neighborhood_label: string | null;
  latitude: number | null;
  longitude: number | null;
  year_built: number | null;
  completion_status: string | null;
  stories: number | null;
  residences: number | null;
  construction_type: string | null;
  architect: string | null;
  beach_access: string | null;
  walkability_notes: string | null;
  nearby_summary: string | null;
  nearby_restaurants_count: number | null;
  nearby_bars_count: number | null;
  nearby_galleries_count: number | null;
  nearby_cafes_count: number | null;
  nearby_beach_minutes: number | null;
  nearby_grocery_minutes: number | null;
  nearby_notes: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  meta_description: string | null;
  website: string | null;
  source_urls: string[] | null;
};

type DevelopmentPhoto = {
  development_photo_id: number;
  development_profile_id: number;
  storage_path: string;
  caption: string | null;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  source_notes: string | null;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    development?: string;
    saved?: string;
    content_saved?: string;
    amenities_saved?: string;
    details_saved?: string;
    nearby_saved?: string;
    seo_saved?: string;
    review_saved?: string;
    publication_saved?: string;
  }>;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 " +
  "bg-white px-3 py-2.5 text-slate-900 " +
  "focus:outline-none focus:ring-2 focus:ring-sky-400";

const labelClass =
  "block text-sm font-medium text-slate-700";

type NumberFieldProps = {
  name: string;
  label: string;
  value: number | null;
  min?: number;
  max?: number;
};

function NumberField({
  name,
  label,
  value,
  min = 0,
  max,
}: NumberFieldProps) {
  return (
    <label className={labelClass}>
      {label}
      <input
        type="number"
        name={name}
        min={min}
        max={max}
        step="1"
        defaultValue={value ?? ""}
        className={inputClass}
      />
    </label>
  );
}

export default async function DevelopmentManagementPage({
  searchParams,
}: PageProps) {
  await requireOfficeAppAccess("development_management");

  const params = await searchParams;
  const searchQuery = params.q?.trim() ?? "";

  const supabase = await createOfficeClient();

  const { data, error } = await supabase.rpc(
    "development_management_search",
    {
      p_search: searchQuery || null,
      p_limit: 100,
      p_offset: 0,
    },
  );

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Development Management
        </h1>
        <p className="mt-4 text-red-700">
          {error.message}
        </p>
      </main>
    );
  }

  const developments = (data ?? []) as Development[];

  const selectedId = Number(params.development);

  let selectedDevelopment: Development | null = null;

  if (Number.isSafeInteger(selectedId) && selectedId > 0) {
    const { data: profileData, error: profileError } =
      await supabase.rpc(
        "development_management_get_profile",
        {
          p_development_profile_id: selectedId,
        },
      );

    if (profileError) {
      throw new Error(
        `Unable to load development profile: ${profileError.message}`,
      );
    }

    selectedDevelopment =
      ((profileData ?? [])[0] as Development | undefined) ??
      null;
  }

  const { data: developmentPhotos, error: photosError } =
    selectedDevelopment
      ? await supabase.rpc(
          "development_management_photos",
          {
            p_development_profile_id:
              selectedDevelopment.development_profile_id,
          },
        )
      : { data: [], error: null };

  if (photosError) {
    throw new Error(
      `Unable to load development photos: ${photosError.message}`,
    );
  }

  const photos = (developmentPhotos ?? []) as DevelopmentPhoto[];

  const selectedHref = (id: number) =>
    `/office/developments?q=${encodeURIComponent(
      searchQuery,
    )}&development=${id}#selected-development`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative">
            <Header />
            <div className="absolute right-0 top-0 z-50">
              <HamburgerMenu />
            </div>
          </div>

          <MainSloganBranding />

          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-sky-300">
            Office Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Development Management
          </h1>

          <p className="mt-3 text-sm text-slate-300">
            Maintain development profiles, building
            information, photographs, and SEO content.
          </p>

          <form className="mt-6 flex max-w-xl gap-3">
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search developments..."
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />

            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Developments
          </h2>

          <span className="text-sm text-slate-500">
            {developments.length} records
            {developments.length === 100 ? " (first 100)" : ""}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3">Development</th>
                <th className="px-4 py-3">Community</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Profile Status</th>
                <th className="px-4 py-3">Published</th>
              </tr>
            </thead>

            <tbody>
              {developments.map((development) => {
                const isSelected =
                  selectedDevelopment?.development_profile_id ===
                  development.development_profile_id;

                return (
                  <tr
                    key={development.development_profile_id}
                    className={`border-t border-slate-100 ${
                      isSelected ? "bg-sky-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold">
                      <Link
                        href={selectedHref(
                          development.development_profile_id,
                        )}
                        className="text-sky-700 hover:underline"
                      >
                        {development.development_name}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      {development.community_slug}
                    </td>

                    <td className="px-4 py-3">
                      {development.num_units ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {development.profile_status ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {development.is_published ? "Yes" : "No"}
                    </td>
                  </tr>
                );
              })}

              {developments.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No developments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedDevelopment && (
          <section
            id="selected-development"
            className="mt-8 scroll-mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-sky-700">
                  Selected Development
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {selectedDevelopment.development_name}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Development ID:{" "}
                  {selectedDevelopment.development_profile_id}
                </p>
              </div>

              <Link
                href={`/office/developments?q=${encodeURIComponent(
                  searchQuery,
                )}`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Community
                </p>
                <p className="mt-1 font-semibold">
                  {selectedDevelopment.community_slug}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Total Units
                </p>
                <p className="mt-1 font-semibold">
                  {selectedDevelopment.num_units ?? "Unknown"}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Profile Status
                </p>
                <p className="mt-1 font-semibold">
                  {selectedDevelopment.profile_status ?? "Unknown"}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Published
                </p>
                <p className="mt-1 font-semibold">
                  {selectedDevelopment.is_published ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {params.saved === "1" && (
              <div
                role="status"
                className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
              >
                Building facts saved successfully.
              </div>
            )}

            <form action={saveBuildingFacts} className="mt-8">
              <input
                type="hidden"
                name="development_profile_id"
                value={selectedDevelopment.development_profile_id}
              />

              <input
                type="hidden"
                name="return_q"
                value={searchQuery}
              />

              <div className="border-b border-slate-200 pb-6">
                <h3 className="text-xl font-bold">
                  Building Facts
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Leave a field blank when the information
                  is unknown.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <NumberField
                    name="num_units"
                    label="Total Units"
                    value={selectedDevelopment.num_units}
                  />

                  <NumberField
                    name="num_buildings"
                    label="Number of Buildings"
                    value={selectedDevelopment.num_buildings}
                  />

                  <NumberField
                    name="floors"
                    label="Floors"
                    value={selectedDevelopment.floors}
                  />

                  <NumberField
                    name="completion_year"
                    label="Completion Year"
                    value={selectedDevelopment.completion_year}
                    min={1800}
                    max={2100}
                  />

                  <label className={labelClass}>
                    Developer
                    <input
                      type="text"
                      name="developer"
                      defaultValue={
                        selectedDevelopment.developer ?? ""
                      }
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>

              <div className="py-6">
                <h3 className="text-xl font-bold">
                  Original Bedroom Distribution
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the original as-built unit counts,
                  not current MLS inventory. Blank means
                  unknown; zero means confirmed none.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                  <NumberField
                    name="units_studio"
                    label="Studios"
                    value={selectedDevelopment.units_studio}
                  />

                  <NumberField
                    name="units_1br"
                    label="1 Bedroom"
                    value={selectedDevelopment.units_1br}
                  />

                  <NumberField
                    name="units_2br"
                    label="2 Bedrooms"
                    value={selectedDevelopment.units_2br}
                  />

                  <NumberField
                    name="units_3br"
                    label="3 Bedrooms"
                    value={selectedDevelopment.units_3br}
                  />

                  <NumberField
                    name="units_4br_plus"
                    label="4+ Bedrooms"
                    value={selectedDevelopment.units_4br_plus}
                  />
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <label className={labelClass}>
                    Unit Distribution Source
                    <input
                      type="text"
                      name="unit_mix_source"
                      defaultValue={
                        selectedDevelopment.unit_mix_source ?? ""
                      }
                      placeholder="Developer brochure, floor plans, etc."
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Unit Distribution Notes
                    <textarea
                      name="unit_mix_notes"
                      defaultValue={
                        selectedDevelopment.unit_mix_notes ?? ""
                      }
                      rows={3}
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                <p className="max-w-2xl text-sm text-slate-500">
                  Saving updates this development's database
                  record. Published information may change
                  on the public website.
                </p>

                <button
                  type="submit"
                  className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800"
                >
                  Save Building Facts
                </button>
              </div>
            </form>
            <div
              id="development-content"
              className="mt-10 scroll-mt-6 border-t border-slate-200 pt-8"
            >
              <h3 className="text-xl font-bold">
                Descriptions &amp; Content
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Edit the written content for this development.
                Existing information is loaded automatically.
                Saving this section will not change Building Facts
                or other profile settings.
              </p>

              {params.content_saved === "1" && (
                <div
                  role="status"
                  className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
                >
                  Development content saved successfully.
                </div>
              )}

              <form action={saveDevelopmentContent} className="mt-6">
                <input
                  type="hidden"
                  name="development_profile_id"
                  value={selectedDevelopment.development_profile_id}
                />

                <input
                  type="hidden"
                  name="return_q"
                  value={searchQuery}
                />

                <div className="grid gap-6">
                  {(
                    [
                      ["description", "General Description"],
                      ["overview", "Overview"],
                      ["building_facts", "Building Facts Narrative"],
                      ["location_description", "Location Description"],
                      ["lifestyle", "Lifestyle"],
                      ["searchpv_insights", "SearchPV Insights"],
                      ["buyer_notes", "Buyer Notes"],
                      ["investor_notes", "Investor Notes"],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className={labelClass}>
                      {label}
                      <textarea
                        name={field}
                        defaultValue={selectedDevelopment[field] ?? ""}
                        rows={5}
                        className={inputClass}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                  <p className="max-w-2xl text-sm text-slate-500">
                    Saving updates only these eight content fields.
                    Changes to published profiles may appear on
                    the public website.
                  </p>

                  <button
                    type="submit"
                    className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800"
                  >
                    Save Descriptions &amp; Content
                  </button>
                </div>
              </form>
            </div>
            <div
              id="development-amenities"
              className="mt-10 scroll-mt-6 border-t border-slate-200 pt-8"
            >
              <h3 className="text-xl font-bold">
                Amenities &amp; Policies
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Select Yes, No, or Unknown for each amenity.
                Unknown means the information has not been confirmed.
                Saving this section will not change other profile fields.
              </p>

              {params.amenities_saved === "1" && (
                <div
                  role="status"
                  className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
                >
                  Amenities and policies saved successfully.
                </div>
              )}

              <form action={saveDevelopmentAmenities} className="mt-6">
                <input
                  type="hidden"
                  name="development_profile_id"
                  value={selectedDevelopment.development_profile_id}
                />

                <input
                  type="hidden"
                  name="return_q"
                  value={searchQuery}
                />

                <h4 className="text-base font-semibold">
                  Building Amenities
                </h4>

                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    [
                      ["has_pool", "Swimming Pool"],
                      ["has_gym", "Gym / Fitness Center"],
                      ["has_security", "Security"],
                      ["has_elevator", "Elevator"],
                      ["has_parking", "Parking Available"],
                      ["has_rooftop", "Rooftop"],
                      ["has_jacuzzi", "Jacuzzi / Hot Tub"],
                      ["has_bbq", "BBQ Area"],
                      ["has_concierge", "Concierge"],
                      ["has_coworking", "Coworking Space"],
                      ["has_steam_room", "Steam Room"],
                      ["has_sauna", "Sauna"],
                      ["has_spa", "Spa"],
                      ["has_storage", "Storage"],
                      ["has_lockoff_units", "Lock-Off Units"],
                      ["has_lobby", "Lobby"],
                      ["has_restaurant_retail", "Restaurant / Retail"],
                    ] as const
                  ).map(([field, label]) => {
                    const value = selectedDevelopment[field];

                    return (
                      <label key={field} className={labelClass}>
                        {label}
                        <select
                          name={field}
                          defaultValue={
                            value === true
                              ? "yes"
                              : value === false
                                ? "no"
                                : "unknown"
                          }
                          className={inputClass}
                        >
                          <option value="unknown">Unknown</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </label>
                    );
                  })}
                </div>

                <h4 className="mt-8 text-base font-semibold">
                  Building Policies &amp; Notes
                </h4>

                <div className="mt-4 grid gap-6">
                  {(
                    [
                      ["pet_policy", "Pet Policy"],
                      ["rental_policy", "Rental Policy"],
                      ["parking", "Parking Details"],
                      ["hoa_notes", "HOA Notes"],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className={labelClass}>
                      {label}
                      <textarea
                        name={field}
                        defaultValue={selectedDevelopment[field] ?? ""}
                        rows={3}
                        className={inputClass}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                  <p className="max-w-2xl text-sm text-slate-500">
                    Saving updates only amenities and policies.
                    Changes to published profiles may appear on
                    the public website.
                  </p>

                  <button
                    type="submit"
                    className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800"
                  >
                    Save Amenities &amp; Policies
                  </button>
                </div>
              </form>
            </div>
            <div
              id="development-details"
              className="mt-10 scroll-mt-6 border-t border-slate-200 pt-8"
            >
              <h3 className="text-xl font-bold">
                Location &amp; Development Details
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Maintain the development's identity, location, and
                construction details. Existing values are loaded
                automatically. Saving does not change other sections.
              </p>

              {params.details_saved === "1" && (
                <div
                  role="status"
                  className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
                >
                  Location and development details saved successfully.
                </div>
              )}

              <form action={saveDevelopmentDetails} className="mt-6">
                <input
                  type="hidden"
                  name="development_profile_id"
                  value={selectedDevelopment.development_profile_id}
                />

                <input
                  type="hidden"
                  name="return_q"
                  value={searchQuery}
                />

                <h4 className="text-base font-semibold">
                  Development Identity
                </h4>

                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  {(
                    [
                      ["official_name", "Official Development Name"],
                      ["profile_title", "Profile Title"],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className={labelClass}>
                      {label}
                      <input
                        type="text"
                        name={field}
                        defaultValue={selectedDevelopment[field] ?? ""}
                        className={inputClass}
                      />
                    </label>
                  ))}
                </div>

                <h4 className="mt-8 text-base font-semibold">
                  Address &amp; Location
                </h4>

                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  {(
                    [
                      ["address", "Street Address"],
                      ["cross_streets", "Cross Streets"],
                      ["neighborhood_label", "Neighborhood"],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className={labelClass}>
                      {label}
                      <input
                        type="text"
                        name={field}
                        defaultValue={selectedDevelopment[field] ?? ""}
                        className={inputClass}
                      />
                    </label>
                  ))}

                  <label className={labelClass}>
                    Latitude
                    <input
                      type="number"
                      name="latitude"
                      min={-90}
                      max={90}
                      step="any"
                      defaultValue={selectedDevelopment.latitude ?? ""}
                      placeholder="20.600000"
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Longitude
                    <input
                      type="number"
                      name="longitude"
                      min={-180}
                      max={180}
                      step="any"
                      defaultValue={selectedDevelopment.longitude ?? ""}
                      placeholder="-105.230000"
                      className={inputClass}
                    />
                  </label>
                </div>

                <h4 className="mt-8 text-base font-semibold">
                  Construction Details
                </h4>

                <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <NumberField
                    name="year_built"
                    label="Year Built"
                    value={selectedDevelopment.year_built}
                    min={1800}
                    max={2100}
                  />

                  <NumberField
                    name="stories"
                    label="Stories"
                    value={selectedDevelopment.stories}
                  />

                  <NumberField
                    name="residences"
                    label="Residences"
                    value={selectedDevelopment.residences}
                  />

                  {(
                    [
                      ["completion_status", "Completion Status"],
                      ["construction_type", "Construction Type"],
                      ["architect", "Architect"],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className={labelClass}>
                      {label}
                      <input
                        type="text"
                        name={field}
                        defaultValue={selectedDevelopment[field] ?? ""}
                        className={inputClass}
                      />
                    </label>
                  ))}
                </div>

                <h4 className="mt-8 text-base font-semibold">
                  Surroundings &amp; Accessibility
                </h4>

                <div className="mt-4 grid gap-6">
                  {(
                    [
                      ["beach_access", "Beach Access"],
                      ["walkability_notes", "Walkability Notes"],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className={labelClass}>
                      {label}
                      <textarea
                        name={field}
                        defaultValue={selectedDevelopment[field] ?? ""}
                        rows={3}
                        className={inputClass}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                  <p className="max-w-2xl text-sm text-slate-500">
                    Saving updates only these 15 development detail
                    fields. Published information may change on
                    the public website.
                  </p>

                  <button
                    type="submit"
                    className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800"
                  >
                    Save Location &amp; Details
                  </button>
                </div>
              </form>
            </div>
            <div
              id="development-nearby"
              className="mt-10 scroll-mt-6 border-t border-slate-200 pt-8"
            >
              <h3 className="text-xl font-bold">
                Nearby Attractions &amp; Neighborhood
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Maintain information about nearby attractions and
                conveniences. Blank numeric fields mean unknown;
                zero means a confirmed count of zero.
              </p>

              {params.nearby_saved === "1" && (
                <div
                  role="status"
                  className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
                >
                  Nearby attractions saved successfully.
                </div>
              )}

              <form action={saveDevelopmentNearby} className="mt-6">
                <input
                  type="hidden"
                  name="development_profile_id"
                  value={selectedDevelopment.development_profile_id}
                />

                <input
                  type="hidden"
                  name="return_q"
                  value={searchQuery}
                />

                <label className={labelClass}>
                  Nearby Attractions Summary
                  <textarea
                    name="nearby_summary"
                    defaultValue={selectedDevelopment.nearby_summary ?? ""}
                    rows={4}
                    className={inputClass}
                  />
                </label>

                <h4 className="mt-8 text-base font-semibold">
                  Nearby Establishments
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Enter confirmed counts when available.
                  Leave blank when unknown.
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <NumberField
                    name="nearby_restaurants_count"
                    label="Restaurants"
                    value={selectedDevelopment.nearby_restaurants_count}
                  />

                  <NumberField
                    name="nearby_bars_count"
                    label="Bars"
                    value={selectedDevelopment.nearby_bars_count}
                  />

                  <NumberField
                    name="nearby_galleries_count"
                    label="Art Galleries"
                    value={selectedDevelopment.nearby_galleries_count}
                  />

                  <NumberField
                    name="nearby_cafes_count"
                    label="Cafés"
                    value={selectedDevelopment.nearby_cafes_count}
                  />
                </div>

                <h4 className="mt-8 text-base font-semibold">
                  Walking Times
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Estimated walking time in minutes.
                  Leave blank when unknown.
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <NumberField
                    name="nearby_beach_minutes"
                    label="Minutes to Beach"
                    value={selectedDevelopment.nearby_beach_minutes}
                  />

                  <NumberField
                    name="nearby_grocery_minutes"
                    label="Minutes to Grocery Shopping"
                    value={selectedDevelopment.nearby_grocery_minutes}
                  />
                </div>

                <label className={`${labelClass} mt-8`}>
                  Additional Neighborhood Notes
                  <textarea
                    name="nearby_notes"
                    defaultValue={selectedDevelopment.nearby_notes ?? ""}
                    rows={4}
                    className={inputClass}
                  />
                </label>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                  <p className="max-w-2xl text-sm text-slate-500">
                    Saving updates only the eight Nearby Attractions
                    fields. Other development information remains unchanged.
                  </p>

                  <button
                    type="submit"
                    className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800"
                  >
                    Save Nearby Attractions
                  </button>
                </div>
              </form>
            </div>
            <div
              id="development-seo"
              className="mt-10 scroll-mt-6 border-t border-slate-200 pt-8"
            >
              <h3 className="text-xl font-bold">
                SEO &amp; Metadata
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Manage search engine metadata and source references.
                Saving this section does not change publication status.
              </p>

              {params.seo_saved === "1" && (
                <div
                  role="status"
                  className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
                >
                  SEO and metadata saved successfully.
                </div>
              )}

              <form action={saveDevelopmentSeo} className="mt-6">
                <input
                  type="hidden"
                  name="development_profile_id"
                  value={selectedDevelopment.development_profile_id}
                />

                <input
                  type="hidden"
                  name="return_q"
                  value={searchQuery}
                />

                <div className="grid gap-6">
                  <label className={labelClass}>
                    SEO Title
                    <input
                      type="text"
                      name="seo_title"
                      defaultValue={selectedDevelopment.seo_title ?? ""}
                      maxLength={255}
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Aim for approximately 50–60 characters, but prioritize
                      a clear, accurate title.
                    </span>
                  </label>

                  <label className={labelClass}>
                    SEO Description
                    <textarea
                      name="seo_description"
                      defaultValue={selectedDevelopment.seo_description ?? ""}
                      rows={3}
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Aim for approximately 140–160 characters.
                      Search engines may display a different snippet.
                    </span>
                  </label>

                  <label className={labelClass}>
                    SEO Keywords
                    <textarea
                      name="seo_keywords"
                      defaultValue={selectedDevelopment.seo_keywords ?? ""}
                      rows={2}
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      For internal reference. Google does not use the
                      meta keywords tag for search ranking.
                    </span>
                  </label>

                  <label className={labelClass}>
                    Meta Description (Additional / Legacy)
                    <textarea
                      name="meta_description"
                      defaultValue={selectedDevelopment.meta_description ?? ""}
                      rows={3}
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Separate existing database field. We'll verify
                      how the public pages use it before consolidating.
                    </span>
                  </label>

                  <label className={labelClass}>
                    Official Development Website
                    <input
                      type="url"
                      name="website"
                      defaultValue={selectedDevelopment.website ?? ""}
                      placeholder="https://example.com"
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Source URLs
                    <textarea
                      name="source_urls"
                      defaultValue={
                        Array.isArray(selectedDevelopment.source_urls)
                          ? selectedDevelopment.source_urls.join("\n")
                          : ""
                      }
                      rows={5}
                      placeholder={
                        "https://example.com/development\n" +
                        "https://example.com/floorplans"
                      }
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Enter one complete URL per line. These references
                      help document where development information originated.
                    </span>
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                  <p className="max-w-2xl text-sm text-slate-500">
                    Saving updates only SEO metadata, the official
                    website, and source URLs. Publishing settings
                    remain unchanged.
                  </p>

                  <button
                    type="submit"
                    className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800"
                  >
                    Save SEO &amp; Metadata
                  </button>
                </div>
              </form>
            </div>
            <div
              id="development-review"
              className="mt-10 scroll-mt-6 border-t border-slate-200 pt-8"
            >
              <h3 className="text-xl font-bold">
                Review Settings
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Manage internal review information and development priority.
                Saving this section does not change publication status.
              </p>

              {params.review_saved === "1" && (
                <div
                  role="status"
                  className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
                >
                  Review settings saved successfully.
                </div>
              )}

              <form action={saveDevelopmentReview} className="mt-6">
                <input
                  type="hidden"
                  name="development_profile_id"
                  value={selectedDevelopment.development_profile_id}
                />

                <input
                  type="hidden"
                  name="return_q"
                  value={searchQuery}
                />

                <div className="grid gap-6">
                  <label className={labelClass}>
                    Profile Priority
                    <select
                      name="profile_priority"
                      defaultValue={String(
                        selectedDevelopment.profile_priority ?? 3
                      )}
                      required
                      className={inputClass}
                    >
                      <option value="1">1 — High Priority</option>
                      <option value="2">2 — Medium Priority</option>
                      <option value="3">3 — Standard Priority</option>
                    </select>
                    <span className="mt-1 block text-xs text-slate-500">
                      Controls internal development profiling priority.
                      This does not automatically publish a development.
                    </span>
                  </label>

                  <label className={labelClass}>
                    Priority Reason
                    <textarea
                      name="priority_reason"
                      defaultValue={
                        selectedDevelopment.priority_reason ?? ""
                      }
                      rows={2}
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Internal Notes
                    <textarea
                      name="notes"
                      defaultValue={selectedDevelopment.notes ?? ""}
                      rows={5}
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Internal working notes about this development.
                    </span>
                  </label>

                  <label className={labelClass}>
                    Source Notes
                    <textarea
                      name="source_notes"
                      defaultValue={
                        selectedDevelopment.source_notes ?? ""
                      }
                      rows={4}
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Record source reliability, verification details,
                      or information that still needs confirmation.
                    </span>
                  </label>

                  <label className={labelClass}>
                    Reviewed By
                    <input
                      type="text"
                      name="reviewed_by"
                      defaultValue={
                        selectedDevelopment.reviewed_by ?? ""
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    Last Reviewed
                    <input
                      type="date"
                      name="last_reviewed"
                      defaultValue={
                        selectedDevelopment.last_reviewed
                          ? String(
                              selectedDevelopment.last_reviewed
                            ).slice(0, 10)
                          : ""
                      }
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Date the development information was last reviewed.
                      This does not mark the development as published.
                    </span>
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                  <p className="max-w-2xl text-sm text-slate-500">
                    Saving updates only review information, internal
                    notes, and profile priority. Publication settings
                    remain unchanged.
                  </p>

                  <button
                    type="submit"
                    className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800"
                  >
                    Save Review Settings
                  </button>
                </div>
              </form>
            </div>
            {/* Development Photos */}
            <div
              id="development-photos"
              className="mt-10 scroll-mt-6 border-t border-slate-200 pt-8"
            >
              <h2 className="text-xl font-bold text-slate-900">
                Development Photos
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Manage development photographs, captions,
                display order, and the primary image.
              </p>

              <DevelopmentPhotoUploader
                developmentId={selectedDevelopment.development_profile_id}
              />

              {photos.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No photos have been uploaded for this development.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.development_photo_id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <img
                        src={supabase.storage
                          .from("development-photos")
                          .getPublicUrl(photo.storage_path).data.publicUrl}
                        alt={photo.alt_text || photo.caption || "Development photo"}
                        className="mb-3 block h-auto max-w-full rounded-lg"
                      />

                      <form action={updateDevelopmentPhoto} className="mt-4 space-y-3">
                        <input
                          type="hidden"
                          name="development_photo_id"
                          value={photo.development_photo_id}
                        />

                        <input
                          type="hidden"
                          name="development_profile_id"
                          value={selectedDevelopment.development_profile_id}
                        />

                        <input
                          type="hidden"
                          name="return_q"
                          value={searchQuery}
                        />

                        <div>
                          <label className="block text-sm font-semibold">
                            Caption
                          </label>
                          <input
                            type="text"
                            name="caption"
                            defaultValue={photo.caption ?? ""}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold">
                            Alt Text
                          </label>
                          <input
                            type="text"
                            name="alt_text"
                            defaultValue={photo.alt_text ?? ""}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <button
                          type="submit"
                          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                        >
                          Save Photo Details
                        </button>
                      </form>

                      <p className="text-sm font-semibold">
                        {photo.caption || "Untitled photo"}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Order: {photo.display_order}
                        {photo.is_primary ? " | Primary" : ""}
                      </p>
                      {!photo.is_primary && (
                        <form
                          action={setPrimaryDevelopmentPhoto}
                          className="mt-3"
                        >
                          <input
                            type="hidden"
                            name="development_photo_id"
                            value={photo.development_photo_id}
                          />

                          <input
                            type="hidden"
                            name="development_profile_id"
                            value={selectedDevelopment.development_profile_id}
                          />

                          <input
                            type="hidden"
                            name="return_q"
                            value={searchQuery}
                          />

                          <button
                            type="submit"
                            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                          >
                            Set as Primary
                          </button>
                        </form>
                      )}
                      <form action={moveDevelopmentPhoto} className="mt-3 flex gap-2">
                      <input
                        type="hidden"
                        name="development_photo_id"
                        value={photo.development_photo_id}
                      />

                      <input
                        type="hidden"
                        name="development_profile_id"
                        value={selectedDevelopment.development_profile_id}
                      />

                      <input
                        type="hidden"
                        name="return_q"
                        value={searchQuery}
                      />

                      <button
                        type="submit"
                        name="direction"
                        value="left"
                        className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        ← Move Left
                      </button>

                      <button
                        type="submit"
                        name="direction"
                        value="right"
                        className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Move Right →
                      </button>
                    </form>
                    <form action={deleteDevelopmentPhoto} className="mt-4">
                      <input
                        type="hidden"
                        name="development_photo_id"
                        value={photo.development_photo_id}
                      />

                      <input
                        type="hidden"
                        name="development_profile_id"
                        value={selectedDevelopment.development_profile_id}
                      />

                      <input
                        type="hidden"
                        name="return_q"
                        value={searchQuery}
                      />

                      <DeletePhotoButton />
                    </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              id="development-publication"
              className="mt-10 scroll-mt-6 border-t border-slate-200 pt-8"
            >
              <h3 className="text-xl font-bold">
                Publication Controls
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Control whether this development's editorial profile
                is publicly available. Publishing does not affect
                the underlying MLS market statistics.
              </p>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-600">
                  Current Publication Status
                </p>

                <p className="mt-2 text-lg font-bold">
                  {selectedDevelopment.is_published
                    ? "Published"
                    : selectedDevelopment.is_profiled &&
                        selectedDevelopment.profile_status === "profiled" &&
                        selectedDevelopment.content_status === "complete"
                      ? "Ready for Publication"
                      : "Draft"}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedDevelopment.is_published
                    ? "This development profile is publicly accessible."
                    : "This development profile is not publicly accessible."}
                </p>
              </div>

              {params.publication_saved && (
                <div
                  role="status"
                  className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
                >
                  {params.publication_saved === "mark_ready"
                    ? "Development marked Ready for Publication."
                    : params.publication_saved === "publish"
                      ? "Development published successfully."
                      : params.publication_saved === "unpublish"
                        ? "Development unpublished successfully."
                        : ""}
                </div>
              )}

              <form
                action={setDevelopmentPublication}
                className="mt-6"
              >
                <input
                  type="hidden"
                  name="development_profile_id"
                  value={selectedDevelopment.development_profile_id}
                />

                <input
                  type="hidden"
                  name="return_q"
                  value={searchQuery}
                />

                {!selectedDevelopment.is_published &&
                !(
                  selectedDevelopment.is_profiled &&
                  selectedDevelopment.profile_status === "profiled" &&
                  selectedDevelopment.content_status === "complete"
                ) ? (
                  <button
                    type="submit"
                    name="publication_action"
                    value="mark_ready"
                    className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800"
                  >
                    Mark Ready for Publication
                  </button>
                ) : selectedDevelopment.is_published ? (
                  <PublicationButton action="unpublish" />
                ) : (
                  <PublicationButton action="publish" />
                )}
              </form>

              <p className="mt-5 text-xs text-slate-500">
                Unpublishing retains all development content and
                returns the profile to Ready for Publication.
              </p>
            </div>
          </section>
        )}

        <div className="mt-6">
          <Link
            href="/office"
            className="text-sm font-semibold text-sky-700 hover:underline"
          >
            Back to Office
          </Link>
        </div>
      </section>
    </main>
  );
}
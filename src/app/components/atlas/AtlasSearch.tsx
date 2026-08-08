"use client";

import { useEffect, useState } from "react";
import { useAtlasState } from "@/lib/atlas/state/AtlasState";

type AtlasSearchCandidate = {
  entityKey: number;
  entityType: string;
  canonicalName: string;
  matchedVariant: string | null;
  identifier: string;
  confidence: number;
  hierarchy?: {
    zone?: {
      entityKey: number;
      identifier: string;
      name: string;
    };
    area?: {
      entityKey: number;
      identifier: string;
      name: string;
    };
    community?: {
      entityKey: number;
      identifier: string;
      name: string;
    };
  };
};

export default function AtlasSearch() {
  const { selectEntity } = useAtlasState();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AtlasSearchCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/atlas/search?q=${encodeURIComponent(trimmed)}`
        );

        const data = await response.json();

        setResults(data.candidates ?? []);
      } catch (error) {
        console.error("Atlas search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            borderRadius: 18,
            padding: "14px 16px",
            boxShadow: "0 8px 30px rgba(15,23,42,0.14)",
            backdropFilter: "blur(14px)",
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search places, communities, developments…"
            style={{
              width: "100%",
              border: 0,
              outline: "none",
              background: "transparent",
              color: "#0f172a",
              fontSize: 14,
            }}
          />
        </div>

        {(loading || results.length > 0) && (
          <div
            style={{
              marginTop: 8,
              overflow: "hidden",
              borderRadius: 18,
              background: "rgba(255,255,255,0.96)",
              boxShadow: "0 12px 35px rgba(15,23,42,0.16)",
              backdropFilter: "blur(16px)",
            }}
          >
            {loading && (
              <div
                style={{
                  padding: "12px 16px",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                Searching…
              </div>
            )}

            {!loading &&
              results.map((candidate) => {
                const hierarchyText = [
                  candidate.hierarchy?.zone?.name,
                  candidate.hierarchy?.area?.name,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <button
                    key={candidate.entityKey}
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `/api/atlas/entity/${candidate.entityKey}`
                        );

                        if (!response.ok) {
                          throw new Error("Unable to load entity details.");
                        }

                        const detail = await response.json();

                        const zonaRomanticaDisplayName =
                          detail.variants?.find(
                            (variant: {
                              language_cd: string;
                              variant_type_cd: string;
                              entity_variant_nm: string;
                            }) =>
                              variant.language_cd === "ES" &&
                              variant.variant_type_cd === "CO"
                          )?.entity_variant_nm;

                        selectEntity({
                          entityKy: detail.entity.entity_ky,
                          entityType: detail.entity.entity_type_cd,
                          canonicalName:
                            detail.canonical?.entity_variant_nm ??
                            candidate.canonicalName,
                          displayName:
                            zonaRomanticaDisplayName ??
                            candidate.matchedVariant ??
                            detail.canonical?.entity_variant_nm ??
                            candidate.canonicalName,
                          longitude: detail.entity.longitude_nb,
                          latitude: detail.entity.latitude_nb,
                          parentName: detail.parent?.canonical_nm,
                          boundary: detail.boundary ?? null,
                        });

                        setQuery("");
                        setResults([]);
                      } catch (error) {
                        console.error("Atlas entity selection failed:", error);
                      }
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      border: 0,
                      borderBottom: "1px solid #e2e8f0",
                      background: "transparent",
                      padding: "12px 16px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 650,
                        color: "#0f172a",
                      }}
                    >
                      {candidate.matchedVariant ?? candidate.canonicalName}
                    </div>

                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      {candidate.canonicalName}
                      {hierarchyText ? ` · ${hierarchyText}` : ""}
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
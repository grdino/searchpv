"use client";

import { useEffect, useState } from "react";

type Photo = {
  development_photo_id: number;
  storage_path: string;
  alt_text: string | null;
  caption: string | null;
};

export default function DevelopmentPhotoGallery({
  photos,
  developmentName,
}: {
  photos: Photo[];
  developmentName: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
  } | null>(null);

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (!touchStart || selected === null) return;

    const deltaX = event.changedTouches[0].clientX - touchStart.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.y;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      setSelected((current) =>
        current === null
          ? null
          : (current + (deltaX < 0 ? 1 : photos.length - 1)) % photos.length
      );
    }

    setTouchStart(null);
  }

  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/development-photos/`;

  useEffect(() => {
    if (selected === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowRight")
        setSelected((current) =>
          current === null ? null : (current + 1) % photos.length
        );
      if (event.key === "ArrowLeft")
        setSelected((current) =>
          current === null
            ? null
            : (current - 1 + photos.length) % photos.length
        );
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, photos.length]);

  function photoImage(index: number, className: string) {
    const photo = photos[index];

    return (
      <button
        key={photo.development_photo_id}
        type="button"
        onClick={() => setSelected(index)}
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100"
        aria-label={`Enlarge photo ${index + 1}`}
      >
        <img
          src={`${baseUrl}${photo.storage_path}`}
          alt={photo.alt_text || `${developmentName} photo ${index + 1}`}
          className={className}
        />
      </button>
    );
  }

  if (photos.length === 0) return null;

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-8 md:px-8">
        <div
          className={`grid gap-3 ${
            photos.length === 1
              ? "grid-cols-1"
              : "grid-cols-1 md:grid-cols-2"
          }`}
        >
          {photoImage(0, "max-h-[600px] w-full object-contain")}

          {photos.length > 1 && (
            <div
              className={
                photos.length === 2
                  ? "overflow-hidden rounded-xl"
                  : "grid grid-rows-2 gap-3"
              }
            >
              {photos.slice(1, 3).map((photo, offset) => (
                <div key={photo.development_photo_id} className="min-h-0">
                  {photoImage(
                    offset + 1,
                    photos.length === 2
                      ? "max-h-[600px] w-full object-contain"
                      : "max-h-[294px] w-full object-contain"
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {photos.length > 3 && (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {photos.slice(3).map((photo, offset) => (
              <div key={photo.development_photo_id}>
                {photoImage(
                  offset + 3,
                  "max-h-[250px] w-full object-contain"
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {selected !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Development photo viewer"
          onTouchStart={(event) =>
            setTouchStart({
              x: event.touches[0].clientX,
              y: event.touches[0].clientY,
            })
          }
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-5 top-5 z-10 rounded-full bg-white/20 px-4 py-2 text-xl text-white"
            aria-label="Close photo viewer"
          >
            ✕
          </button>

          <div className="absolute left-5 top-6 text-sm text-white">
            {selected + 1} / {photos.length}
          </div>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setSelected((selected - 1 + photos.length) % photos.length)
                }
                className="absolute left-3 z-10 rounded-full bg-white/20 px-4 py-3 text-2xl text-white"
                aria-label="Previous photo"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() => setSelected((selected + 1) % photos.length)}
                className="absolute right-3 z-10 rounded-full bg-white/20 px-4 py-3 text-2xl text-white"
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          )}

          <div className="flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3">
            <img
              src={`${baseUrl}${photos[selected].storage_path}`}
              alt={
                photos[selected].alt_text ||
                `${developmentName} photo ${selected + 1}`
              }
              className="max-h-[80vh] max-w-full object-contain"
            />

            {photos[selected].caption && (
              <p className="text-center text-sm text-white">
                {photos[selected].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
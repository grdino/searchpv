"use client";

export default function DeletePhotoButton() {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (
          !window.confirm(
            "Permanently delete this photo? This cannot be undone.",
          )
        ) {
          event.preventDefault();
        }
      }}
      className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
    >
      Delete Photo
    </button>
  );
}
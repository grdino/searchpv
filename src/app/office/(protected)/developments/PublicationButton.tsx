"use client";

type PublicationButtonProps = {
  action: "publish" | "unpublish";
};

export default function PublicationButton({
  action,
}: PublicationButtonProps) {
  const isPublishing = action === "publish";

  return (
    <button
      type="submit"
      name="publication_action"
      value={action}
      onClick={(event) => {
        const message = isPublishing
          ? "Publish this development profile? Its content will become publicly accessible."
          : "Unpublish this development profile? Its content will no longer be publicly accessible.";

        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      className={
        isPublishing
          ? "rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
          : "rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-700"
      }
    >
      {isPublishing
        ? "Publish Development"
        : "Unpublish Development"}
    </button>
  );
}
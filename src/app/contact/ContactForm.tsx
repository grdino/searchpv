"use client";

import { useState } from "react";

export default function ContactForm({
  community,
  defaultMessage,
}: {
  community: string;
  defaultMessage: string;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSending(true);

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        community,
        name: formData.get("name"),
        contact: formData.get("contact"),
        message: formData.get("message"),
      }),
    });

    setSending(false);

    if (response.ok) {
      setSent(true);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <input
        name="name"
        placeholder="Your name"
        required
      />

      <input
        name="contact"
        placeholder="Email or WhatsApp"
        required
      />

      <textarea
        name="message"
        rows={11}
        defaultValue={defaultMessage}
      />

      <button
        type="submit"
        disabled={sending}
        style={{
          alignSelf: "center",
          background: "#0f172a",
          color: "#fff",
          border: "1px solid #0f172a",
          borderRadius: "9999px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: sending ? "default" : "pointer",
        }}
      >
        {sending ? "Sending..." : "Send Request"}
      </button>

      {sent && (
        <p>
          Thank you. Your request has been sent.
        </p>
      )}
    </form>
  );
}
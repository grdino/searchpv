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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <strong>Your Name:</strong>

        <input
          name="name"
          required
          autoFocus
          style={{
            flex: 1,
            minWidth: "250px",
            padding: "10px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            backgroundColor: "#f8fafc",
            fontSize: "14px",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <strong>Email or WhatsApp:</strong>

        <input
          name="contact"
          required
          style={{
            flex: 1,
            minWidth: "250px",
            padding: "10px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            backgroundColor: "#f8fafc",
            fontSize: "14px",
          }}
        />
      </div>

      <div>
        <strong>Message:</strong>
      </div>

      <textarea
        name="message"
        rows={11}
        defaultValue={defaultMessage}
        style={{
          width: "100%",
          padding: "12px",
          border: "1px solid #cbd5e1",
          borderRadius: "6px",
          backgroundColor: "#f8fafc",
          fontSize: "14px",
          lineHeight: "1.5",
          boxSizing: "border-box",
        }}
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
        <p
          style={{
            textAlign: "center",
            color: "#166534",
            fontWeight: 600,
          }}
        >
          Thank you. We will contact you shortly with the information you requested.
        </p>
      )}
    </form>
  );
}
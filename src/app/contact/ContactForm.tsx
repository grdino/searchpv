"use client";

import { useState } from "react";

type ReplyMethod = "email" | "whatsapp" | "phone";

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [replyMethod, setReplyMethod] = useState<ReplyMethod>("email");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    setSending(true);
    setSent(false);
    setError(false);

    const formData = new FormData(form);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        whatsapp: formData.get("whatsapp"),
        message: formData.get("message"),
        replyMethod,
      }),
    });

    setSending(false);

    if (response.ok) {
      setSent(true);
      form.reset();
      setReplyMethod("email");
    } else {
      setError(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <Field label="Name" name="name" required />

      <fieldset>
        <legend className="text-sm font-bold text-slate-800">
          How should we reply?
        </legend>
        <p className="mt-1 text-sm text-slate-500">
          Choose whichever is easiest for you.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <ReplyChoice
            label="Email"
            value="email"
            selected={replyMethod === "email"}
            onChange={setReplyMethod}
          />
          <ReplyChoice
            label="WhatsApp"
            value="whatsapp"
            selected={replyMethod === "whatsapp"}
            onChange={setReplyMethod}
          />
          <ReplyChoice
            label="Phone"
            value="phone"
            selected={replyMethod === "phone"}
            onChange={setReplyMethod}
          />
        </div>
      </fieldset>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Email"
          name="email"
          type="email"
          required={replyMethod === "email"}
          optional={replyMethod !== "email"}
          placeholder="you@example.com"
        />
        <Field
          label="WhatsApp"
          name="whatsapp"
          type="tel"
          required={replyMethod === "whatsapp"}
          optional={replyMethod !== "whatsapp"}
          placeholder="WhatsApp number"
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          required={replyMethod === "phone"}
          optional={replyMethod !== "phone"}
          placeholder="Phone number"
        />
      </div>

      <label className="block">
        <span className="text-sm font-bold text-slate-800">
          What can we help with? *
        </span>
        <textarea
          name="message"
          rows={7}
          required
          placeholder="Ask us anything..."
          className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base leading-6 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
        />
      </label>

      <div>
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {sending ? "Sending..." : "Send Message →"}
        </button>

        <p className="mt-3 text-sm text-slate-500">
          No registration. No mailing list. Just a reply to your question.
        </p>
      </div>

      {sent && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          Thanks — your message has been sent. We&apos;ll reply using the contact method you selected.
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          We couldn&apos;t send your message. Please try again.
        </p>
      )}
    </form>
  );
}

function ReplyChoice({
  label,
  value,
  selected,
  onChange,
}: {
  label: string;
  value: ReplyMethod;
  selected: boolean;
  onChange: (value: ReplyMethod) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition ${
        selected
          ? "border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-100"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
      }`}
    >
      <input
        type="radio"
        name="replyMethod"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        className="h-4 w-4 accent-sky-600"
      />
      {label}
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  optional = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">
        {label}
        {required ? " *" : ""}
        {optional ? (
          <span className="ml-1 font-normal text-slate-400">(optional)</span>
        ) : null}
      </span>

      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
}

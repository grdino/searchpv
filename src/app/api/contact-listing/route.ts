import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const resend = new Resend(apiKey);
    const formData = await request.formData();

    // Honeypot — real users should never fill this in.
    // Silently redirect bots to the normal thank-you page.
    const website = String(formData.get("website") ?? "").trim();

    if (website) {
      return NextResponse.redirect(
        new URL("/contact-listing/thanks", request.url),
        303,
      );
    }

    const name = String(formData.get("name") ?? "")
      .replace(/[\r\n]/g, " ")
      .trim();

    const contact = String(formData.get("contact") ?? "")
      .replace(/[\r\n]/g, " ")
      .trim();

    const mls = String(formData.get("mls") ?? "")
      .replace(/[\r\n]/g, " ")
      .trim();

    const message = String(formData.get("message") ?? "").trim();

    // Required fields.
    if (!name || !contact || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, contact information, and message are required.",
        },
        { status: 400 },
      );
    }

    // Limit field sizes.
    if (
      name.length > 100 ||
      contact.length > 254 ||
      mls.length > 50 ||
      message.length > 5000
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid form submission.",
        },
        { status: 400 },
      );
    }

    // Determine whether the contact information is an email address.
    // If so, use it as Reply-To. Otherwise it is treated as a
    // phone/WhatsApp number.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const contactIsEmail = emailPattern.test(contact);

    const { data, error } = await resend.emails.send({
      from: `${name} via SearchPV IDX <contact@searchpv.com>`,
      to: ["gerry@ronmorgan.net"],

      // Reply directly to the visitor when an email was provided.
      ...(contactIsEmail ? { replyTo: contact } : {}),

      subject: mls
        ? `SearchPV Listing Inquiry from ${name} — MLS #${mls}`
        : `SearchPV Listing Inquiry from ${name}`,

      text: `
Name: ${name}
Contact: ${contact}
MLS #: ${mls || "Not specified"}

Message:
${message}
      `.trim(),
    });

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "The email could not be sent.",
        },
        { status: 502 },
      );
    }

    console.log("Listing inquiry sent:", data?.id);

    return NextResponse.redirect(
      new URL("/contact-listing/thanks", request.url),
      303,
    );
  } catch (error) {
    console.error("Listing inquiry error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Message failed to send.",
      },
      { status: 500 },
    );
  }
}
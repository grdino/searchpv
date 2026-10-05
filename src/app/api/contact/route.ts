import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const resend = new Resend(apiKey);
    const body = await request.json();

    // Honeypot — real users should never fill this in.
    // Silently return success so bots don't know they were blocked.
    const website = String(body.website ?? "").trim();

    if (website) {
      return NextResponse.json({
        success: true,
      });
    }

    const name = String(body.name ?? "")
      .replace(/[\r\n]/g, " ")
      .trim();

    const email = String(body.email ?? "")
      .replace(/[\r\n]/g, "")
      .trim();

    const phone = String(body.phone ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim();
    const message = String(body.message ?? "").trim();
    const replyMethod = String(body.replyMethod ?? "email").trim();

    // Name and message are always required.
    if (!name || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and message are required.",
        },
        { status: 400 },
      );
    }

    // Make sure the selected reply method is valid.
    if (!["email", "whatsapp", "phone"].includes(replyMethod)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid reply method.",
        },
        { status: 400 },
      );
    }

    // Require the contact information for the selected reply method.
    if (replyMethod === "email" && !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required when email is the preferred reply method.",
        },
        { status: 400 },
      );
    }

    if (replyMethod === "whatsapp" && !whatsapp) {
      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp number is required when WhatsApp is the preferred reply method.",
        },
        { status: 400 },
      );
    }

    if (replyMethod === "phone" && !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required when phone is the preferred reply method.",
        },
        { status: 400 },
      );
    }

    // Limit field sizes.
    if (
      name.length > 100 ||
      email.length > 254 ||
      phone.length > 50 ||
      whatsapp.length > 50 ||
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

    // Validate email only if one was supplied.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailPattern.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    const { data, error } = await resend.emails.send({
      from: `${name} via SearchPV Contact Form <contact@searchpv.com>`,
      to: ["gerry@ronmorgan.net"],

      // Only add Reply-To when an email address was supplied.
      ...(email ? { replyTo: email } : {}),

      subject: `SearchPV Request from ${name}`,
      text: `
Name: ${name}
Email: ${email || "Not provided"}
Phone: ${phone || "Not provided"}
WhatsApp: ${whatsapp || "Not provided"}
Preferred reply: ${replyMethod}

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

    return NextResponse.json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Message failed to send.",
      },
      { status: 500 },
    );
  }
}
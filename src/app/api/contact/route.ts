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

    const name = String(body.name ?? "")
      .replace(/[\r\n]/g, " ")
      .trim();

    const email = String(body.email ?? "")
      .replace(/[\r\n]/g, "")
      .trim();

    const phone = String(body.phone ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and email are required.",
        },
        { status: 400 },
      );
    }

    const { data, error } = await resend.emails.send({
      from: `${name} via SearchPV Contact Form <contact@searchpv.com>`,
      to: ["gerry@ronmorgan.net"],
      replyTo: email,
      subject: `SearchPV Request from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
WhatsApp: ${whatsapp || "Not provided"}

Message:
${message || "No message provided"}
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
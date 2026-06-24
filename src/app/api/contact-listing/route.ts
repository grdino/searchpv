import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") ?? "");
    const contact = String(formData.get("contact") ?? "");
    const mls = String(formData.get("mls") ?? "");
    const message = String(formData.get("message") ?? "");

    await resend.emails.send({
      from: "SearchPV <contact@searchpv.com>",
      to: "contact@searchpv.com",
      subject: mls
        ? `SearchPV Listing Inquiry - MLS #${mls}`
        : "SearchPV Listing Inquiry",
      text: `
Name: ${name}
Contact: ${contact}
MLS #: ${mls || "Not specified"}

Message:
${message}
      `,
    });

    return NextResponse.redirect(new URL("/contact-listing/thanks", request.url));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Message failed to send." },
      { status: 500 }
    );
  }
}
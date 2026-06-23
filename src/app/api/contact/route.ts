import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    await resend.emails.send({
      from: "SearchPV <onboarding@resend.dev>",
      to: "grkcmo@hotmail.com",
      subject: `SearchPV Request - ${body.community}`,
      text: `
Name: ${body.name}
Contact: ${body.contact}

${body.message}
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
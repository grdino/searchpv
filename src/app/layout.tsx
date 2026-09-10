import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import SavedItemsCoordinator from "@/app/components/SavedItemsCoordinator";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://searchpv.com"),
  title: {
    default: "SearchPV | Puerto Vallarta Real Estate Market Intelligence",
    template: "%s | SearchPV",
  },
  description:
    "Explore Puerto Vallarta and Riviera Nayarit real estate market intelligence by community, including inventory, pricing, sales activity, and market trends.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <SavedItemsCoordinator />
      </body>
    </html>
  );
}

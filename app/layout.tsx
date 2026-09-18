import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AccessView - Making Sound Visible",
  description:
    "AI-powered accessibility platform for deaf and hard-of-hearing users.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
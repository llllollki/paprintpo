import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Print Shop",
  description: "Custom printing for business cards, banners, flyers, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

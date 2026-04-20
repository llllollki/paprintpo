import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paprintpo — Custom Printing",
  description: "Custom printing for business cards, banners, flyers, stickers, and more.",
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

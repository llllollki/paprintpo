import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paprintpo — Custom Printing",
  description: "Instant branded print kits for small businesses — business cards, stickers, labels, and more. Upload once, preview your brand on everything, reorder easily.",
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

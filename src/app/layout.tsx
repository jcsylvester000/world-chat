import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "World Chat — Commercial Real Estate Marketplace",
  description:
    "Discover, list, and chat about commercial property on a live map. Next.js frontend, ready for a PostgreSQL + Prisma backend.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Warm up connections to the external image/tile hosts so the map
            tiles and placeholder images start downloading sooner. */}
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <link rel="preconnect" href="https://a.tile.openstreetmap.org" />
        <link rel="preconnect" href="https://picsum.photos" />
        <link rel="preconnect" href="https://unpkg.com" />
        <link rel="dns-prefetch" href="https://fastly.picsum.photos" />
        <link rel="dns-prefetch" href="https://api.qrserver.com" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

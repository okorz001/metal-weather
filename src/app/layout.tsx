import type { Metadata } from "next";

import AppBar from "@/components/AppBar";

import "./globals.css";

export const metadata: Metadata = {
  title: "Metal Weather",
  description: "Weather forecasts, heavy metal approved.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <AppBar />
        {children}
      </body>
    </html>
  );
}

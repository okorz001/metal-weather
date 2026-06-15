import type { Metadata } from "next";

import AppBar from "@/components/AppBar";
import { SettingsProvider } from "@/components/SettingsContext";

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
      <body>
        <SettingsProvider>
          <AppBar />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}

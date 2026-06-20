import type { Metadata } from "next";
import { Jim_Nightshade } from "next/font/google";

import AppBar from "@/components/AppBar";
import { SettingsProvider } from "@/components/SettingsContext";

import "./globals.css";

const jimNightshade = Jim_Nightshade({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jim-nightshade",
});

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
    <html lang="en" className={jimNightshade.variable}>
      <body className="min-w-80">
        <SettingsProvider>
          <AppBar />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}

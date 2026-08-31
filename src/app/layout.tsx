import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { accentRgb } from "@/lib/accents";

export const metadata: Metadata = {
  title: "75 Challenge",
  description: "A private, self-tracking challenge — your rules, your tier.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "75 Challenge",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0c0f",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let accent = "orange";
  if (user) {
    const { data } = await supabase.from("profiles").select("accent").eq("id", user.id).maybeSingle();
    if (data?.accent) accent = data.accent;
  }
  const rootStyle = { "--accent-rgb": accentRgb(accent) } as CSSProperties;

  return (
    <html lang="en" style={rootStyle}>
      <body className="min-h-screen bg-bg text-text font-sans">{children}</body>
    </html>
  );
}

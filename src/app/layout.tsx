import type { Metadata, Viewport } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import TimezoneSync from "@/components/TimezoneSync";

export const metadata: Metadata = {
  title: "75-something",
  description: "A private, self-tracking challenge — your rules, your tier.",
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
  let timezone = "UTC";
  if (user) {
    const { data } = await supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle();
    if (data?.timezone) timezone = data.timezone;
  }
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text font-sans">
        {user && <TimezoneSync currentTimezone={timezone} />}
        {children}
      </body>
    </html>
  );
}

import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Exclude /api (each API route does its own auth; the cron route uses a
  // Bearer secret and has no session cookie, so it must NOT be redirected to
  // /login) and static/public assets (incl. manifest.json for PWA install).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

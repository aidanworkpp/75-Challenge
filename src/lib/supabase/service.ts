import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Only import from server-only code
// (cron routes). Never expose to the browser.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials missing");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

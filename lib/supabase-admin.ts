import { createClient } from "@supabase/supabase-js";

// Server-only. This uses the service role key, which bypasses Row Level
// Security entirely. It's loaded from a plain (non-NEXT_PUBLIC_) env var so
// it's never bundled into client-side JS. Only import this from API routes
// or other server-only code — never from a "use client" component.

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.warn(
    "Supabase env vars are missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only) in .env.local or in the Vercel project's Environment Variables."
  );
}

export const supabaseAdmin = createClient(
  url || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-service-role-key",
  { auth: { persistSession: false } }
);

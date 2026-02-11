import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// We export a client that might be uninitialized if variables are missing (common during Vercel build phase)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing. Check your environment variables.",
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as any);

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
	import.meta.env.VITE_SUPABASE_URL || "https://example.supabase.co";
const supabaseAnonKey =
	import.meta.env.VITE_SUPABASE_ANON_KEY || "public-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
	console.warn(
		"Supabase env vars are missing. App UI will load, but auth/data calls will fail until .env is configured."
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

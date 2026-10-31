export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** False until .env.local is filled in. Lets the frontend run before Supabase is connected. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

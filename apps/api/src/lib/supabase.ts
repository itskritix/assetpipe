import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@assetpipe/shared';

export function getSupabase(url: string, key: string): SupabaseClient<Database> {
  return createClient<Database>(url, key);
}

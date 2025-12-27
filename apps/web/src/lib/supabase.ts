import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@assetpipe/shared';
import type { AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Get public URL for a file in Supabase Storage (for public buckets like 'logos')
export function getStorageUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// Get signed URL for a file in private Supabase Storage (for private buckets like 'submissions')
export async function getSignedStorageUrl(
  supabase: SupabaseClient<Database>,
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) {
    console.error('Signed URL error:', error);
    return null;
  }
  return data.signedUrl;
}

// Browser client for client-side use
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Server client for SSR - pass Astro cookies and request headers
export function createSupabaseServer(cookies: AstroCookies, cookieHeader?: string | null) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (!cookieHeader) return [];
        return cookieHeader.split(';').map(cookie => {
          const [name, ...rest] = cookie.trim().split('=');
          return { name, value: rest.join('=') };
        });
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options as Parameters<AstroCookies['set']>[2]);
        });
      },
    },
  });
}

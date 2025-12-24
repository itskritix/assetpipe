import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@assetpipe/shared';
import type { AstroCookies } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

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

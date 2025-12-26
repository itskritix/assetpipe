import type { APIRoute } from 'astro';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@assetpipe/shared';

function parseCookies(cookieHeader: string | null): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(';').map(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  let cookie = `${name}=${value}`;
  if (options.path) cookie += `; Path=${options.path}`;
  if (options.maxAge !== undefined) cookie += `; Max-Age=${options.maxAge}`;
  if (options.httpOnly) cookie += `; HttpOnly`;
  if (options.secure) cookie += `; Secure`;
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  return cookie;
}

export const POST: APIRoute = async ({ request }) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const cookieHeader = request.headers.get('cookie');
  const cookiesToSet: string[] = [];

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookies(cookieHeader);
      },
      setAll(cookies: { name: string; value: string; options?: CookieOptions }[]) {
        cookies.forEach(({ name, value, options }) => {
          // Use Supabase's options - it will set maxAge: 0 for logout
          const cookieOptions = {
            path: options?.path || '/',
            maxAge: options?.maxAge ?? 0,
            httpOnly: options?.httpOnly ?? true,
            secure: options?.secure ?? import.meta.env.PROD,
            sameSite: options?.sameSite || ('lax' as const),
          };
          cookiesToSet.push(serializeCookie(name, value, cookieOptions));
        });
      },
    },
  });

  await supabase.auth.signOut();

  const headers = new Headers({ 'Content-Type': 'application/json' });
  cookiesToSet.forEach(cookie => headers.append('Set-Cookie', cookie));

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
};

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
  if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
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
          // Use Supabase's options but ensure essential settings
          const cookieOptions = {
            path: options?.path || '/',
            maxAge: options?.maxAge,
            httpOnly: options?.httpOnly ?? true,
            secure: options?.secure ?? import.meta.env.PROD,
            sameSite: options?.sameSite || ('lax' as const),
          };
          cookiesToSet.push(serializeCookie(name, value, cookieOptions));
        });
      },
    },
  });

  const body = await request.json();
  const { email, password } = body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = new Headers({ 'Content-Type': 'application/json' });
  cookiesToSet.forEach(cookie => headers.append('Set-Cookie', cookie));

  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
    headers,
  });
};

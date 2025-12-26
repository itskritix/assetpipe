import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { defineMiddleware } from 'astro:middleware';
import type { Database } from '@assetpipe/shared';

function parseCookies(cookieHeader: string | null): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(';').map(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const cookieHeader = context.request.headers.get('cookie');

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookies(cookieHeader);
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Respect Supabase's cookie options but ensure essential settings
          context.cookies.set(name, value, {
            path: options?.path || '/',
            maxAge: options?.maxAge,
            httpOnly: options?.httpOnly ?? true,
            secure: options?.secure ?? import.meta.env.PROD,
            sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') || 'lax',
          });
        });
      },
    },
  });

  // Get user - this validates the session and refreshes tokens if needed
  // Using getUser() instead of getSession() as recommended by Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Store supabase client and user in locals for use in pages
  context.locals.supabase = supabase;
  context.locals.user = user;

  return next();
});

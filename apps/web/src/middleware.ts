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
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase env vars:', { supabaseUrl, supabaseAnonKey });
      context.locals.supabase = null;
      context.locals.user = null;
      return next();
    }

    const cookieHeader = context.request.headers.get('cookie');

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return parseCookies(cookieHeader);
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
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

    // Get user with error handling
    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch (authError) {
      console.error('Auth error:', authError);
    }

    context.locals.supabase = supabase;
    context.locals.user = user;
  } catch (error) {
    console.error('Middleware error:', error);
    context.locals.supabase = null;
    context.locals.user = null;
  }

  return next();
});

/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type SupabaseClient = import('@supabase/supabase-js').SupabaseClient;
type User = import('@supabase/supabase-js').User;
type Database = import('@assetpipe/shared').Database;

declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database> | null;
    user: User | null;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Toast notification interface
interface Toast {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

interface Window {
  toast?: Toast;
}

export type LogoFormat = 'svg' | 'png';
export type LogoVariant = 'primary' | 'icon' | 'wordmark' | 'dark' | 'light';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  description: string | null;
  website_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Logo {
  id: string;
  company_id: string;
  format: LogoFormat;
  variant: LogoVariant;
  storage_path: string;
  width: number | null;
  height: number | null;
  file_size: number | null;
  created_at: string;
}

export interface BrandKit {
  id: string;
  company_id: string;
  primary_color: string | null;
  secondary_colors: string[] | null;
  fonts: Record<string, string> | null;
  guidelines_url: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  company_name: string;
  company_domain: string | null;
  status: SubmissionStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  name: string | null;
  is_active: boolean;
  request_count: number;
  last_used_at: string | null;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface CompanyWithLogos extends Company {
  logos: Logo[];
}

export interface CompanyWithBrandKit extends Company {
  logos: Logo[];
  brand_kit: BrandKit | null;
}

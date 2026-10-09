export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string | null;
}

export interface ApiError {
  detail?: string | Array<{ msg: string; loc?: string[] }>;
  message?: string;
}

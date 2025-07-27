export interface User {
  id: string;
  email: string;
  name: string;
  group_id: string | null;
  role: 'member' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  groupCode?: string;
}

export interface UpdateProfileData {
  name: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface Protocol {
  id: string;
  group_id: string;
  meeting_date: string;
  title: string;
  data: any; // We'll define this more specifically later
  pdf_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

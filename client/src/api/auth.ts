import type { AuthUser, LoginResponse } from '../types/api';
import { LOGIN_PATH, http } from './http';

export interface Credentials {
  email: string;
  password: string;
}

export async function login(credentials: Credentials): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>(LOGIN_PATH, credentials);
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await http.get<{ user: AuthUser }>('/auth/me');
  return data.user;
}

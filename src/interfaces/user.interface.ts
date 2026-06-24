export const UserRole = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  /**
   * Not part of the JWT payload returned by the backend, so it may be absent
   * when the session is rehydrated purely from the token.
   */
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
}

import { UserRole, type User } from '@/interfaces/user.interface';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const json = base64UrlDecode(parts[1]);
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function base64UrlDecode(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const binary = atob(normalized + '='.repeat(padLength));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function isExpired(claims: Record<string, unknown>): boolean {
  const exp = claims.exp;
  if (typeof exp !== 'number') {
    return false;
  }
  return Date.now() >= exp * 1000;
}

function isUserRole(value: unknown): value is UserRole {
  return value === UserRole.ADMIN || value === UserRole.CUSTOMER;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

export function userFromToken(token: string): User | null {
  const claims = decodeJwtPayload(token);
  if (!claims || isExpired(claims)) {
    return null;
  }

  const id = firstString(claims.sub, claims.id, claims.userId);
  const email = firstString(claims.email);
  const role = isUserRole(claims.role) ? claims.role : undefined;

  if (!id || !email || !role) {
    return null;
  }

  const createdAt = firstString(claims.createdAt);
  return createdAt ? { id, email, role, createdAt } : { id, email, role };
}

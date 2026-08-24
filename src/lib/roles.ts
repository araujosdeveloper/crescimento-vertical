export const ROLES = [
  "admin",
  "editor",
  "reviewer",
  "researcher",
  "automation",
] as const;

export type Role = (typeof ROLES)[number];

export interface RoleUser {
  roles?: (string | Role)[] | null;
}

export function hasRole(
  user: RoleUser | null | undefined,
  role: Role,
): boolean {
  return Boolean(user?.roles?.includes(role));
}

export function hasAnyRole(
  user: RoleUser | null | undefined,
  roles: Role[],
): boolean {
  return Boolean(user && roles.some((role) => user.roles?.includes(role)));
}

export function isAdmin(user: RoleUser | null | undefined): boolean {
  return hasRole(user, "admin");
}

export function isEditor(user: RoleUser | null | undefined): boolean {
  return hasRole(user, "editor");
}

export function isReviewer(user: RoleUser | null | undefined): boolean {
  return hasRole(user, "reviewer");
}

export function isResearcher(user: RoleUser | null | undefined): boolean {
  return hasRole(user, "researcher");
}

export function isAutomation(user: RoleUser | null | undefined): boolean {
  return hasRole(user, "automation");
}

export function isEditorialUser(user: RoleUser | null | undefined): boolean {
  return Boolean(user && user.roles && user.roles.length > 0);
}

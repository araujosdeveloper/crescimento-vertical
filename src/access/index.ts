import type { Access, FieldAccess, Where } from "payload";

import {
  hasAnyRole,
  hasRole,
  isAdmin,
  isEditorialUser,
} from "../lib/roles";

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

export const authenticated: Access = ({ req: { user } }) => Boolean(user);

export const adminOnly: Access = ({ req: { user } }) => isAdmin(user);

export const adminFieldOnly: FieldAccess = ({ req: { user } }) =>
  isAdmin(user);

export const editorialUsers: Access = ({ req: { user } }) =>
  isEditorialUser(user);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const usersCreate: Access = ({ req: { user } }) => isAdmin(user);

export const usersRead: Access = ({ req: { user } }) => {
  if (isAdmin(user)) {
    return true;
  }
  return user ? { id: { equals: user.id } } : false;
};

export const usersUpdate: Access = ({ req: { user } }) => {
  if (isAdmin(user)) {
    return true;
  }
  return user ? { id: { equals: user.id } } : false;
};

export const usersDelete: Access = ({ req: { user } }) => isAdmin(user);

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export const articlesRead: Access = ({ req: { user } }) => {
  if (user) {
    return true;
  }

  const where: Where = {
    and: [
      { workflowStatus: { equals: "published" } },
      { publishedAt: { less_than_equal: new Date().toISOString() } },
    ],
  };

  return where;
};

export const articlesCreate: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "editor", "automation"]);
};

export const articlesUpdate: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "editor", "reviewer", "automation"]);
};

export const articlesDelete: Access = ({ req: { user } }) => isAdmin(user);

export const workflowStatusFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "editor", "reviewer"]);
};

export const publishStatusFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasRole(user, "admin") || hasRole(user, "reviewer");
};

// ---------------------------------------------------------------------------
// ResearchDossiers
// ---------------------------------------------------------------------------

export const dossiersRead: Access = ({ req: { user } }) =>
  isEditorialUser(user);

export const dossiersCreate: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "researcher", "automation"]);
};

export const dossiersUpdate: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "researcher", "automation"]);
};

export const dossiersDelete: Access = ({ req: { user } }) => isAdmin(user);

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export const sourcesRead: Access = ({ req: { user } }) =>
  isEditorialUser(user);

export const sourcesCreate: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "researcher", "automation"]);
};

export const sourcesUpdate: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "researcher", "automation"]);
};

export const sourcesDelete: Access = ({ req: { user } }) => isAdmin(user);

// ---------------------------------------------------------------------------
// Authors / Categories / Media (public metadata, managed by editorial staff)
// ---------------------------------------------------------------------------

export const publicRead: Access = () => true;

export const taxonomyCreate: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "editor"]);
};

export const taxonomyUpdate: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "editor"]);
};

export const taxonomyDelete: Access = ({ req: { user } }) => isAdmin(user);

export const mediaCreate: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "editor", "reviewer"]);
};

export const mediaUpdate: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }
  return hasAnyRole(user, ["admin", "editor", "reviewer"]);
};

export const mediaDelete: Access = ({ req: { user } }) => isAdmin(user);

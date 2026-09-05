import { Forbidden, type CollectionConfig } from "payload";

import {
  adminFieldOnly,
  usersCreate,
  usersDelete,
  usersRead,
  usersUpdate,
} from "../access";
import { isEditorialUser, ROLES } from "../lib/roles";

export function rejectInactiveLogin({ user }: { user: { active?: boolean | null } }) {
  if (user.active === false) {
    throw new Forbidden();
  }
}

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "roles", "active"],
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 5 * 60 * 1000,
    tokenExpiration: 60 * 60,
    useAPIKey: true,
  },
  access: {
    create: usersCreate,
    read: usersRead,
    update: usersUpdate,
    delete: usersDelete,
    admin: ({ req: { user } }) => isEditorialUser(user),
  },
  hooks: {
    beforeLogin: [rejectInactiveLogin],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "roles",
      type: "select",
      options: ROLES.map((role) => ({ label: role, value: role })),
      hasMany: true,
      required: true,
      defaultValue: ["researcher"],
      saveToJWT: true,
      access: {
        create: adminFieldOnly,
        update: adminFieldOnly,
      },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      saveToJWT: true,
      access: {
        create: adminFieldOnly,
        update: adminFieldOnly,
      },
    },
    {
      name: "lastLoginAt",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
  ],
};

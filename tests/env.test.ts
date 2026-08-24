import { describe, expect, it } from "vitest";

import { validateAppEnv, validateDatabaseEnv } from "../src/lib/env";

describe("validação das variáveis de aplicação", () => {
  it("aceita variáveis válidas", () => {
    expect(
      validateAppEnv({
        DATABASE_URL: "postgresql://user:password@db:5432/name",
        PAYLOAD_SECRET: "a-very-long-secret-that-is-at-least-32-chars",
      }),
    ).toEqual([]);
  });

  it("exige DATABASE_URL e PAYLOAD_SECRET", () => {
    const problems = validateAppEnv({});
    expect(problems).toContain("DATABASE_URL is required");
    expect(problems).toContain("PAYLOAD_SECRET is required");
  });

  it("rejeita DATABASE_URL que não seja PostgreSQL", () => {
    expect(
      validateAppEnv({
        DATABASE_URL: "mysql://user:pass@db:3306/name",
        PAYLOAD_SECRET: "a-very-long-secret-that-is-at-least-32-chars",
      }),
    ).toContain("DATABASE_URL must be a PostgreSQL connection string");
  });

  it("rejeita PAYLOAD_SECRET curto", () => {
    expect(
      validateAppEnv({
        DATABASE_URL: "postgres://u:p@db/n",
        PAYLOAD_SECRET: "short",
      }),
    ).toContain("PAYLOAD_SECRET must be at least 32 characters long");
  });
});

describe("validação das variáveis de banco", () => {
  it("aceita variáveis válidas", () => {
    expect(
      validateDatabaseEnv({
        POSTGRES_DB: "crescimento_vertical",
        POSTGRES_USER: "cms_user",
        POSTGRES_PASSWORD: "a-long-database-password",
      }),
    ).toEqual([]);
  });

  it("exige os três campos", () => {
    const problems = validateDatabaseEnv({});
    expect(problems).toContain("POSTGRES_DB is required");
    expect(problems).toContain("POSTGRES_USER is required");
    expect(problems).toContain("POSTGRES_PASSWORD must be at least 12 characters long");
  });
});

export interface AppEnv {
  DATABASE_URL?: string;
  PAYLOAD_SECRET?: string;
}

export interface DatabaseEnv {
  POSTGRES_DB?: string;
  POSTGRES_USER?: string;
  POSTGRES_PASSWORD?: string;
}

export function validateAppEnv(env: AppEnv): string[] {
  const problems: string[] = [];

  if (!env.DATABASE_URL) {
    problems.push("DATABASE_URL is required");
  } else if (!/^postgres(ql)?:\/\/.+/.test(env.DATABASE_URL)) {
    problems.push("DATABASE_URL must be a PostgreSQL connection string");
  }

  if (!env.PAYLOAD_SECRET) {
    problems.push("PAYLOAD_SECRET is required");
  } else if (env.PAYLOAD_SECRET.length < 32) {
    problems.push("PAYLOAD_SECRET must be at least 32 characters long");
  }

  return problems;
}

export function validateDatabaseEnv(env: DatabaseEnv): string[] {
  const problems: string[] = [];

  if (!env.POSTGRES_DB || env.POSTGRES_DB.trim().length === 0) {
    problems.push("POSTGRES_DB is required");
  }

  if (!env.POSTGRES_USER || env.POSTGRES_USER.trim().length === 0) {
    problems.push("POSTGRES_USER is required");
  }

  if (!env.POSTGRES_PASSWORD || env.POSTGRES_PASSWORD.length < 12) {
    problems.push("POSTGRES_PASSWORD must be at least 12 characters long");
  }

  return problems;
}

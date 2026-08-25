import type { Role } from "./roles";

export const WORKFLOW_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "published",
  "archived",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const SOURCE_RELIABILITY_LEVELS = [
  "unverified",
  "verified",
  "rejected",
] as const;

export type SourceReliability = (typeof SOURCE_RELIABILITY_LEVELS)[number];

export interface WorkflowDocument {
  workflowStatus?: string | null;
  _status?: string | null;
  publishedAt?: string | Date | null;
}

export interface SourceLike {
  reliability?: string | null;
}

export interface PublicationInput {
  title?: unknown;
  excerpt?: unknown;
  content?: unknown;
  heroImage?: unknown;
  author?: unknown;
  category?: unknown;
}

interface TransitionOption {
  to: WorkflowStatus;
  roles: Role[];
}

/**
 * Allowed editorial transitions. The absence of a pair means the transition is
 * forbidden server-side regardless of the API caller.
 */
export const TRANSITIONS: Record<WorkflowStatus, TransitionOption[]> = {
  draft: [{ to: "in_review", roles: ["admin", "editor"] }],
  in_review: [
    { to: "approved", roles: ["admin", "reviewer"] },
    { to: "draft", roles: ["admin", "editor", "reviewer"] },
  ],
  approved: [
    { to: "published", roles: ["admin", "reviewer"] },
    { to: "draft", roles: ["admin", "reviewer"] },
  ],
  published: [{ to: "archived", roles: ["admin", "reviewer"] }],
  archived: [{ to: "draft", roles: ["admin"] }],
};

export function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return (
    typeof value === "string" &&
    (WORKFLOW_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Returns true when at least one of `roles` may move a document from `from` to
 * `to`. A no-op (same status) is always allowed so editors can save in place.
 */
export function canTransition(
  userRoles: Role[],
  from: WorkflowStatus,
  to: WorkflowStatus,
): boolean {
  if (from === to) {
    return true;
  }

  const options = TRANSITIONS[from] ?? [];
  return options.some(
    (option) =>
      option.to === to && option.roles.some((role) => userRoles.includes(role)),
  );
}

/** Whether a role may ever publish/approve (used to deny automation/editor). */
export function canPublish(userRoles: Role[]): boolean {
  return userRoles.some((role) => role === "admin" || role === "reviewer");
}

export function hasValidatedSource(sources: SourceLike[] = []): boolean {
  return sources.some((source) => source?.reliability === "verified");
}

export function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Returns the list of missing requirements for publication. An empty array
 * means the document is complete enough to be published.
 */
export function validatePublication(input: PublicationInput): string[] {
  const missing: string[] = [];

  if (!hasText(input.title)) {
    missing.push("title");
  }
  if (!hasText(input.excerpt)) {
    missing.push("excerpt");
  }
  if (input.content == null) {
    missing.push("content");
  }
  if (input.heroImage == null) {
    missing.push("heroImage");
  }
  if (input.author == null) {
    missing.push("author");
  }
  if (input.category == null) {
    missing.push("category");
  }

  return missing;
}

export function isPubliclyReadable(
  doc: WorkflowDocument,
  now: Date = new Date(),
): boolean {
  if (doc.workflowStatus !== "published") {
    return false;
  }

  if (!doc.publishedAt) {
    return false;
  }

  return new Date(doc.publishedAt).getTime() <= now.getTime();
}

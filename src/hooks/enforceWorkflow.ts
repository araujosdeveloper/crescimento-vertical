import type { CollectionBeforeChangeHook } from "payload";

import {
  canPublish,
  canTransition,
  hasValidatedSource,
  isWorkflowStatus,
  validatePublication,
  type SourceLike,
  type WorkflowStatus,
} from "../lib/editorial";
import {
  SEO_META_DESCRIPTION_MAX,
  SEO_META_TITLE_MAX,
} from "../lib/editorial/constants";
import type { Role } from "../lib/roles";

function rolesOf(user: unknown): Role[] {
  const roles = (user as { roles?: unknown })?.roles;
  if (!Array.isArray(roles)) {
    return [];
  }
  return roles.filter((role): role is Role => typeof role === "string");
}

function extractIds(value: unknown): (string | number)[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (entry && typeof entry === "object") {
        const objectEntry = entry as Record<string, unknown>;
        if ("value" in objectEntry) {
          return objectEntry.value as string | number;
        }
        if ("id" in objectEntry) {
          return objectEntry.id as string | number;
        }
      }
      return entry as string | number;
    })
    .filter(
      (id): id is string | number =>
        typeof id === "string" || typeof id === "number",
    );
}

/**
 * Server-side enforcement of the editorial workflow on Articles.
 *
 * This hook is the source of truth for:
 * - valid workflowStatus transitions per role;
 * - the publication gate (title, excerpt, content, author, category);
 * - the validated-source requirement;
 * - forcing `_status` so a document cannot bypass the workflow.
 */
export const enforceWorkflowRules: CollectionBeforeChangeHook = async ({
  req,
  data,
  originalDoc,
}) => {
  const roles = rolesOf(req.user);
  const previous: WorkflowStatus =
    (originalDoc?.workflowStatus as WorkflowStatus | undefined) ?? "draft";
  const next = data?.workflowStatus as WorkflowStatus | undefined;

  const wasPublished = previous === "published";
  const wantsPublish = next === "published";

  // 1. Validate the transition itself (server-side, regardless of access).
  if (next && next !== previous) {
    if (!isWorkflowStatus(next)) {
      throw new Error(`workflowStatus inválido: ${String(next)}`);
    }
    if (!canTransition(roles, previous, next)) {
      throw new Error(
        `Transição editorial inválida (${previous} → ${next}) para o papel atual.`,
      );
    }
  }

  // 2. Publication gate.
  if (wantsPublish) {
    if (!canPublish(roles)) {
      throw new Error("Somente admin ou reviewer podem publicar.");
    }

    const missing = validatePublication({
      title: data?.title,
      excerpt: data?.excerpt,
      content: data?.content,
      heroImage: data?.heroImage,
      author: data?.author,
      category: data?.category,
    });

    if (missing.length > 0) {
      throw new Error(
        `Campos obrigatórios ausentes para publicação: ${missing.join(", ")}`,
      );
    }

    const seoTitle =
      typeof data?.seo?.seoTitle === "string" ? data.seo.seoTitle.trim() : "";
    const seoDescription =
      typeof data?.seo?.seoDescription === "string"
        ? data.seo.seoDescription.trim()
        : "";

    if (seoTitle.length > SEO_META_TITLE_MAX) {
      throw new Error(
        `seoTitle excede ${SEO_META_TITLE_MAX} caracteres (recomendado).`,
      );
    }

    if (seoDescription.length > SEO_META_DESCRIPTION_MAX) {
      throw new Error(
        `seoDescription excede ${SEO_META_DESCRIPTION_MAX} caracteres (recomendado).`,
      );
    }

    const sourceIds = extractIds(data?.sources);
    let hasValidated = false;
    if (sourceIds.length > 0 && req.payload) {
      const result = await req.payload.find({
        collection: "sources",
        where: { id: { in: sourceIds } },
        depth: 0,
        limit: 500,
        overrideAccess: false,
        user: req.user,
      });
      hasValidated = hasValidatedSource(result.docs as SourceLike[]);
    }

    if (!hasValidated) {
      throw new Error("Publicação exige pelo menos uma fonte validada.");
    }
  }

  // 3. Force the Payload publish flag so no caller can bypass the workflow.
  data._status = wantsPublish || wasPublished ? "published" : "draft";

  // 4. Auto-fill publishedAt the first time an article goes public.
  if (wantsPublish && !data.publishedAt) {
    data.publishedAt = new Date().toISOString();
  }

  return data;
};

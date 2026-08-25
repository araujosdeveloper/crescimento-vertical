import type { CollectionAfterChangeHook } from "payload";

/**
 * Emits a structured, secret-free audit entry whenever the editorial
 * workflow state of a document changes. This is the lightweight audit trail
 * for Fase 2A; retention and a dedicated audit store are part of Fase 11.
 */
export const auditWorkflowChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req,
  operation,
  collection,
}) => {
  const previousStatus = previousDoc?.workflowStatus ?? null;
  const nextStatus = doc?.workflowStatus ?? null;

  if (previousStatus === nextStatus) {
    return doc;
  }

  req.payload.logger.info({
    msg: "editorial_transition",
    collection: collection?.slug ?? "unknown",
    documentId: doc?.id ?? null,
    from: previousStatus,
    to: nextStatus,
    actor: req.user?.id ?? null,
    operation,
  });

  return doc;
};

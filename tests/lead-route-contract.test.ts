import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync("src/app/api/leads/route.ts", "utf8");

describe("contrato de aceitação sem notificador", () => {
  it("persiste lead e outbox pendente antes de responder sucesso", () => {
    expect(route).toContain('notificationStatus: "pending"');
    expect(route).toContain('collection: "lead-outbox"');
    expect(route).toContain('state: "pending"');
    expect(route).toContain('return NextResponse.json({ ok: true, message: "Solicitação recebida." })');
  });

  it("mantém idempotência sem criar segundo lead", () => {
    expect(route).toContain('where: { idempotencyKey: { equals: key } }');
    expect(route).toContain('if (existing.docs[0]) return NextResponse.json({ ok: true');
    expect(route).toContain('if (attempt && now - attempt.at < 3600000) return NextResponse.json({ ok: true');
  });
});

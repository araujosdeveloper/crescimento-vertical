import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_TEXT, CONSENT_VERSION, consentTextHash, issueFormToken, normalizeUtm, validateLeadInput, verifyFormToken } from "../src/lib/lead-intake";
import { leadsRead, leadsCreate } from "../src/access";

const valid = () => ({ name: "Pessoa Sintética", email: "sintetico@example.test", serviceInterest: "automation", challenge: "Desafio sintético", contactPreference: "email", consent: true, consentVersion: CONSENT_VERSION, consentTextHash: consentTextHash(), idempotencyKey: "test-key", startedAt: Date.now() - 5000, formToken: issueFormToken(), website: "" });

describe("contratos da captação first-party", () => {
  beforeEach(() => vi.stubEnv("LEADS_FORM_SECRET", "phase7-test-value"));
  afterEach(() => vi.unstubAllEnvs());
  it("exige consentimento versionado e rejeita propriedades extras", () => {
    expect(validateLeadInput(valid()).value).toBeTruthy();
    expect(validateLeadInput({ ...valid(), consent: false })).toEqual({ error: "invalid" });
    expect(validateLeadInput({ ...valid(), extra: "rejeitar" })).toEqual({ error: "invalid" });
  });
  it("assina tokens com expiração e normaliza UTMs", () => {
    const token = issueFormToken();
    expect(token && verifyFormToken(token)).toBe(true);
    expect(verifyFormToken(token, Date.now() + 1_801_000)).toBe(false);
    expect(normalizeUtm(" campanha / secreta?x=1 ")).toBe("campanhasecretax1");
  });
  it("bloqueia honeypot e preserva o texto de consentimento para auditoria", () => {
    expect(validateLeadInput({ ...valid(), website: "bot" })).toEqual({ error: "spam" });
    expect(CONSENT_TEXT).toContain("contato");
    expect(consentTextHash()).toHaveLength(64);
  });
  it("nega leitura e criação públicas de leads", () => {
    expect(leadsCreate({ req: { user: null } } as never)).toBe(false);
    expect(leadsRead({ req: { user: null } } as never)).toBe(false);
    expect(leadsRead({ req: { user: { active: true, roles: ["admin"] } } } as never)).toBe(true);
  });
});

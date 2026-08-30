import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../src/app/api/health/ready/route";

describe("readiness sanitizada do SMTP", () => {
  afterEach(()=>vi.unstubAllEnvs());
  it("permanece ready quando a notificação está desabilitada", async () => {
    vi.stubEnv("LEAD_NOTIFICATION_ENABLED","false");
    const response=GET(); expect(response.status).toBe(200); expect(await response.json()).toEqual({status:"ready"});
  });
  it("informa degradação sem caminho ou credencial", async () => {
    vi.stubEnv("LEAD_NOTIFICATION_ENABLED","true"); vi.stubEnv("LEAD_SMTP_HOST","smtp.hostinger.com"); vi.stubEnv("LEAD_SMTP_PORT","465"); vi.stubEnv("LEAD_SMTP_SECURE","true"); vi.stubEnv("LEAD_SMTP_USER","contato@crescimentovertical.com"); vi.stubEnv("LEAD_SMTP_FROM","contato@crescimentovertical.com"); vi.stubEnv("LEAD_NOTIFICATION_TO","contato@crescimentovertical.com"); vi.stubEnv("LEAD_ADMIN_BASE_URL","https://staging.crescimentovertical.com"); vi.stubEnv("LEAD_SMTP_PASSWORD_FILE","/tmp/cv-not-present");
    const response=GET(); expect(response.status).toBe(503); expect(await response.json()).toEqual({status:"degraded",reason:"notification_transport_unavailable"});
  });
});

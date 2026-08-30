import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const component = readFileSync("src/components/diagnostic-form.tsx", "utf8");

describe("contraste do formulário de diagnóstico", () => {
  it("mantém painel claro, campos distinguíveis e foco acessível", () => {
    expect(css).toContain(".diagnostic-form-panel");
    expect(css).toMatch(/\.diagnostic-form-panel\s*\{[^}]*background:\s*#f8fafc/i);
    expect(css).toMatch(/\.diagnostic-form-field input[^}]*background:\s*#fff/i);
    expect(css).toMatch(/\.diagnostic-form-field input[^}]*border:\s*1px solid #94a3b8/i);
    expect(css).toContain("outline: 3px solid rgba(2,132,199,.3)");
    expect(css).toContain("color: #64748b");
  });

  it("cobre estados semânticos, consentimento e autofill sem alterar o fluxo", () => {
    expect(css).toContain(".diagnostic-form-error");
    expect(css).toContain(".diagnostic-form-success");
    expect(css).toContain(".diagnostic-form-consent");
    expect(css).toContain("input:-webkit-autofill");
    expect(component).toContain('name="consent" type="checkbox" required');
    expect(component).toContain('aria-describedby="diagnostico-ajuda diagnostico-erros"');
    expect(component).toContain('fetch("/api/leads"');
  });

  it("restringe os novos estilos ao formulário e não adiciona PII", () => {
    expect(css).not.toMatch(/(^|\n)input\s*\{/);
    expect(css).not.toMatch(/(^|\n)textarea\s*\{/);
    expect(component).not.toMatch(/@\w+\./);
    expect(component).not.toMatch(/\+\d{7,}/);
  });
});

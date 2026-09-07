"use client";

import { FormEvent, useEffect, useState } from "react";

export function NewsletterForm() {
  const [token, setToken] = useState("");
  const [version, setVersion] = useState("");
  const [hash, setHash] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    void fetch("/api/newsletter")
      .then((r) => r.json())
      .then((v) => {
        setToken(v.token || "");
        setVersion(v.consentVersion || "");
        setHash(v.consentTextHash || "");
      })
      .catch(() => setState("error"));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    if (!email) return;
    setState("sending");
    setError("");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          consent: data.get("consent") === "on",
          consentVersion: version,
          consentTextHash: hash,
          formToken: token,
          startedAt: form.dataset.startedAt || String(Date.now()),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const v = await r.json();
      if (!r.ok || !v.ok) throw new Error(v.error);
      form.reset();
      setState("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir agora.");
      setState("error");
    }
  }

  if (state === "success") {
    return <p className="newsletter-success" role="status">Inscrição confirmada. Obrigado!</p>;
  }

  return (
    <form className="newsletter-form" onSubmit={submit} data-started-at={startedAt}>
      <label className="newsletter-label" htmlFor="newsletter-email">
        Receba conteúdos e novidades sobre IA e automação
      </label>
      <div className="newsletter-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Seu e-mail"
        />
        <button className="button-primary" type="submit" disabled={state === "sending" || !token}>
          {state === "sending" ? "Enviando…" : "Assinar"}
        </button>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
      <label className="newsletter-consent">
        <input name="consent" type="checkbox" required />
        <span>Autorizo o envio de conteúdos para este e-mail. Posso cancelar quando quiser.</span>
      </label>
      <p role="alert" className={state === "error" ? "newsletter-error" : "sr-only"}>{error || ""}</p>
    </form>
  );
}

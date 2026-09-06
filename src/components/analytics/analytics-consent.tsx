"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  ANALYTICS_CONSENT_KEY,
  ANALYTICS_CONSENT_VERSION,
  GA_MEASUREMENT_ID,
} from "@/lib/analytics";

type Decision = "granted" | "denied" | null;

let listeners: Array<() => void> = [];

function readConsent(): Decision {
  try {
    const raw = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { analytics?: boolean; version?: string };
    if (parsed.version === ANALYTICS_CONSENT_VERSION && typeof parsed.analytics === "boolean") {
      return parsed.analytics ? "granted" : "denied";
    }
    return null;
  } catch {
    return null;
  }
}

function subscribe(callback: () => void): () => void {
  listeners = [...listeners, callback];
  return () => {
    listeners = listeners.filter((item) => item !== callback);
  };
}

function notify(): void {
  for (const listener of listeners) listener();
}

function getServerSnapshot(): Decision {
  return null;
}

function loadGtag(): void {
  if (typeof window === "undefined" || window.gtag) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    (window.dataLayer as unknown[]).push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);
}

export function AnalyticsConsent() {
  const decision = useSyncExternalStore(subscribe, readConsent, getServerSnapshot);

  useEffect(() => {
    if (decision === "granted") loadGtag();
  }, [decision]);

  function choose(analytics: boolean) {
    try {
      window.localStorage.setItem(
        ANALYTICS_CONSENT_KEY,
        JSON.stringify({ analytics, version: ANALYTICS_CONSENT_VERSION }),
      );
    } catch {
      // armazenamento indisponível: consentimento vale apenas para a sessão
    }
    notify();
  }

  if (!GA_MEASUREMENT_ID || decision !== null) return null;

  return (
    <div className="analytics-consent" role="region" aria-label="Consentimento de cookies">
      <p>
        Usamos cookies de análise (Google Analytics) para entender como o site é
        usado e melhorar o conteúdo. Você pode recusar; o site continua
        funcionando normalmente.
      </p>
      <div className="analytics-consent-actions">
        <button className="button-primary" type="button" onClick={() => choose(true)}>
          Aceitar
        </button>
        <button className="button-secondary" type="button" onClick={() => choose(false)}>
          Recusar
        </button>
      </div>
    </div>
  );
}

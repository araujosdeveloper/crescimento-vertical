const DEFAULT_CONTACT_EMAIL = "contato@crescimentovertical.com";
const DEFAULT_WHATSAPP_MESSAGE =
  "Olá! Vim pelo site da Crescimento Vertical e quero entender como estruturar melhor o crescimento digital da minha empresa.";

const configuredEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
const configuredWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(
  /\D/g,
  "",
);
const configuredWhatsappDisplay =
  process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY?.trim();
const configuredWhatsappMessage =
  process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE?.trim();

if (
  configuredEmail &&
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail)
) {
  throw new Error("NEXT_PUBLIC_CONTACT_EMAIL possui formato inválido.");
}

if (configuredWhatsapp && !/^[1-9]\d{9,14}$/.test(configuredWhatsapp)) {
  throw new Error(
    "NEXT_PUBLIC_WHATSAPP_NUMBER deve conter de 10 a 15 dígitos, incluindo país e DDD.",
  );
}

export const CONTACT_EMAIL = configuredEmail || DEFAULT_CONTACT_EMAIL;
export const WHATSAPP_URL = configuredWhatsapp
  ? "https://wa.me/" +
    configuredWhatsapp +
    "?text=" +
    encodeURIComponent(configuredWhatsappMessage || DEFAULT_WHATSAPP_MESSAGE)
  : null;
export const WHATSAPP_DISPLAY = configuredWhatsappDisplay || null;
export const PRIMARY_CONTACT_URL =
  WHATSAPP_URL || "mailto:" + CONTACT_EMAIL;
export const PRIMARY_CONTACT_LABEL = WHATSAPP_URL
  ? "Falar com especialista"
  : "Enviar e-mail";
export const PRIMARY_CONTACT_IS_EXTERNAL = Boolean(WHATSAPP_URL);

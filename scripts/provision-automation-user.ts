import { randomBytes } from "node:crypto";
import { getPayload } from "payload";
import config from "../payload.config";

async function provisionAutomationUser() {
  const payload = await getPayload({ config });
  const email = process.env.CV_AUTOMATION_EMAIL ?? "automation@crescimentovertical.com";
  const apiKey = randomBytes(32).toString("hex");

  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  const data = {
    email,
    name: "Automação Editorial (n8n)",
    roles: ["automation"] as ("admin" | "editor" | "automation" | "reviewer" | "researcher")[],
    active: true,
    enableAPIKey: true,
    apiKey,
  };

  if (existing.docs[0]) {
    await payload.update({
      collection: "users",
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
      context: { provisionAutomationUser: true },
    });
  } else {
    await payload.create({
      collection: "users",
      data,
      overrideAccess: true,
      context: { provisionAutomationUser: true },
    });
  }

  console.log(
    JSON.stringify({
      email,
      roles: ["automation"],
      apiKey,
      note: "Guarde a apiKey uma única vez; configure a credencial CV Payload Automation no n8n (Authorization: users API-Key <apiKey>).",
    }),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  provisionAutomationUser()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

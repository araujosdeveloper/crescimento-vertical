import sharp from "sharp";
import { getPayload } from "payload";
import config from "../payload.config";

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= max) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main() {
  const title = process.env.COVER_TITLE!;
  const articleId = Number(process.env.ARTICLE_ID!);
  const lines = wrap(title, 32);
  const lineY = 170;
  const lineHeight = 78;
  const titleSvg = lines
    .map(
      (line, i) =>
        `<text x="120" y="${lineY + i * lineHeight}" font-family="DejaVu Sans, sans-serif" font-size="56" font-weight="bold" fill="#f8fbff">${escapeXml(line)}</text>`,
    )
    .join("\n");

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0a0a"/>
      <stop offset="1" stop-color="#1f1f1f"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="80" y="120" width="8" height="150" rx="4" fill="#f97316"/>
  <circle cx="1080" cy="120" r="220" fill="#fb923c" opacity="0.07"/>
  <circle cx="950" cy="520" r="160" fill="#f97316" opacity="0.08"/>
${titleSvg}
  <text x="120" y="555" font-family="DejaVu Sans, sans-serif" font-size="26" fill="#a3a3a3">Crescimento Vertical — IA · Automação · Negócios</text>
</svg>`;

  const buffer = await sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer();

  const payload = await getPayload({ config });
  const media = (await payload.create({
    collection: "media",
    data: { alt: title },
    file: {
      data: buffer,
      mimetype: "image/webp",
      name: "cover.webp",
      size: buffer.length,
    },
    overrideAccess: true,
    context: { generateCover: true },
  })) as unknown as { id: number };

  await payload.update({
    collection: "articles",
    id: articleId,
    data: { heroImage: media.id, publicReviewer: 1 },
    overrideAccess: true,
    context: { generateCover: true },
  });
  console.log("COVER_OK", media.id);
}

main().catch((e) => {
  console.error("ERROR", e?.message ?? e);
  process.exit(1);
});

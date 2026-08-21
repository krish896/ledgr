const fs = require("fs");
const path = require("path");
const { z } = require("zod");
const Anthropic = require("@anthropic-ai/sdk");
const AppError = require("../errors/AppError");
const ValidationError = require("../errors/ValidationError");
const { getReceipt } = require("./receipt.service");

const ocrRequestSchema = z.object({
  receiptImageUrl: z.string().trim().min(1),
});

const ocrVisionSchema = z.object({
  description: z.string().trim().min(1).max(500),
  amount:      z.number().positive(),
  occurredAt:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

const VISION_PROMPT = (today) =>
  `You are a receipt parser. Extract fields from the receipt image and return ONLY a JSON object — no markdown, no explanation, no code fences.

Required fields:
- "description": a concise description of the purchase (1–10 words, e.g. "Dinner at Pizza Hut", "Grocery shopping at DMart")
- "amount": the grand total paid, as a decimal number in Indian Rupees (e.g. 245.50). If multiple totals appear, use the largest/final one.
- "occurredAt": the transaction date in YYYY-MM-DD format. If no date is visible, use today: ${today}.

Return exactly:
{"description":"...","amount":245.50,"occurredAt":"${today}"}`;

function mockVisionResponse() {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        description: "Grocery shopping at DMart",
        amount:      847.50,
        occurredAt:  new Date().toISOString().slice(0, 10),
      }),
    }],
  };
}

async function processOcr(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const mockMode = process.env.OCR_MOCK === "true";

  if (!mockMode && !apiKey) throw new AppError(503, "OCR service is not configured");

  const parsed = ocrRequestSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message);

  const filename = path.basename(parsed.data.receiptImageUrl);
  const { filePath, contentType } = await getReceipt(filename);

  const buffer = await fs.promises.readFile(filePath);
  const base64 = buffer.toString("base64");

  const today = new Date().toISOString().slice(0, 10);

  const response = mockMode
    ? mockVisionResponse()
    : await (new Anthropic({ apiKey })).messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: contentType, data: base64 } },
            { type: "text", text: VISION_PROMPT(today) },
          ],
        }],
      });

  const rawText = response.content[0]?.text ?? "";

  let visionParsed;
  try {
    visionParsed = JSON.parse(rawText);
  } catch {
    throw new ValidationError("OCR could not extract receipt data");
  }

  const visionResult = ocrVisionSchema.safeParse(visionParsed);
  if (!visionResult.success) throw new ValidationError("OCR returned incomplete data");

  const draft = visionResult.data;

  return {
    draft: {
      description:     draft.description,
      amount:          Math.round(draft.amount * 100),
      occurredAt:      draft.occurredAt,
      receiptImageUrl: parsed.data.receiptImageUrl,
    },
  };
}

module.exports = { processOcr };

const fs = require("fs");

jest.mock("@anthropic-ai/sdk");
jest.mock("../receipt.service");

const Anthropic = require("@anthropic-ai/sdk");
const { getReceipt } = require("../receipt.service");
const { processOcr } = require("../ocr.service");
const AppError = require("../../errors/AppError");
const ValidationError = require("../../errors/ValidationError");
const NotFoundError = require("../../errors/NotFoundError");

const VALID_URL = "/uploads/receipts/rcpt_00000000-0000-0000-0000-000000000001.jpg";

function makeVisionResponse(text) {
  return { content: [{ type: "text", text }] };
}

describe("processOcr", () => {
  let mockCreate;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";

    mockCreate = jest.fn();
    Anthropic.mockImplementation(() => ({ messages: { create: mockCreate } }));

    getReceipt.mockResolvedValue({
      filePath: "/fake/uploads/receipts/rcpt_00000000-0000-0000-0000-000000000001.jpg",
      contentType: "image/jpeg",
    });

    jest.spyOn(fs.promises, "readFile").mockResolvedValue(Buffer.from("fake-image-data"));
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    jest.restoreAllMocks();
  });

  describe("API key guard", () => {
    test("throws 503 AppError when ANTHROPIC_API_KEY is not set", async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const err = await processOcr({ receiptImageUrl: VALID_URL }).catch((e) => e);

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(503);
    });
  });

  describe("Request validation", () => {
    test("throws ValidationError when receiptImageUrl is missing", async () => {
      const err = await processOcr({}).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
    });

    test("throws ValidationError when receiptImageUrl is empty string", async () => {
      const err = await processOcr({ receiptImageUrl: "   " }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
    });
  });

  describe("File resolution", () => {
    test("propagates NotFoundError from getReceipt when file does not exist", async () => {
      getReceipt.mockRejectedValue(new NotFoundError("Receipt not found"));

      const err = await processOcr({ receiptImageUrl: VALID_URL }).catch((e) => e);

      expect(err).toBeInstanceOf(NotFoundError);
    });

    test("propagates ValidationError from getReceipt when filename is malformed", async () => {
      getReceipt.mockRejectedValue(new ValidationError("Invalid receipt filename"));

      const err = await processOcr({ receiptImageUrl: "/uploads/receipts/../etc/passwd" }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
    });

    test("extracts filename from receiptImageUrl path before calling getReceipt", async () => {
      mockCreate.mockResolvedValue(makeVisionResponse(
        '{"description":"Test","amount":100,"occurredAt":"2026-08-21"}'
      ));

      await processOcr({ receiptImageUrl: VALID_URL });

      expect(getReceipt).toHaveBeenCalledWith(
        "rcpt_00000000-0000-0000-0000-000000000001.jpg"
      );
    });
  });

  describe("Successful extraction", () => {
    test("returns draft with description, paise amount, date, and receiptImageUrl", async () => {
      mockCreate.mockResolvedValue(makeVisionResponse(
        '{"description":"Dinner at Pizza Hut","amount":245.50,"occurredAt":"2026-08-21"}'
      ));

      const result = await processOcr({ receiptImageUrl: VALID_URL });

      expect(result).toEqual({
        draft: {
          description:     "Dinner at Pizza Hut",
          amount:          24550,
          occurredAt:      "2026-08-21",
          receiptImageUrl: VALID_URL,
        },
      });
    });

    test("converts decimal rupee amount to integer paise", async () => {
      mockCreate.mockResolvedValue(makeVisionResponse(
        '{"description":"Coffee","amount":1.50,"occurredAt":"2026-08-21"}'
      ));

      const { draft } = await processOcr({ receiptImageUrl: VALID_URL });

      expect(draft.amount).toBe(150);
    });

    test("rounds floating-point imprecision correctly (123.99 → 12399)", async () => {
      mockCreate.mockResolvedValue(makeVisionResponse(
        '{"description":"Grocery","amount":123.99,"occurredAt":"2026-08-21"}'
      ));

      const { draft } = await processOcr({ receiptImageUrl: VALID_URL });

      expect(draft.amount).toBe(12399);
    });

    test("passes image as base64 with correct media_type to Vision", async () => {
      mockCreate.mockResolvedValue(makeVisionResponse(
        '{"description":"Test","amount":100,"occurredAt":"2026-08-21"}'
      ));

      await processOcr({ receiptImageUrl: VALID_URL });

      const call = mockCreate.mock.calls[0][0];
      const imageBlock = call.messages[0].content[0];
      expect(imageBlock.type).toBe("image");
      expect(imageBlock.source.type).toBe("base64");
      expect(imageBlock.source.media_type).toBe("image/jpeg");
      expect(typeof imageBlock.source.data).toBe("string");
    });

    test("echoes receiptImageUrl unchanged in the draft", async () => {
      mockCreate.mockResolvedValue(makeVisionResponse(
        '{"description":"Test","amount":50,"occurredAt":"2026-01-15"}'
      ));

      const { draft } = await processOcr({ receiptImageUrl: VALID_URL });

      expect(draft.receiptImageUrl).toBe(VALID_URL);
    });
  });

  describe("Vision response errors", () => {
    test("throws ValidationError when Vision returns non-JSON text", async () => {
      mockCreate.mockResolvedValue(makeVisionResponse("Sorry, I cannot read this image."));

      const err = await processOcr({ receiptImageUrl: VALID_URL }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toBe("OCR could not extract receipt data");
    });

    test("throws ValidationError when Vision JSON is missing amount", async () => {
      mockCreate.mockResolvedValue(makeVisionResponse(
        '{"description":"Test","occurredAt":"2026-08-21"}'
      ));

      const err = await processOcr({ receiptImageUrl: VALID_URL }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toBe("OCR returned incomplete data");
    });

    test("throws ValidationError when Vision returns amount of zero", async () => {
      mockCreate.mockResolvedValue(makeVisionResponse(
        '{"description":"Test","amount":0,"occurredAt":"2026-08-21"}'
      ));

      const err = await processOcr({ receiptImageUrl: VALID_URL }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toBe("OCR returned incomplete data");
    });

    test("throws ValidationError when Vision returns malformed date", async () => {
      mockCreate.mockResolvedValue(makeVisionResponse(
        '{"description":"Test","amount":100,"occurredAt":"21-08-2026"}'
      ));

      const err = await processOcr({ receiptImageUrl: VALID_URL }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toBe("OCR returned incomplete data");
    });

    test("throws ValidationError when Vision returns empty content", async () => {
      mockCreate.mockResolvedValue({ content: [] });

      const err = await processOcr({ receiptImageUrl: VALID_URL }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toBe("OCR could not extract receipt data");
    });

    test("propagates Anthropic SDK errors as-is (becomes 500 via errorHandler)", async () => {
      const networkErr = new Error("Connection refused");
      mockCreate.mockRejectedValue(networkErr);

      const err = await processOcr({ receiptImageUrl: VALID_URL }).catch((e) => e);

      expect(err).toBe(networkErr);
      expect(err).not.toBeInstanceOf(AppError);
    });
  });
});

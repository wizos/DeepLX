/**
 * Microsoft Translator Service Tests
 * Tests the Microsoft Translator integration functionality
 */

import {
  checkMicrosoftAvailability,
  translateWithMicrosoft,
} from "../../src/lib/services/microsoftTranslator";

describe("Microsoft Translator Service", () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("translateWithMicrosoft", () => {
    it("should return successful translation for valid input", async () => {
      // Mock token request
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve("mock-token-12345"),
        } as Response)
        // Mock translation request
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                translations: [{ text: "你好，世界！" }],
                detectedLanguage: {
                  language: "en",
                  score: 0.99,
                },
              },
            ]),
        } as Response);

      const result = await translateWithMicrosoft("Hello, world!", "en", "zh");

      expect(result.code).toBe(200);
      expect(result.data).toBe("你好，世界！");
      expect(result.source_lang).toBe("EN");
      expect(result.target_lang).toBe("ZH");
    });

    it("should handle auto language detection", async () => {
      // Mock token request
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve("mock-token-12345"),
        } as Response)
        // Mock translation request
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                translations: [{ text: "你好，世界！" }],
                detectedLanguage: {
                  language: "en",
                  score: 0.99,
                },
              },
            ]),
        } as Response);

      const result = await translateWithMicrosoft(
        "Hello, world!",
        "auto",
        "zh"
      );

      expect(result.code).toBe(200);
      expect(result.data).toBe("你好，世界！");
    });

    it("should return error response when token acquisition fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      } as Response);

      const result = await translateWithMicrosoft("Hello, world!", "en", "zh");

      expect(result.code).toBe(500);
      expect(result.data).toBeNull();
    });

    it("should return error response when translation API fails", async () => {
      // Mock successful token request
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve("mock-token-12345"),
        } as Response)
        // Mock failed translation request
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          text: () => Promise.resolve("Service unavailable"),
        } as Response);

      const result = await translateWithMicrosoft("Hello, world!", "en", "zh");

      expect(result.code).toBe(500);
      expect(result.data).toBeNull();
    });

    it("should return error response for invalid API response format", async () => {
      // Mock token request
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve("mock-token-12345"),
        } as Response)
        // Mock invalid translation response
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);

      const result = await translateWithMicrosoft("Hello, world!", "en", "zh");

      expect(result.code).toBe(500);
      expect(result.data).toBeNull();
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await translateWithMicrosoft("Hello, world!", "en", "zh");

      expect(result.code).toBe(500);
      expect(result.data).toBeNull();
    });
  });

  describe("checkMicrosoftAvailability", () => {
    it("should return true when service is available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("mock-token-12345"),
      } as Response);

      const isAvailable = await checkMicrosoftAvailability();
      expect(isAvailable).toBe(true);
    });

    it("should return false when service is unavailable", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      } as Response);

      const isAvailable = await checkMicrosoftAvailability();
      expect(isAvailable).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const isAvailable = await checkMicrosoftAvailability();
      expect(isAvailable).toBe(false);
    });
  });
});

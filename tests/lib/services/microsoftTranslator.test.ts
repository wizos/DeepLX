/**
 * Unit tests for Microsoft Translator service
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import { translateWithMicrosoft } from "../../../src/lib/services/microsoftTranslator";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Microsoft Translator Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully translate text", async () => {
    // Mock successful auth token response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("mock-auth-token"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              translations: [
                {
                  text: "你好世界",
                  to: "zh-Hans",
                },
              ],
              detectedLanguage: {
                language: "en",
                score: 1.0,
              },
            },
          ]),
      });

    const result = await translateWithMicrosoft({
      text: "Hello world",
      source_lang: "en",
      target_lang: "zh",
    });

    expect(result.code).toBe(200);
    expect(result.data).toBe("你好世界");
    expect(result.source_lang).toBe("EN");
    expect(result.target_lang).toBe("ZH-HANS");

    // Verify correct API calls
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://edge.microsoft.com/translate/auth",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "User-Agent": expect.stringContaining("Chrome"),
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("api-edge.cognitive.microsofttranslator.com"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer mock-auth-token",
          "content-type": "application/json",
        }),
        body: JSON.stringify([{ Text: "Hello world" }]),
      })
    );
  });

  it("should handle auto language detection", async () => {
    // Mock successful auth token response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("mock-auth-token"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              translations: [
                {
                  text: "Hello world",
                  to: "en",
                },
              ],
              detectedLanguage: {
                language: "zh-Hans",
                score: 0.95,
              },
            },
          ]),
      });

    const result = await translateWithMicrosoft({
      text: "你好世界",
      source_lang: "auto",
      target_lang: "en",
    });

    expect(result.code).toBe(200);
    expect(result.data).toBe("Hello world");
    expect(result.source_lang).toBe("ZH-HANS");
    expect(result.target_lang).toBe("EN");
  });

  it("should handle auth token failure", async () => {
    // Mock failed auth token response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    const result = await translateWithMicrosoft({
      text: "Hello world",
      source_lang: "en",
      target_lang: "zh",
    });

    expect(result.code).toBeGreaterThanOrEqual(400);
    expect(result.data).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should handle translation API failure", async () => {
    // Mock successful auth but failed translation
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("mock-auth-token"),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

    const result = await translateWithMicrosoft({
      text: "Hello world",
      source_lang: "en",
      target_lang: "zh",
    });

    expect(result.code).toBeGreaterThanOrEqual(400);
    expect(result.data).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should handle empty auth token", async () => {
    // Mock empty auth token response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(""),
    });

    const result = await translateWithMicrosoft({
      text: "Hello world",
      source_lang: "en",
      target_lang: "zh",
    });

    expect(result.code).toBeGreaterThanOrEqual(400);
    expect(result.data).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should handle invalid translation response", async () => {
    // Mock successful auth but invalid translation response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("mock-auth-token"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{}]), // Empty translation object
      });

    const result = await translateWithMicrosoft({
      text: "Hello world",
      source_lang: "en",
      target_lang: "zh",
    });

    expect(result.code).toBeGreaterThanOrEqual(400);
    expect(result.data).toBeNull();
  });

  it("should normalize language codes correctly", async () => {
    // Mock successful response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("mock-auth-token"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              translations: [
                {
                  text: "你好世界",
                  to: "zh-Hans",
                },
              ],
              detectedLanguage: {
                language: "en",
                score: 1.0,
              },
            },
          ]),
      });

    await translateWithMicrosoft({
      text: "Hello world",
      source_lang: "EN", // Should be normalized to 'en'
      target_lang: "ZH-CN", // Should be normalized to 'zh-Hans'
    });

    // Check that the URL contains correctly normalized language codes
    const secondCall = mockFetch.mock.calls[1];
    const url = secondCall[0];
    expect(url).toContain("from=en");
    expect(url).toContain("to=zh-hans");
  });
});

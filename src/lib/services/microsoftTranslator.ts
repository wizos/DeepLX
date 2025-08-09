import type { ResponseParams } from "../types";
import { createStandardResponse } from "../types";

/**
 * Get authentication token from Microsoft Edge Translator
 */
async function getToken(): Promise<string> {
  const tokenUrl = "https://edge.microsoft.com/translate/auth";

  try {
    const response = await fetch(tokenUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42",
        Referer: "https://www.bing.com/",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get token: ${response.status} ${response.statusText}`
      );
    }

    const token = await response.text();
    if (!token) {
      throw new Error("Empty token received");
    }

    return token;
  } catch (error) {
    throw new Error(
      `Token acquisition failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Translate text using Microsoft Translator (Edge API)
 */
export async function translateWithMicrosoft(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  options?: any
): Promise<ResponseParams> {
  try {
    // Get authentication token
    const token = await getToken();

    // Use original language codes directly
    const fromLang = sourceLanguage === "auto" ? "" : sourceLanguage;
    const toLang = targetLanguage;

    // Microsoft Translator API endpoint
    const translateUrl =
      "https://api-edge.cognitive.microsofttranslator.com/translate";

    // Prepare request body
    const requestBody = [{ Text: text }];

    // Build query parameters
    const queryParams = new URLSearchParams({
      "api-version": "3.0",
      to: toLang,
      includeSentenceLength: "true",
    });

    // Add from parameter only if not auto-detect
    if (fromLang && fromLang !== "") {
      queryParams.append("from", fromLang);
    }

    const response = await fetch(`${translateUrl}?${queryParams}`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Accept-Language":
          "zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        Pragma: "no-cache",
        "Sec-Ch-Ua":
          '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        Referer: "https://appsumo.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `Microsoft Translator API error: ${response.status} ${response.statusText} - ${errorData}`
      );
      return createStandardResponse(500, null);
    }

    const result = await response.json();

    // Validate response structure
    if (!result || !Array.isArray(result) || result.length === 0) {
      console.error("Invalid response format from Microsoft Translator");
      return createStandardResponse(500, null);
    }

    const translation = result[0];
    if (
      !translation.translations ||
      !Array.isArray(translation.translations) ||
      translation.translations.length === 0
    ) {
      console.error("No translations found in Microsoft Translator response");
      return createStandardResponse(500, null);
    }

    const translatedText = translation.translations[0].text;
    if (!translatedText) {
      console.error("Empty translation result from Microsoft Translator");
      return createStandardResponse(500, null);
    }

    // Determine detected source language
    const detectedLanguage =
      translation.detectedLanguage?.language || sourceLanguage;

    return createStandardResponse(
      200,
      translatedText.trim(),
      Math.floor(Math.random() * 10000000000),
      detectedLanguage,
      targetLanguage
    );
  } catch (error) {
    console.error("Microsoft Translator error:", error);
    return createStandardResponse(500, null);
  }
}

/**
 * Check if Microsoft Translator service is available
 */
export async function checkMicrosoftAvailability(): Promise<boolean> {
  try {
    const token = await getToken();
    return Boolean(token);
  } catch {
    return false;
  }
}

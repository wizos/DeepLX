/**
 * Microsoft Translator integration service
 * Uses Microsoft Edge's translate authentication endpoint
 */

import { createErrorResponse } from "../errorHandler";
import {
  Config,
  createStandardResponse,
  RequestParams,
  ResponseParams,
} from "../types";

/**
 * Language code mapping for Microsoft Translator
 * Maps DeepLX language codes to Microsoft Translator language codes
 */
const LANGUAGE_MAP: Record<string, string> = {
  auto: "",
  zh: "zh-Hans",
  "zh-cn": "zh-Hans",
  "zh-tw": "zh-Hant",
  "zh-hant": "zh-Hant",
  en: "en",
  ja: "ja",
  ko: "ko",
  fr: "fr",
  es: "es",
  ru: "ru",
  de: "de",
  it: "it",
  tr: "tr",
  "pt-pt": "pt-pt",
  "pt-br": "pt",
  pt: "pt",
  vi: "vi",
  id: "id",
  th: "th",
  ms: "ms",
  ar: "ar",
  hi: "hi",
  "mn-cy": "mn-Cyrl",
  "mn-mo": "mn-Mong",
  km: "km",
  "nb-no": "nb",
  nb: "nb",
  fa: "fa",
  sv: "sv",
  pl: "pl",
  nl: "nl",
  uk: "uk",
  he: "he",
};

/**
 * Normalize language code for Microsoft Translator API
 */
function normalizeLanguageCode(lang: string): string {
  const normalized = lang.toLowerCase();
  return LANGUAGE_MAP[normalized] || normalized;
}

/**
 * Get authentication token from Microsoft Edge translate auth endpoint
 */
async function getAuthToken(): Promise<string> {
  const tokenUrl = "https://edge.microsoft.com/translate/auth";

  const response = await fetch(tokenUrl, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get auth token: ${response.status} ${response.statusText}`
    );
  }

  const token = await response.text();
  if (!token || token.trim() === "") {
    throw new Error("Empty auth token received");
  }

  return token.trim();
}

/**
 * Translate text using Microsoft Translator API
 * @param params - Translation parameters (text, source_lang, target_lang)
 * @param config - Configuration options
 * @returns Translation response in DeepLX format
 */
export async function translateWithMicrosoft(
  params: RequestParams,
  config?: Config & { env?: any; clientIP?: string }
): Promise<ResponseParams> {
  try {
    const { text, source_lang, target_lang } = params;

    // Get authentication token
    const authToken = await getAuthToken();

    // Normalize language codes
    const fromLang = normalizeLanguageCode(source_lang);
    const toLang = normalizeLanguageCode(target_lang);

    // Construct the API URL with query parameters
    const apiUrl = new URL(
      "https://api-edge.cognitive.microsofttranslator.com/translate"
    );
    apiUrl.searchParams.append("from", fromLang);
    apiUrl.searchParams.append("to", toLang);
    apiUrl.searchParams.append("api-version", "3.0");
    apiUrl.searchParams.append("includeSentenceLength", "true");

    // Prepare request body
    const requestBody = [{ Text: text }];

    // Make the translation request
    const response = await fetch(apiUrl.toString(), {
      method: "POST",
      headers: {
        accept: "*/*",
        "accept-language":
          "zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5",
        authorization: `Bearer ${authToken}`,
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
        "sec-ch-ua":
          '"Microsoft Edge";v="120", "Chromium";v="120", "Not-A.Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        Referer: "https://translator.microsoft.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Microsoft Translator API responded with status ${response.status}: ${response.statusText}`
      );
    }

    const responseData = await response.json();

    // Parse the response
    if (!Array.isArray(responseData) || responseData.length === 0) {
      throw new Error("Invalid response format from Microsoft Translator");
    }

    const firstResult = responseData[0];
    if (!firstResult.translations || !Array.isArray(firstResult.translations)) {
      throw new Error("No translations found in response");
    }

    const translation = firstResult.translations[0];
    if (!translation || !translation.text) {
      throw new Error("Empty translation result");
    }

    const translatedText = translation.text.trim();

    // Detect source language if auto-detection was used
    const detectedSourceLang =
      firstResult.detectedLanguage?.language || fromLang;

    // Format the response to match the DeepLX API
    return createStandardResponse(
      200,
      translatedText,
      Math.floor(Math.random() * 10000000000),
      detectedSourceLang.toUpperCase(),
      toLang.toUpperCase()
    );
  } catch (error) {
    console.error("Error in Microsoft Translator:", error);

    const errorResponse = createErrorResponse(error, {
      endpoint: "/microsoft",
      clientIP: config?.clientIP || "unknown",
    });

    return errorResponse.response;
  }
}

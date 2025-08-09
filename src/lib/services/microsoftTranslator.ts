/**
 * Microsoft Translator integration service
 * Provides Microsoft Translator functionality with DeepLX-compatible API format
 * Uses the unofficial edge.microsoft.com endpoint
 */

import { createErrorResponse } from "../errorHandler";
import {
  Config,
  createStandardResponse,
  RequestParams,
  ResponseParams,
} from "../types";

/**
 * Translate text using Microsoft Translator edge API
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

    // Construct the request to Microsoft Translator edge API
    const microsoftApiUrl = new URL(
      "https://api.cognitive.microsofttranslator.com/translate"
    );
    microsoftApiUrl.searchParams.append("api-version", "3.0");
    microsoftApiUrl.searchParams.append("to", target_lang.toLowerCase());

    if (source_lang !== "auto") {
      microsoftApiUrl.searchParams.append("from", source_lang.toLowerCase());
    }

    // Prepare request body in Microsoft Translator format
    const requestBody = [{ Text: text }];

    // Make the fetch call to Microsoft Translator
    const microsoftResponse = await fetch(microsoftApiUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        // Note: This is using the unofficial API without authentication
        // In production, you would need proper authentication headers
      },
      body: JSON.stringify(requestBody),
    });

    if (!microsoftResponse.ok) {
      throw new Error(
        `Microsoft Translator API responded with status ${microsoftResponse.status}`
      );
    }

    const microsoftResponseBody = await microsoftResponse.json();

    // Parse Microsoft Translator response
    if (
      !microsoftResponseBody ||
      !Array.isArray(microsoftResponseBody) ||
      microsoftResponseBody.length === 0
    ) {
      throw new Error("Invalid response format from Microsoft Translator");
    }

    const translation = microsoftResponseBody[0];
    if (!translation.translations || translation.translations.length === 0) {
      throw new Error(
        "No translation result received from Microsoft Translator"
      );
    }

    const translatedText = translation.translations[0].text;
    const detectedSourceLang =
      translation.detectedLanguage?.language || source_lang;

    if (!translatedText) {
      throw new Error("Empty translation result from Microsoft Translator");
    }

    // Format the response to match the DeepLX API
    return createStandardResponse(
      200,
      translatedText,
      Math.floor(Math.random() * 10000000000),
      detectedSourceLang.toUpperCase(),
      target_lang.toUpperCase()
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

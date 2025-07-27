/**
 * HTML content preservation utilities for DeepLX API
 * Handles HTML tags and entities to prevent corruption during translation
 */

/**
 * HTML tag and entity patterns for preservation
 */
const HTML_PATTERNS = {
  // HTML tags (opening and closing)
  TAGS: /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[^>]*)?>/g,
  // HTML entities
  ENTITIES: /&(?:[a-zA-Z][a-zA-Z0-9]*|#(?:\d+|x[0-9a-fA-F]+));/g,
  // Common punctuation that might be converted
  PUNCTUATION: /[:：]/g,
};

/**
 * Placeholder patterns for temporary replacement
 * Using a format that's less likely to be modified by translation services
 */
const PLACEHOLDER_PREFIX = "ĦĐŁXĦ";
const PLACEHOLDER_SUFFIX = "ĦĐŁXĦ";

/**
 * Storage for preserved content during translation
 */
interface PreservedContent {
  placeholders: Map<string, string>;
  counter: number;
}

/**
 * Create a unique placeholder for preserved content
 * @param content The content to preserve
 * @param preserved The preservation storage object
 * @returns The placeholder string
 */
function createPlaceholder(
  content: string,
  preserved: PreservedContent
): string {
  // Use a more unique format that's less likely to be translated
  const placeholder = `${PLACEHOLDER_PREFIX}${preserved.counter
    .toString()
    .padStart(3, "0")}${PLACEHOLDER_SUFFIX}`;
  preserved.placeholders.set(placeholder, content);
  preserved.counter++;
  return placeholder;
}

/**
 * Preserve HTML tags and entities before translation
 * Replaces HTML content with placeholders to prevent corruption
 * @param text The text containing HTML content
 * @returns Object with processed text and preservation data
 */
export function preserveHtmlContent(text: string): {
  processedText: string;
  preserved: PreservedContent;
} {
  const preserved: PreservedContent = {
    placeholders: new Map(),
    counter: 0,
  };

  let processedText = text;

  // Preserve HTML tags
  processedText = processedText.replace(HTML_PATTERNS.TAGS, (match) => {
    return createPlaceholder(match, preserved);
  });

  // Preserve HTML entities
  processedText = processedText.replace(HTML_PATTERNS.ENTITIES, (match) => {
    return createPlaceholder(match, preserved);
  });

  // Preserve colons to prevent conversion to Chinese colons
  processedText = processedText.replace(/:/g, (match) => {
    return createPlaceholder(match, preserved);
  });

  return { processedText, preserved };
}

/**
 * Restore preserved HTML content after translation
 * Replaces placeholders with original HTML content
 * @param translatedText The translated text with placeholders
 * @param preserved The preservation data from preserveHtmlContent
 * @returns The text with restored HTML content
 */
export function restoreHtmlContent(
  translatedText: string,
  preserved: PreservedContent
): string {
  let restoredText = translatedText;

  // Restore all preserved content - handle case-insensitive matching
  for (const [placeholder, originalContent] of preserved.placeholders) {
    // Create case-insensitive regex to handle lowercase conversion
    const regex = new RegExp(
      placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );
    restoredText = restoredText.replace(regex, originalContent);
  }

  // Additional cleanup: fix any remaining Chinese colons that might have been introduced
  restoredText = restoredText.replace(/：/g, ":");

  return restoredText;
}

/**
 * Check if text contains HTML content that should be preserved
 * @param text The text to check
 * @returns True if the text contains HTML content
 */
export function containsHtmlContent(text: string): boolean {
  return HTML_PATTERNS.TAGS.test(text) || HTML_PATTERNS.ENTITIES.test(text);
}

/**
 * Sanitize HTML content while preserving structure
 * Removes potentially dangerous HTML while keeping formatting tags
 * @param text The text to sanitize
 * @returns Sanitized text with safe HTML preserved
 */
export function sanitizeHtmlContent(text: string): string {
  // Allow only safe formatting tags
  const SAFE_TAGS =
    /^<\/?(?:strong|b|em|i|u|code|pre|span|div|p|br|hr)(?:\s+[^>]*)?>/i;

  return text.replace(HTML_PATTERNS.TAGS, (match) => {
    if (SAFE_TAGS.test(match)) {
      return match; // Keep safe tags
    }
    return ""; // Remove unsafe tags
  });
}

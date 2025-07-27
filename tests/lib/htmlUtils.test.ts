/**
 * Tests for HTML utilities - HTML content preservation functionality
 */

import {
  containsHtmlContent,
  preserveHtmlContent,
  restoreHtmlContent,
  sanitizeHtmlContent,
} from "../../src/lib/htmlUtils";

describe("HTML Utils", () => {
  describe("containsHtmlContent", () => {
    it("should detect HTML tags", () => {
      expect(containsHtmlContent("<strong>Hello</strong>")).toBe(true);
      expect(containsHtmlContent("<code>test</code>")).toBe(true);
      expect(containsHtmlContent("Hello world")).toBe(false);
    });

    it("should detect HTML entities", () => {
      expect(containsHtmlContent("&lt;test&gt;")).toBe(true);
      expect(containsHtmlContent("&amp;")).toBe(true);
      expect(containsHtmlContent("Hello world")).toBe(false);
    });
  });

  describe("preserveHtmlContent and restoreHtmlContent", () => {
    it("should preserve and restore HTML tags", () => {
      const originalText = "<strong>A</strong>: <code>B</code>";
      const { processedText, preserved } = preserveHtmlContent(originalText);

      // The processed text should not contain HTML tags
      expect(processedText).not.toContain("<strong>");
      expect(processedText).not.toContain("</strong>");
      expect(processedText).not.toContain("<code>");
      expect(processedText).not.toContain("</code>");

      // Should contain placeholders
      expect(processedText).toContain("ĦĐŁXĦ");

      // Restore should bring back original content
      const restoredText = restoreHtmlContent(processedText, preserved);
      expect(restoredText).toBe(originalText);
    });

    it("should preserve colons to prevent Chinese colon conversion", () => {
      const originalText = "Hello: World";
      const { processedText, preserved } = preserveHtmlContent(originalText);

      // The processed text should not contain colons
      expect(processedText).not.toContain(":");
      expect(processedText).toContain("ĦĐŁXĦ");

      // Restore should bring back original colon
      const restoredText = restoreHtmlContent(processedText, preserved);
      expect(restoredText).toBe(originalText);
    });

    it("should handle complex HTML with multiple tags", () => {
      const originalText =
        "<strong>Bold</strong> and <em>italic</em>: <code>code here</code>";
      const { processedText, preserved } = preserveHtmlContent(originalText);

      // Should not contain any HTML tags
      expect(processedText).not.toMatch(/<[^>]+>/);
      expect(processedText).not.toContain(":");

      // Should contain placeholders
      expect(processedText).toContain("ĦĐŁXĦ");

      // Restore should bring back all original content
      const restoredText = restoreHtmlContent(processedText, preserved);
      expect(restoredText).toBe(originalText);
    });

    it("should fix Chinese colons in translated text", () => {
      const originalText = "Hello: World";
      const { processedText, preserved } = preserveHtmlContent(originalText);

      // Simulate translation that introduces Chinese colon
      const translatedWithChineseColon = processedText.replace(
        "World",
        "世界：extra"
      );

      const restoredText = restoreHtmlContent(
        translatedWithChineseColon,
        preserved
      );

      // Should restore original colon and fix any Chinese colons
      expect(restoredText).toContain("Hello: 世界:extra");
      expect(restoredText).not.toContain("：");
    });

    it("should handle placeholders being converted to lowercase", () => {
      const originalText = "<strong>A B </strong>";
      const { processedText, preserved } = preserveHtmlContent(originalText);

      // Simulate what happens when placeholders get converted to lowercase
      const lowercasePlaceholders = processedText.toLowerCase();

      const restoredText = restoreHtmlContent(lowercasePlaceholders, preserved);

      // Should restore the original HTML tags correctly
      expect(restoredText).toBe("<strong>a b </strong>");
      expect(restoredText).toContain("<strong>");
      expect(restoredText).toContain("</strong>");
    });
  });

  describe("sanitizeHtmlContent", () => {
    it("should keep safe HTML tags", () => {
      const safeHtml =
        "<strong>Bold</strong> <code>code</code> <em>italic</em>";
      const sanitized = sanitizeHtmlContent(safeHtml);
      expect(sanitized).toBe(safeHtml);
    });

    it("should remove unsafe HTML tags", () => {
      const unsafeHtml = "<script>alert('xss')</script><strong>Safe</strong>";
      const sanitized = sanitizeHtmlContent(unsafeHtml);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("</script>");
      expect(sanitized).toContain("<strong>Safe</strong>");
    });
  });
});

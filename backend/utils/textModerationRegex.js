// backend/utils/textModerationRegex.js

export function filterBadWords(text) {
  if (!text) return text;

  const patterns = [
    /ค[^\s]*ว[^\s]*ย/gi,
    /เหี้ย/gi,
    /สัส/gi,
    /fuck/gi,
    /bitch/gi,
    /pussy/gi,
  ];

  let cleaned = text;
  patterns.forEach((p) => {
    cleaned = cleaned.replace(p, "***");
  });

  return cleaned;
}

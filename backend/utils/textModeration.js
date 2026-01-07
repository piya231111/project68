import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BAD_WORDS_PATH = path.join(__dirname, "badwords.txt");

const BAD_WORDS = fs
  .readFileSync(BAD_WORDS_PATH, "utf-8")
  .split("\n")
  .map((w) => w.trim())
  .filter(Boolean);

function wordToPattern(word) {
  return word
    .split("")
    .map((c) => `${c}+`)
    .join("[ ._]*");
}

const testPatterns = BAD_WORDS.map(
  (word) => new RegExp(wordToPattern(word), "i")
);

const replacePatterns = BAD_WORDS.map(
  (word) => new RegExp(wordToPattern(word), "gi")
);

export function hasBadWords(text) {
  if (!text) return false;
  return testPatterns.some((p) => p.test(text));
}

export function censorText(text) {
  if (!text) return text;

  let cleaned = text;
  replacePatterns.forEach((p) => {
    cleaned = cleaned.replace(p, "***");
  });

  return cleaned;
}

export async function moderateText(text) {
  if (!text || text.length < 3) return text;

  if (!hasBadWords(text)) {
    return text;
  }

  return censorText(text);
}

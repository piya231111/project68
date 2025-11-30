// backend/utils/textModeration.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ฟังก์ชันหน่วงเวลา
function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function moderateText(text) {
  // ----------------------------------------
  // 0) ลดภาระ API — ถ้าข้อความสั้น < 5 ตัว ไม่ตรวจ
  // ----------------------------------------
  if (!text || text.trim().length < 5) return text;

  // จำกัดข้อความ ไม่ให้ยาวเกิน 300 ตัว
  const safeText = text.slice(0, 300);

  // ----------------------------------------
  // ระบบ Retry สูงสุด 3 ครั้ง
  // ----------------------------------------
  let retry = 0;
  const maxRetry = 3;

  while (retry < maxRetry) {
    try {
      // ------------------------------
      // 1) MODERATION API
      // ------------------------------
      const mod = await client.moderations.create({
        model: "omni-moderation-latest",
        input: safeText,
      });

      const categories = mod.results?.[0]?.categories || {};

      const isToxic =
        categories.harassment ||
        categories.hate ||
        categories.violence ||
        categories["harassment/threatening"];

      if (!isToxic) return safeText;

      // ------------------------------
      // 2) CLEAN / REWRITE MESSAGE
      // ------------------------------
      const clean = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Rewrite this message to be polite, friendly, and non-toxic. Keep the meaning but remove harmful language.",
          },
          { role: "user", content: safeText },
        ],
        max_tokens: 60,
      });

      return clean.choices[0].message.content.trim();

    } catch (err) {
      // ถ้าโดน Rate Limit → retry + delay เพิ่ม
      if (err.status === 429) {
        retry++;
        console.log(`⏳ Moderation RateLimit: retry ${retry}/${maxRetry}`);
        await wait(500 * retry); // 500ms → 1s → 1.5s
        continue;
      }

      // ข้อผิดพลาดอื่น → ส่งข้อความเดิม
      console.error("moderateText error:", err);
      return safeText;
    }
  }

  console.error("❌ moderation failed after retries");
  return safeText;
}

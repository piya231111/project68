// src/utils/textModeration.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

// วิเคราะห์ข้อความว่ามี Toxic หรือไม่
export async function isTextToxic(text) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",       // เร็ว + ถูก
      messages: [
        {
          role: "system",
          content:
            "คุณคือโมเดลตรวจสอบข้อความ ถ้าข้อความมีคำหยาบ, ด่า, bully, hate speech, sexual, toxic — ให้ตอบว่า 'toxic'. ถ้าปกติ ให้ตอบ 'clean'.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 5,
    });

    const result = response.choices[0].message.content.trim().toLowerCase();
    return result.includes("toxic");

  } catch (err) {
    console.error("AI Toxic Check error:", err);
    return false; // ส่งได้ (กันระบบล่ม)
  }
}

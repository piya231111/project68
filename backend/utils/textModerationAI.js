// backend/utils/textModerationAI.js

// คำหยาบที่ต้อง moderate
const badPatterns = [
  /ค+[ ._]*ว+[ ._]*ย+/gi,
  /เห+[ ._]*ี้+[ ._]*ย+/gi,
  /ส+[ ._]*ั+[ ._]*ส+/gi,
  /fu+ck+/gi,
  /bit+ch+/gi,
  /pu+ssy+/gi,
  /k+[ ._]*u+[ ._]*y+/gi,
];

// ฟังก์ชันเบื้องต้นแทน AI ก่อน
function basicCensor(text) {
  let cleaned = text;
  badPatterns.forEach((p) => (cleaned = cleaned.replace(p, "***")));
  return cleaned;
}

// ตรวจว่ามีคำหยาบไหม
function hasBadWords(text) {
  return badPatterns.some((p) => p.test(text));
}

// ฟังก์ชันหลัก
export async function aiModerate(text) {
  if (!text || text.length < 3) return text;

  // ถ้าไม่มีคำหยาบ → ไม่ต้องเรียก AI เลย
  if (!hasBadWords(text)) {
    return text;
  }

  // ถ้ามีคำหยาบ → ใช้ censor แบบพื้นฐานทันที (เร็วมาก)
  const cleaned = basicCensor(text);

  // ส่ง version censored กลับไปทันที
  return cleaned;
}

// src/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:7000/api",
});

// ✅ ฟังก์ชันสำหรับแนบ token หลัง login หรือ register
export function setToken(token) {
  if (token) {
    localStorage.setItem("token", token);  // ✅ ใช้ชื่อ "token"
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");       // ✅ ใช้ชื่อ "token"
    delete api.defaults.headers.common["Authorization"];
  }
}

// ✅ Interceptor: แนบ token อัตโนมัติทุกครั้งที่เรียก API
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");  // ✅ ใช้ชื่อ "token"
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ ฟังก์ชันสมัครผู้ใช้ใหม่
export async function registerUser(userData) {
  const res = await api.post("/users", userData);
  return res.data;
}

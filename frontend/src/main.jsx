// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { setToken } from "./api"; // ✅ เพิ่มตรงนี้

// ⬇️ ใช้ Client ID ที่คุณได้จาก Google
const GOOGLE_CLIENT_ID =
  "1463906185-vpfradk3p376km81ga5co869cq6g3ntf.apps.googleusercontent.com";

// ✅ โหลด token จาก localStorage แล้วแนบให้ axios ทุกครั้งที่เริ่มแอป
const savedToken = localStorage.getItem("token");
if (savedToken) setToken(savedToken);

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);


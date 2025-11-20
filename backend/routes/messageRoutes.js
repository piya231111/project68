import express from "express";
import { createMessage, getMessagesByRoom } from "../models/messageModel.js";
const router = express.Router();

router.get("/:roomId", async (req, res) => {
  const messages = await getMessagesByRoom(req.params.roomId);
  res.json(messages);
});

router.post("/", async (req, res) => {
  const { roomId, senderId, type, content } = req.body;
  const newMessage = await createMessage(roomId, senderId, type, content);
  res.status(201).json(newMessage);
});

export default router;

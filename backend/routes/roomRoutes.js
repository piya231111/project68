import express from "express";
import { createRoom, getAllRooms, getRoomMembers } from "../models/roomModel.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const rooms = await getAllRooms();
  res.json(rooms);
});

router.get("/:roomId/members", async (req, res) => {
  const members = await getRoomMembers(req.params.roomId);
  res.json(members);
});

router.post("/", async (req, res) => {
  const { name, type, createdById } = req.body;
  const room = await createRoom(name, type, createdById);
  res.status(201).json(room);
});

export default router;

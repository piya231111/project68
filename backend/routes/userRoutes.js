import express from "express";
import { getAllUsers, createUser, getUserById } from "../models/userModel.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const users = await getAllUsers();
  res.json(users);
});

router.get("/:id", async (req, res) => {
  const user = await getUserById(req.params.id);
  res.json(user);
});

router.post("/", async (req, res) => {
  const { email, password, displayName } = req.body;
  const newUser = await createUser(email, password, displayName);
  res.status(201).json(newUser);
});

export default router;

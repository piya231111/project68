import express from "express";
import { createProfile, getProfileByUserId, updateProfile } from "../models/profileModel.js";
const router = express.Router();

router.get("/:userId", async (req, res) => {
  const profile = await getProfileByUserId(req.params.userId);
  res.json(profile);
});

router.post("/", async (req, res) => {
  const { userId, country, avatarId, itemId, interests, bio } = req.body;
  const newProfile = await createProfile(userId, country, avatarId, itemId, interests, bio);
  res.status(201).json(newProfile);
});

router.patch("/:userId", async (req, res) => {
  const updated = await updateProfile(req.params.userId, req.body.bio);
  res.json(updated);
});

export default router;

import express from "express";
import pool from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Create organization — super_admin only
router.post(
  "/",
  authenticate,
  requireRole("super_admin"),
  async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name required" });
    }

    try {
      const result = await pool.query(
        "INSERT INTO organizations (name) VALUES ($1) RETURNING *",
        [name]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === "23505") {
        return res
          .status(409)
          .json({ error: "Organization name already exists" });
      }

      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// List all organizations — super_admin only
router.get(
  "/",
  authenticate,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM organizations ORDER BY created_at DESC"
      );

      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// List organizations for signup page — public
router.get("/public", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM organizations ORDER BY name"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
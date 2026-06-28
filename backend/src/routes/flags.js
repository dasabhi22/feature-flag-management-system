import express from "express";
import pool from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Get all flags for the logged-in admin's organization
router.get("/", authenticate, requireRole("org_admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM feature_flags
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [req.user.organizationId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a feature flag
router.post("/", authenticate, requireRole("org_admin"), async (req, res) => {
  const { feature_key, is_enabled } = req.body;

  if (!feature_key) {
    return res.status(400).json({ error: "feature_key required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO feature_flags
      (feature_key, is_enabled, organization_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        feature_key.toLowerCase().trim(),
        is_enabled ?? false,
        req.user.organizationId,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Feature key already exists for this organization",
      });
    }

    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update a feature flag
router.patch("/:id", authenticate, requireRole("org_admin"), async (req, res) => {
  const { id } = req.params;
  const { is_enabled } = req.body;

  try {
    const check = await pool.query(
      `SELECT id
       FROM feature_flags
       WHERE id = $1
       AND organization_id = $2`,
      [id, req.user.organizationId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Flag not found" });
    }

    const result = await pool.query(
      `UPDATE feature_flags
       SET is_enabled = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [is_enabled, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a feature flag
router.delete("/:id", authenticate, requireRole("org_admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query(
      `SELECT id
       FROM feature_flags
       WHERE id = $1
       AND organization_id = $2`,
      [id, req.user.organizationId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Flag not found" });
    }

    await pool.query(
      "DELETE FROM feature_flags WHERE id = $1",
      [id]
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Public endpoint used by the User App
router.get("/check", async (req, res) => {
  const { feature_key, organization_id } = req.query;

  if (!feature_key || !organization_id) {
    return res.status(400).json({
      error: "feature_key and organization_id required",
    });
  }

  try {
    const result = await pool.query(
      `SELECT is_enabled
       FROM feature_flags
       WHERE feature_key = $1
       AND organization_id = $2`,
      [
        feature_key.toLowerCase().trim(),
        organization_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.json({
        exists: false,
        is_enabled: false,
        message: "Feature flag not found",
      });
    }

    res.json({
      exists: true,
      is_enabled: result.rows[0].is_enabled,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
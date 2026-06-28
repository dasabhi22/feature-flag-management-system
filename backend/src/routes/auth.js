import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();

// Login — works for all roles
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const result = await pool.query(
      `SELECT u.*, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role_name,
        organizationId: user.organization_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role_name,
        organizationId: user.organization_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Signup — only for org_admin role
router.post("/signup", async (req, res) => {
  const { email, password, organizationId } = req.body;

  if (!email || !password || !organizationId) {
    return res.status(400).json({
      error: "Email, password, and organizationId required",
    });
  }

  try {
    // Check organization exists
    const orgResult = await pool.query(
      "SELECT id FROM organizations WHERE id = $1",
      [organizationId]
    );

    if (orgResult.rows.length === 0) {
      return res.status(400).json({ error: "Organization not found" });
    }

    // Check email not taken
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = 'org_admin'"
    );

    const roleId = roleResult.rows[0].id;

    const newUser = await pool.query(
      `INSERT INTO users (email, password_hash, role_id, organization_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email`,
      [email, hash, roleId, organizationId]
    );

    res.status(201).json({
      message: "Account created",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
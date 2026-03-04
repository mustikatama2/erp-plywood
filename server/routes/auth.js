const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const pool    = require("../db/pool");

const SECRET  = process.env.JWT_SECRET || "dev_secret_change_in_production";
const EXPIRES = "12h";

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username dan password wajib diisi" });

  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND is_active = true LIMIT 1",
      [username.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Username atau password salah" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Username atau password salah" });

    const payload = {
      id: user.id, username: user.username, name: user.name,
      role: user.role, dept: user.dept, avatar: user.avatar, avatarColor: user.avatar_color,
    };
    const token = jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

    // Update last_login
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    res.json({ token, user: payload });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/logout  (client just drops token, but we log it)
router.post("/logout", (req, res) => res.json({ ok: true }));

// GET /api/auth/me  (validate token)
router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

// ── Middleware ───────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "Token tidak ditemukan" });
  try {
    req.user = jwt.verify(header.slice(7), SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token tidak valid atau sudah kadaluarsa" });
  }
}

module.exports = router;
module.exports.requireAuth = requireAuth;

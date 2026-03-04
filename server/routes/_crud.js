/**
 * Generic CRUD factory — generates standard REST endpoints for a PostgreSQL table.
 * Usage: module.exports = crud("customers", { searchCols: ["name","code","country"] })
 */
const router = require("express").Router;
const pool   = require("../db/pool");
const { requireAuth } = require("./auth");

module.exports = function crud(table, opts = {}) {
  const r = router();
  const { searchCols = [], defaultSort = "created_at DESC", joins = "" } = opts;

  // All routes require auth
  r.use(requireAuth);

  // GET / — list with optional search + pagination
  r.get("/", async (req, res) => {
    try {
      const { q = "", limit = 200, offset = 0 } = req.query;
      let where = "WHERE 1=1";
      const params = [];
      if (q && searchCols.length) {
        const conditions = searchCols.map((col, i) => `${col}::text ILIKE $${i+1}`);
        where += ` AND (${conditions.join(" OR ")})`;
        searchCols.forEach(() => params.push(`%${q}%`));
      }
      const query = `SELECT * FROM ${table} ${joins} ${where} ORDER BY ${defaultSort} LIMIT ${limit} OFFSET ${offset}`;
      const { rows } = await pool.query(query, params);
      res.json({ data: rows, count: rows.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /:id
  r.get("/:id", async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      res.json({ data: rows[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST / — create
  r.post("/", async (req, res) => {
    try {
      const body = { ...req.body };
      delete body.id; // let DB generate
      body.created_by  = req.user?.id;
      body.updated_at  = new Date();
      body.synced      = false; // mark as needing sync
      const keys   = Object.keys(body).filter(k => body[k] !== undefined);
      const values = keys.map(k => body[k]);
      const cols   = keys.join(", ");
      const placeholders = keys.map((_, i) => `$${i+1}`).join(", ");
      const { rows } = await pool.query(
        `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json({ data: rows[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /:id — partial update
  r.patch("/:id", async (req, res) => {
    try {
      const body = { ...req.body };
      delete body.id;
      body.updated_at = new Date();
      body.synced     = false;
      const keys   = Object.keys(body).filter(k => body[k] !== undefined);
      const values = keys.map(k => body[k]);
      const sets   = keys.map((k, i) => `${k} = $${i+1}`).join(", ");
      const { rows } = await pool.query(
        `UPDATE ${table} SET ${sets} WHERE id = $${keys.length+1} RETURNING *`,
        [...values, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      res.json({ data: rows[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE /:id — soft delete (set deleted_at) or hard delete
  r.delete("/:id", async (req, res) => {
    try {
      // soft delete if column exists
      const { rows } = await pool.query(
        `UPDATE ${table} SET deleted_at = NOW(), synced = false WHERE id = $1 RETURNING id`,
        [req.params.id]
      ).catch(() =>
        pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id])
      );
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};

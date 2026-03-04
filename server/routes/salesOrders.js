const router = require("express").Router();
const pool   = require("../db/pool");
const { requireAuth } = require("./auth");

router.use(requireAuth);

// GET / — list with customer name joined
router.get("/", async (req, res) => {
  try {
    const { q = "", status } = req.query;
    const params = [];
    let where = "WHERE so.deleted_at IS NULL";
    if (status && status !== "All") { params.push(status); where += ` AND so.status = $${params.length}`; }
    if (q) { params.push(`%${q}%`); where += ` AND (so.so_no ILIKE $${params.length} OR c.name ILIKE $${params.length})`; }
    const { rows } = await pool.query(`
      SELECT so.*, c.name AS customer_name, c.country AS customer_country,
             c.payment_terms AS customer_payment_terms
      FROM sales_orders so
      LEFT JOIN customers c ON c.id = so.customer_id
      ${where}
      ORDER BY so.created_at DESC
      LIMIT 200
    `, params);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /:id — with lines
router.get("/:id", async (req, res) => {
  try {
    const [so, lines] = await Promise.all([
      pool.query(`SELECT so.*, c.name AS customer_name FROM sales_orders so LEFT JOIN customers c ON c.id = so.customer_id WHERE so.id = $1`, [req.params.id]),
      pool.query(`SELECT sol.*, p.name AS product_name FROM so_lines sol LEFT JOIN products p ON p.id = sol.product_id WHERE sol.so_id = $1 ORDER BY sol.line_no`, [req.params.id]),
    ]);
    if (!so.rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ data: { ...so.rows[0], lines: lines.rows } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST / — create SO with lines
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { lines = [], ...head } = req.body;
    const subtotal = lines.reduce((s, l) => s + (Number(l.qty) * Number(l.unit_price)), 0);
    // Generate SO number
    const { rows: [cnt] } = await client.query("SELECT COUNT(*) FROM sales_orders");
    const so_no = `SO-${new Date().getFullYear()}-${String(Number(cnt.count)+1).padStart(4,"0")}`;
    const { rows: [so] } = await client.query(`
      INSERT INTO sales_orders (so_no, customer_id, date, delivery_date, status, currency,
        incoterm, payment_terms, subtotal, total, notes, created_by, synced)
      VALUES ($1,$2,NOW(),$3,'Draft',$4,$5,$6,$7,$7,$8,$9,false) RETURNING *`,
      [so_no, head.customer_id, head.delivery_date, head.currency, head.incoterm,
       head.payment_terms, subtotal, head.notes||null, req.user?.id]);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await client.query(`
        INSERT INTO so_lines (so_id, line_no, product_id, product_name, qty, unit, unit_price, total)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [so.id, i+1, l.product_id||null, l.product||l.product_name, Number(l.qty),
         l.unit||"sheets", Number(l.unit_price), Number(l.qty)*Number(l.unit_price)]);
    }
    await client.query("COMMIT");
    res.status(201).json({ data: so });
  } catch (e) { await client.query("ROLLBACK"); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

// PATCH /:id/status — quick status update
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query(
      `UPDATE sales_orders SET status=$1, updated_at=NOW(), synced=false WHERE id=$2 RETURNING *`,
      [status, req.params.id]);
    res.json({ data: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

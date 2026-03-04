const router = require("express").Router();
const pool   = require("../db/pool");
const { requireAuth } = require("./auth");
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT po.*, v.name AS vendor_name FROM purchase_orders po
      LEFT JOIN vendors v ON v.id = po.vendor_id
      WHERE po.deleted_at IS NULL ORDER BY po.created_at DESC LIMIT 200`);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [po, lines] = await Promise.all([
      pool.query(`SELECT po.*, v.name AS vendor_name FROM purchase_orders po LEFT JOIN vendors v ON v.id = po.vendor_id WHERE po.id=$1`, [req.params.id]),
      pool.query(`SELECT * FROM po_lines WHERE po_id=$1 ORDER BY line_no`, [req.params.id]),
    ]);
    if (!po.rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ data: { ...po.rows[0], lines: lines.rows } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { lines = [], ...head } = req.body;
    const total = lines.reduce((s, l) => s + Number(l.qty)*Number(l.unit_price), 0);
    const { rows: [cnt] } = await client.query("SELECT COUNT(*) FROM purchase_orders");
    const po_no = `PO-${new Date().getFullYear()}-${String(Number(cnt.count)+1).padStart(4,"0")}`;
    const { rows: [po] } = await client.query(`
      INSERT INTO purchase_orders (po_no, vendor_id, date, delivery_date, status, total, notes, created_by, synced)
      VALUES ($1,$2,NOW(),$3,'Draft',$4,$5,$6,false) RETURNING *`,
      [po_no, head.vendor_id, head.delivery_date, total, head.notes||null, req.user?.id]);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await client.query(`INSERT INTO po_lines (po_id,line_no,product_name,qty,unit,unit_price,total) VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [po.id, i+1, l.product, Number(l.qty), l.unit, Number(l.unit_price), Number(l.qty)*Number(l.unit_price)]);
    }
    await client.query("COMMIT");
    res.status(201).json({ data: po });
  } catch (e) { await client.query("ROLLBACK"); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { rows } = await pool.query(`UPDATE purchase_orders SET status=$1,updated_at=NOW(),synced=false WHERE id=$2 RETURNING *`, [req.body.status, req.params.id]);
    res.json({ data: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

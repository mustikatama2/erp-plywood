const router = require("express").Router();
const pool   = require("../db/pool");
const { requireAuth } = require("./auth");
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let where = "WHERE inv.deleted_at IS NULL";
    const params = [];
    if (status && status !== "All") { params.push(status); where += ` AND inv.status=$${params.length}`; }
    const { rows } = await pool.query(`
      SELECT inv.*, c.name AS customer_name, c.country
      FROM ar_invoices inv LEFT JOIN customers c ON c.id = inv.customer_id
      ${where} ORDER BY inv.due_date ASC LIMIT 500`, params);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await pool.query(`
      INSERT INTO ar_invoices (inv_no,customer_id,date,due_date,status,currency,total,paid,balance,notes,created_by,synced)
      VALUES($1,$2,$3,$4,'Unpaid',$5,$6,0,$6,$7,$8,false) RETURNING *`,
      [b.inv_no, b.customer_id, b.date, b.due_date, b.currency, b.total, b.notes||null, req.user?.id]);
    res.status(201).json({ data: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Record a payment against an invoice
router.post("/:id/payment", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { amount } = req.body;
    const { rows: [inv] } = await client.query("SELECT * FROM ar_invoices WHERE id=$1 FOR UPDATE", [req.params.id]);
    if (!inv) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Not found" }); }
    const newPaid   = Number(inv.paid) + Number(amount);
    const newBalance= Number(inv.total) - newPaid;
    const newStatus = newBalance <= 0 ? "Paid" : newPaid > 0 ? "Partial" : inv.status;
    const { rows: [updated] } = await client.query(
      `UPDATE ar_invoices SET paid=$1,balance=$2,status=$3,updated_at=NOW(),synced=false WHERE id=$4 RETURNING *`,
      [newPaid, Math.max(0, newBalance), newStatus, req.params.id]);
    await client.query("COMMIT");
    res.json({ data: updated });
  } catch (e) { await client.query("ROLLBACK"); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

module.exports = router;

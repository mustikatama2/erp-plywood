const router = require("express").Router();
const pool   = require("../db/pool");
const { requireAuth } = require("./auth");
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT inv.*, v.name AS vendor_name, v.category AS vendor_category
      FROM ap_invoices inv LEFT JOIN vendors v ON v.id = inv.vendor_id
      WHERE inv.deleted_at IS NULL ORDER BY inv.due_date ASC LIMIT 500`);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await pool.query(`
      INSERT INTO ap_invoices (inv_no,vendor_id,date,due_date,status,description,total,paid,balance,created_by,synced)
      VALUES($1,$2,$3,$4,'Unpaid',$5,$6,0,$6,$7,false) RETURNING *`,
      [b.inv_no, b.vendor_id, b.date, b.due_date, b.description, b.total, req.user?.id]);
    res.status(201).json({ data: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/:id/payment", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { amount } = req.body;
    const { rows: [inv] } = await client.query("SELECT * FROM ap_invoices WHERE id=$1 FOR UPDATE", [req.params.id]);
    const newPaid   = Number(inv.paid) + Number(amount);
    const newBalance= Math.max(0, Number(inv.total) - newPaid);
    const newStatus = newBalance <= 0 ? "Paid" : "Partial";
    const { rows: [updated] } = await client.query(
      `UPDATE ap_invoices SET paid=$1,balance=$2,status=$3,updated_at=NOW(),synced=false WHERE id=$4 RETURNING *`,
      [newPaid, newBalance, newStatus, req.params.id]);
    await client.query("COMMIT");
    res.json({ data: updated });
  } catch (e) { await client.query("ROLLBACK"); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

module.exports = router;

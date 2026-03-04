const router = require("express").Router();
const pool   = require("../db/pool");
const { requireAuth } = require("./auth");
router.use(requireAuth);

// GET /api/dashboard — aggregated KPIs in one query
router.get("/", async (req, res) => {
  try {
    const [ar, ap, cash, so, lowStock, pnl] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(balance),0) AS total, COUNT(*) FILTER(WHERE status='Overdue') AS overdue_count, COALESCE(SUM(balance) FILTER(WHERE status='Overdue'),0) AS overdue_amount FROM ar_invoices WHERE deleted_at IS NULL AND status != 'Paid'`),
      pool.query(`SELECT COALESCE(SUM(balance),0) AS total, COUNT(*) FILTER(WHERE status='Overdue') AS overdue_count FROM ap_invoices WHERE deleted_at IS NULL AND status != 'Paid'`),
      pool.query(`SELECT COALESCE(SUM(balance_idr),0) AS total FROM bank_accounts WHERE deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*) AS open FROM sales_orders WHERE deleted_at IS NULL AND status NOT IN ('Shipped','Cancelled')`),
      pool.query(`SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL AND stock_qty < reorder AND reorder > 0`),
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', date),'Mon YYYY') AS month,
          SUM(total) AS revenue
        FROM ar_invoices
        WHERE deleted_at IS NULL AND date >= NOW() - INTERVAL '6 months'
        GROUP BY 1 ORDER BY MIN(date)
      `),
    ]);
    res.json({
      ar:       ar.rows[0],
      ap:       ap.rows[0],
      cash:     cash.rows[0],
      openSO:   so.rows[0].open,
      lowStock: lowStock.rows[0].count,
      pnlTrend: pnl.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

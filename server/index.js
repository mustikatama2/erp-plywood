const express = require("express");
const cors    = require("cors");
const app     = express();
const PORT    = process.env.PORT || 3001;

app.use(cors({ origin: "*" })); // LAN-only, no external internet anyway
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/customers",    require("./routes/customers"));
app.use("/api/vendors",      require("./routes/vendors"));
app.use("/api/products",     require("./routes/products"));
app.use("/api/sales-orders", require("./routes/salesOrders"));
app.use("/api/purchase-orders", require("./routes/purchaseOrders"));
app.use("/api/ar-invoices",  require("./routes/arInvoices"));
app.use("/api/ap-invoices",  require("./routes/apInvoices"));
app.use("/api/employees",    require("./routes/employees"));
app.use("/api/assets",       require("./routes/assets"));
app.use("/api/accounts",     require("./routes/accounts"));
app.use("/api/bank-accounts",require("./routes/banks"));
app.use("/api/dashboard",    require("./routes/dashboard"));

// ── 404 / error handlers ─────────────────────────────────────────────────────
app.use("*", (_, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error", detail: err.message });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🪵 ERP API running on port ${PORT}`);
  console.log(`   DB: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
  console.log(`   Sync: ${process.env.SUPABASE_URL ? "✅ enabled" : "⚠️ disabled (no SUPABASE_URL)"}`);
});

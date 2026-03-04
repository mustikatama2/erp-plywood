/**
 * AI Client — unified interface for all 4 AI features
 *
 * On-prem server:  calls /api/ai/* (Express proxies to Claude)
 * Vercel demo:     uses local calculation + simulated narrative
 *
 * The server is always the preferred path. Client falls back to
 * demo mode if the API is unreachable or returns 503 (no API key).
 */

import { AR_INVOICES, AP_INVOICES, BANK_ACCOUNTS, CUSTOMERS, VENDORS, PRODUCTS, SALES_ORDERS } from "../data/seed";
import { IDR, DATE } from "./fmt";

const BASE = import.meta.env.VITE_API_URL || "/api";

const authHeader = () => {
  const token = localStorage.getItem("erp_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Feature 1: Document Parser ────────────────────────────────────────────────

export async function parseDocument(text) {
  try {
    const res = await fetch(`${BASE}/ai/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ text }),
    });
    if (res.status === 503) return simulateDocumentParse(text);
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch {
    return simulateDocumentParse(text);
  }
}

function simulateDocumentParse(text) {
  // Demo: extract patterns from text using regex
  const t = text || "";
  const amountMatch = t.match(/(?:Rp\.?\s*|IDR\s*|Total[:\s]+)([\d.,]+)/i);
  const invMatch    = t.match(/(?:Invoice|Faktur|No\.?)[:\s#]*([A-Z0-9/-]+)/i);
  const dateMatch   = t.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  const vendorMatch = t.match(/(?:From|Dari|Vendor)[:\s]+([^\n]+)/i);

  const total = amountMatch ? Number(amountMatch[1].replace(/[.,]/g, "").slice(0, -3) + "000") || 0 : 0;

  return {
    vendor_name:  vendorMatch?.[1]?.trim() || "Tidak terdeteksi",
    inv_no:       invMatch?.[1]?.trim() || `SINV-${Date.now().toString().slice(-6)}`,
    date:         new Date().toISOString().slice(0, 10),
    due_date:     new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    total:        total || 50000000,
    currency:     t.includes("USD") ? "USD" : "IDR",
    description:  "Diekstrak dari dokumen (mode demo)",
    confidence:   0.6,
    items:        [],
    notes:        "Mode demo — koneksikan ke server untuk ekstraksi AI penuh",
    _demo:        true,
  };
}


// ── Feature 2: Cash Flow Forecast ─────────────────────────────────────────────

export async function getCashFlowForecast() {
  try {
    const res = await fetch(`${BASE}/ai/forecast`, {
      headers: authHeader(),
    });
    if (res.status === 503 || !res.ok) return buildForecastLocally();
    return res.json();
  } catch {
    return buildForecastLocally();
  }
}

export function buildForecastLocally(arInvoices, apInvoices, bankAccounts) {
  const ar   = arInvoices   || AR_INVOICES;
  const ap   = apInvoices   || AP_INVOICES;
  const banks= bankAccounts || BANK_ACCOUNTS;

  const FX = 15560;
  const initialCash = banks.reduce((s, b) =>
    s + (b.currency === "USD" ? b.balance * FX : b.balance), 0);

  // Build daily flow map for 90 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const flows = {};

  ar.filter(i => i.status !== "Paid" && i.balance > 0).forEach(inv => {
    if (!inv.due_date) return;
    const d = inv.due_date.slice(0, 10);
    if (!flows[d]) flows[d] = { inflow: 0, outflow: 0, inflowItems: [], outflowItems: [] };
    const amt = inv.balance * (inv.currency === "USD" ? FX : 1);
    flows[d].inflow += amt;
    flows[d].inflowItems.push({ label: CUSTOMERS.find(c => c.id === inv.customer_id)?.name?.split(" ").slice(0, 2).join(" ") || "Customer", amount: amt });
  });

  ap.filter(i => i.status !== "Paid" && i.balance > 0).forEach(inv => {
    if (!inv.due_date) return;
    const d = inv.due_date.slice(0, 10);
    if (!flows[d]) flows[d] = { inflow: 0, outflow: 0, inflowItems: [], outflowItems: [] };
    flows[d].outflow += inv.balance;
    flows[d].outflowItems.push({ label: VENDORS.find(v => v.id === inv.vendor_id)?.name?.split(" ").slice(0, 2).join(" ") || "Vendor", amount: inv.balance });
  });

  // Build chart data
  const chartData = [];
  let balance = initialCash;
  let cumInflow = 0, cumOutflow = 0;
  let minBalance = initialCash, minDate = today.toISOString().slice(0, 10);
  const risks = [];

  for (let d = 0; d < 90; d++) {
    const date = new Date(today.getTime() + d * 86400000);
    const dateStr = date.toISOString().slice(0, 10);
    const flow = flows[dateStr] || { inflow: 0, outflow: 0 };

    balance    += flow.inflow - flow.outflow;
    cumInflow  += flow.inflow;
    cumOutflow += flow.outflow;

    if (balance < minBalance) { minBalance = balance; minDate = dateStr; }
    if (balance < 500_000_000 && flow.outflow > 0) {
      risks.push({ date: dateStr, balance, description: `Proyeksi kas Rp ${Math.round(balance/1e6)}jt — di bawah batas aman` });
    }

    chartData.push({
      date: dateStr,
      label: date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      balance:    Math.round(balance    / 1e6),
      inflow:     Math.round(flow.inflow  / 1e6),
      outflow:    Math.round(flow.outflow / 1e6),
      cumInflow:  Math.round(cumInflow  / 1e6),
      cumOutflow: Math.round(cumOutflow / 1e6),
    });
  }

  // Simulated narrative
  const finalBalance = balance;
  const trend = finalBalance > initialCash ? "membaik" : "menurun";
  const riskText = risks.length > 0
    ? `Terdapat ${risks.length} periode di mana proyeksi kas jatuh di bawah Rp 500jt — perlu perhatian.`
    : "Tidak ada periode kritis dalam 90 hari ke depan.";

  const narrative = `Posisi kas saat ini Rp ${Math.round(initialCash/1e6)}jt. `
    + `Dalam 90 hari ke depan, kas diproyeksikan ${trend} menjadi Rp ${Math.round(finalBalance/1e6)}jt `
    + `dengan titik terendah Rp ${Math.round(minBalance/1e6)}jt pada ${DATE(minDate)}. `
    + riskText
    + (ar.filter(i => i.status === "Overdue").length > 0
      ? ` Percepatan penagihan piutang yang jatuh tempo dapat memperbaiki proyeksi secara signifikan.`
      : "");

  return { chartData, initialCash, minBalance, minDate, finalBalance, cumInflow, cumOutflow, narrative, risks, _demo: true };
}


// ── Feature 3: Natural Language Query ────────────────────────────────────────

export async function* queryStream(question, onComplete) {
  // Try real API with SSE streaming
  try {
    const controller = new AbortController();
    const res = await fetch(`${BASE}/ai/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        question,
        context: buildQueryContext(),
      }),
      signal: controller.signal,
    });

    if (res.status === 503 || !res.ok) {
      yield* simulateQuery(question);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) {
        const raw = line.slice(6);
        if (raw === "[DONE]") { onComplete?.(full); return; }
        try {
          const { delta } = JSON.parse(raw);
          if (delta) { full += delta; yield delta; }
        } catch {}
      }
    }
    onComplete?.(full);
  } catch {
    yield* simulateQuery(question);
  }
}

function buildQueryContext() {
  return {
    customers:   CUSTOMERS.map(c => ({ id: c.id, name: c.name, country: c.country, ar_balance: c.ar_balance, currency: c.currency })),
    vendors:     VENDORS.map(v => ({ id: v.id, name: v.name, category: v.category, ap_balance: v.ap_balance })),
    products:    PRODUCTS.map(p => ({ id: p.id, name: p.name, category: p.category, stock_qty: p.stock_qty, unit: p.unit, price_usd: p.price_usd, price_idr: p.price_idr })),
    salesOrders: SALES_ORDERS.map(s => ({ so_no: s.so_no, customer_id: s.customer_id, status: s.status, total: s.total, currency: s.currency, date: s.date, delivery_date: s.delivery_date })),
    arInvoices:  AR_INVOICES.map(i => ({ inv_no: i.inv_no, customer_id: i.customer_id, status: i.status, balance: i.balance, currency: i.currency, due_date: i.due_date })),
    apInvoices:  AP_INVOICES.map(i => ({ inv_no: i.inv_no, vendor_id: i.vendor_id, status: i.status, balance: i.balance, due_date: i.due_date, description: i.description })),
    bankAccounts:BANK_ACCOUNTS.map(b => ({ name: b.name, currency: b.currency, balance: b.balance })),
  };
}

async function* simulateQuery(question) {
  const q = question.toLowerCase();
  let answer = "";

  if (q.includes("stok") || q.includes("stock") || q.includes("inventory")) {
    const low = PRODUCTS.filter(p => p.stock_qty < p.reorder);
    answer = `**Ringkasan Stok:**\n\n`
      + PRODUCTS.filter(p => p.category === "Plywood").map(p =>
          `• ${p.name}: **${p.stock_qty.toLocaleString()} ${p.unit}** ${p.stock_qty < p.reorder ? "⚠️ Stok rendah" : "✓"}`
        ).join("\n")
      + (low.length ? `\n\n⚠️ ${low.length} produk di bawah reorder point.` : "\n\n✅ Semua stok dalam kondisi aman.");
  } else if (q.includes("piutang") || q.includes("ar") || q.includes("receivable")) {
    const total = AR_INVOICES.reduce((s, i) => s + i.balance * (i.currency === "USD" ? 15560 : 1), 0);
    const overdue = AR_INVOICES.filter(i => i.status === "Overdue");
    answer = `**Piutang Dagang (AR):**\n\n`
      + `• Total outstanding: **${IDR(total)}**\n`
      + `• Invoice jatuh tempo: **${overdue.length} invoice** (${IDR(overdue.reduce((s,i)=>s+i.balance*(i.currency==="USD"?15560:1),0))})\n\n`
      + CUSTOMERS.filter(c => c.ar_balance > 0).map(c =>
          `• ${c.name}: ${c.currency} ${c.ar_balance.toLocaleString()}`
        ).join("\n");
  } else if (q.includes("hutang") || q.includes("ap") || q.includes("payable")) {
    const total = AP_INVOICES.reduce((s, i) => s + i.balance, 0);
    answer = `**Hutang Dagang (AP):**\n\n`
      + `• Total outstanding: **${IDR(total)}**\n\n`
      + AP_INVOICES.filter(i => i.status !== "Paid").map(i => {
          const v = VENDORS.find(x => x.id === i.vendor_id);
          return `• ${v?.name || "Vendor"}: **${IDR(i.balance)}** — ${i.status === "Overdue" ? "⚠️ Jatuh tempo" : `jatuh tempo ${DATE(i.due_date)}`}`;
        }).join("\n");
  } else if (q.includes("kas") || q.includes("cash") || q.includes("bank")) {
    const total = BANK_ACCOUNTS.reduce((s, b) => s + (b.currency === "USD" ? b.balance * 15560 : b.balance), 0);
    answer = `**Posisi Kas & Bank:**\n\n`
      + BANK_ACCOUNTS.map(b =>
          `• ${b.name}: **${b.currency === "USD" ? `$ ${b.balance.toLocaleString()}` : IDR(b.balance)}**`
        ).join("\n")
      + `\n\n💰 **Total setara IDR: ${IDR(total)}**`;
  } else if (q.includes("order") || q.includes("penjualan") || q.includes("sales")) {
    const open = SALES_ORDERS.filter(s => !["Shipped","Cancelled"].includes(s.status));
    answer = `**Sales Orders Aktif (${open.length}):**\n\n`
      + open.map(s => {
          const c = CUSTOMERS.find(x => x.id === s.customer_id);
          return `• **${s.so_no}** — ${c?.name?.split(" ").slice(0,2).join(" ")} | ${s.currency} ${s.total.toLocaleString()} | ${s.status}`;
        }).join("\n");
  } else {
    answer = `Saya memahami pertanyaan Anda tentang "${question}".\n\n`
      + `Berikut ringkasan kondisi bisnis saat ini:\n\n`
      + `• 💰 Kas & Bank: **${IDR(BANK_ACCOUNTS.reduce((s,b)=>s+(b.currency==="USD"?b.balance*15560:b.balance),0))}**\n`
      + `• 📤 Piutang AR: **${IDR(AR_INVOICES.reduce((s,i)=>s+i.balance*(i.currency==="USD"?15560:1),0))}**\n`
      + `• 📥 Hutang AP: **${IDR(AP_INVOICES.reduce((s,i)=>s+i.balance,0))}**\n`
      + `• 📦 Produk stok rendah: **${PRODUCTS.filter(p=>p.stock_qty<p.reorder).length} item**\n\n`
      + `_Mode demo — hubungkan ke server untuk analisis AI penuh._`;
  }

  // Simulate streaming character by character
  for (const char of answer) {
    yield char;
    await new Promise(r => setTimeout(r, 8));
  }
}


// ── Feature 4: Anomaly Detection ──────────────────────────────────────────────

export async function getAnomalies() {
  try {
    const res = await fetch(`${BASE}/ai/anomalies`, { headers: authHeader() });
    if (res.status === 503 || !res.ok) return detectAnomaliesLocally();
    return res.json();
  } catch {
    return detectAnomaliesLocally();
  }
}

export function detectAnomaliesLocally(ar, ap, vendors) {
  const arInv  = ar      || AR_INVOICES;
  const apInv  = ap      || AP_INVOICES;
  const vends  = vendors || VENDORS;
  const anomalies = [];

  // 1. Duplicate AP invoices
  apInv.forEach((inv, i) => {
    apInv.slice(i + 1).forEach(other => {
      if (inv.vendor_id !== other.vendor_id) return;
      const samish = Math.abs(inv.total - other.total) / (inv.total || 1) < 0.05;
      const recent = Math.abs(new Date(inv.date) - new Date(other.date)) < 30 * 86400000;
      if (samish && recent) {
        anomalies.push({
          type: "duplicate", severity: "high",
          title: "Potensi Tagihan Duplikat",
          description: `${inv.inv_no} dan ${other.inv_no} dari ${vends.find(v=>v.id===inv.vendor_id)?.name?.split(" ").slice(0,2).join(" ") || "vendor yang sama"} — jumlah hampir identik (${IDR(inv.total)})`,
          action: "Verifikasi ke vendor sebelum membayar. Salah satu mungkin sudah dibayar.",
          icon: "🔴",
        });
      }
    });
  });

  // 2. Unusual AP amounts (> 2.5× vendor average)
  const vendorHistory = {};
  apInv.forEach(inv => {
    if (!vendorHistory[inv.vendor_id]) vendorHistory[inv.vendor_id] = [];
    vendorHistory[inv.vendor_id].push(inv.total);
  });

  apInv.filter(i => i.status !== "Paid").forEach(inv => {
    const history = vendorHistory[inv.vendor_id] || [];
    if (history.length < 3) return;
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    if (inv.total > avg * 2.5) {
      anomalies.push({
        type: "unusual_amount", severity: "medium",
        title: "Jumlah Tagihan Tidak Biasa",
        description: `${inv.inv_no} dari ${vends.find(v=>v.id===inv.vendor_id)?.name?.split(" ").slice(0,2).join(" ")} sebesar ${IDR(inv.total)} — ${Math.round(inv.total/avg)}× lebih tinggi dari rata-rata historis (${IDR(Math.round(avg))})`,
        action: "Konfirmasi dengan vendor atau tim purchasing sebelum memproses pembayaran.",
        icon: "⚠️",
      });
    }
  });

  // 3. Very overdue AR (> 90 days)
  const now = new Date();
  const veryOverdue = arInv.filter(i => {
    if (i.status === "Paid" || !i.due_date) return false;
    return (now - new Date(i.due_date)) > 90 * 86400000;
  });
  if (veryOverdue.length > 0) {
    const total = veryOverdue.reduce((s, i) => s + i.balance * (i.currency === "USD" ? 15560 : 1), 0);
    anomalies.push({
      type: "overdue_ar", severity: "high",
      title: `${veryOverdue.length} Piutang Lewat 90 Hari`,
      description: `Total ${IDR(total)} belum tertagih lebih dari 3 bulan. Customer: ${[...new Set(veryOverdue.map(i => CUSTOMERS.find(c=>c.id===i.customer_id)?.name?.split(" ").slice(0,2).join(" ")))].join(", ")}`,
      action: "Pertimbangkan eskalasi ke manajemen atau proses collection formal. Evaluasi credit limit customer.",
      icon: "🔴",
    });
  }

  // 4. AP concentration (single vendor > 60% of total AP)
  const totalAP = apInv.filter(i => i.status !== "Paid").reduce((s, i) => s + i.balance, 0);
  if (totalAP > 0) {
    const byVendor = {};
    apInv.filter(i => i.status !== "Paid").forEach(i => {
      byVendor[i.vendor_id] = (byVendor[i.vendor_id] || 0) + i.balance;
    });
    Object.entries(byVendor).forEach(([vid, amount]) => {
      const pct = amount / totalAP;
      if (pct > 0.6) {
        anomalies.push({
          type: "concentration", severity: "low",
          title: "Konsentrasi Hutang Vendor",
          description: `${vends.find(v=>v.id===vid)?.name?.split(" ").slice(0,2).join(" ")} menyumbang ${Math.round(pct*100)}% dari total AP (${IDR(amount)})`,
          action: "Monitor kemampuan pembayaran vendor ini. Pastikan supply tidak terganggu.",
          icon: "🔵",
        });
      }
    });
  }

  // 5. Cash flow squeeze (next 30 days)
  const { risks, minBalance } = buildForecastLocally();
  if (minBalance < 300_000_000) {
    anomalies.push({
      type: "cashflow", severity: "high",
      title: "Proyeksi Kas Kritis dalam 90 Hari",
      description: `Proyeksi minimum kas turun ke ${IDR(minBalance)} — di bawah batas aman operasional Rp 300jt.`,
      action: "Percepat penagihan AR atau koordinasikan jadwal pembayaran AP dengan cash position.",
      icon: "⚠️",
    });
  }

  return { anomalies, _demo: true };
}

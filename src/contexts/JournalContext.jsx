import { createContext, useContext, useState, useCallback } from "react";
import {
  AR_INVOICES, AP_INVOICES, CUSTOMERS, VENDORS, SHIPMENTS, ACCOUNTS,
} from "../data/seed";

/**
 * JournalContext — Double-entry accounting engine
 * localStorage key: "erp_journal_entries"
 */

const JournalContext = createContext(null);
const LS_KEY = "erp_journal_entries";

// ── Account map ───────────────────────────────────────────────────────────────
const ACC = {
  BANK:        { code: "1110", name: "Bank BCA — IDR" },
  AR:          { code: "1200", name: "Accounts Receivable" },
  INV_RAW:     { code: "1300", name: "Inventory — Raw Material" },
  WIP:         { code: "1310", name: "Inventory — WIP" },
  FG:          { code: "1320", name: "Inventory — Finished Goods" },
  AP:          { code: "2100", name: "Accounts Payable" },
  PPH21:       { code: "2200", name: "PPh 21 Payable" },
  BPJS_PAY:    { code: "2210", name: "BPJS Payable" },
  SALES:       { code: "4100", name: "Sales — Plywood Export" },
  COGS_MAT:    { code: "5100", name: "COGS — Materials" },
  COGS_LABOR:  { code: "5200", name: "COGS — Direct Labor" },
  COGS_OH:     { code: "5300", name: "Factory Overhead" },
  SALARY:      { code: "6100", name: "Salaries & Wages" },
  BPJS_EMP:    { code: "6200", name: "BPJS Employer" },
  OPEX:        { code: "6300", name: "Operating Expenses" },
};

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadEntries() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); }
  catch { return null; }
}
function saveEntries(entries) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entries)); } catch {}
}

// ── JE number helpers ─────────────────────────────────────────────────────────
function nextSeq(entries) {
  const year = new Date().getFullYear();
  const maxSeq = entries.reduce((max, e) => {
    const m = (e.id || "").match(/JE-\d+-(\d+)/);
    return m ? Math.max(max, parseInt(m[1])) : max;
  }, 888); // start after demo entries
  return `JE-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
}

// ── Seed data builder ─────────────────────────────────────────────────────────
function buildSeedEntries() {
  const entries = [];
  let seq = 880;
  const year = 2026;
  const makeId = () => `JE-${year}-${String(++seq).padStart(4, "0")}`;
  const now = new Date().toISOString();

  // AR invoices → Dr. AR / Cr. Sales Revenue
  for (const inv of AR_INVOICES) {
    const customer = CUSTOMERS.find(c => c.id === inv.customer_id);
    const shipment = SHIPMENTS.find(s => s.so_id === inv.so_id);
    const bl_no = shipment?.bl_no || null;
    const amount = inv.total_idr;
    entries.push({
      id: makeId(),
      date: inv.date,
      desc: `Sales invoice — ${inv.inv_no} · ${customer?.name || inv.customer_id}`,
      ref_type: "AR",
      ref_id: inv.id,
      bl_no,
      so_id: inv.so_id || null,
      lines: [
        { acc: ACC.AR.code,    name: ACC.AR.name,    debit: amount, credit: 0 },
        { acc: ACC.SALES.code, name: ACC.SALES.name, debit: 0,      credit: amount },
      ],
      posted: true,
      created_at: now,
    });
  }

  // Paid AR invoices → Dr. Bank / Cr. AR
  for (const inv of AR_INVOICES.filter(i => i.status === "Paid" || i.status === "Partial")) {
    const customer = CUSTOMERS.find(c => c.id === inv.customer_id);
    const paidAmt = inv.status === "Paid" ? inv.total_idr : (inv.paid || 0) * (inv.currency === "USD" ? 15560 : 1);
    if (paidAmt <= 0) continue;
    entries.push({
      id: makeId(),
      date: inv.due_date,
      desc: `AR Payment — ${inv.inv_no} · ${customer?.name || inv.customer_id}`,
      ref_type: "PAYMENT_IN",
      ref_id: inv.id,
      bl_no: null,
      so_id: inv.so_id || null,
      lines: [
        { acc: ACC.BANK.code, name: ACC.BANK.name, debit: paidAmt, credit: 0 },
        { acc: ACC.AR.code,   name: ACC.AR.name,   debit: 0,       credit: paidAmt },
      ],
      posted: true,
      created_at: now,
    });
  }

  // AP invoices → Dr. Inventory or Expense / Cr. AP
  for (const bill of AP_INVOICES) {
    const vendor = VENDORS.find(v => v.id === bill.vendor_id);
    const amount = bill.total;
    // Decide debit account based on vendor category
    const cat = vendor?.category || "";
    let drAcc = ACC.COGS_MAT;
    if (cat.includes("Log") || cat.includes("Veneer")) drAcc = ACC.INV_RAW;
    else if (cat.includes("Chemical") || cat.includes("Glue")) drAcc = ACC.INV_RAW;
    else if (cat.includes("Freight") || cat.includes("Shipping")) drAcc = ACC.OPEX;
    else if (cat.includes("Utilities")) drAcc = ACC.OPEX;
    else if (cat.includes("Packaging")) drAcc = ACC.COGS_MAT;
    entries.push({
      id: makeId(),
      date: bill.date,
      desc: `Purchase bill — ${bill.inv_no} · ${vendor?.name || bill.vendor_id}`,
      ref_type: "AP",
      ref_id: bill.id,
      bl_no: null,
      so_id: null,
      lines: [
        { acc: drAcc.code,  name: drAcc.name,  debit: amount, credit: 0 },
        { acc: ACC.AP.code, name: ACC.AP.name, debit: 0,      credit: amount },
      ],
      posted: true,
      created_at: now,
    });
  }

  // Paid AP invoices → Dr. AP / Cr. Bank
  for (const bill of AP_INVOICES.filter(b => b.status === "Paid")) {
    const vendor = VENDORS.find(v => v.id === bill.vendor_id);
    const amount = bill.total;
    entries.push({
      id: makeId(),
      date: bill.due_date,
      desc: `AP Payment — ${bill.inv_no} · ${vendor?.name || bill.vendor_id}`,
      ref_type: "PAYMENT_OUT",
      ref_id: bill.id,
      bl_no: null,
      so_id: null,
      lines: [
        { acc: ACC.AP.code,   name: ACC.AP.name,   debit: amount, credit: 0 },
        { acc: ACC.BANK.code, name: ACC.BANK.name, debit: 0,      credit: amount },
      ],
      posted: true,
      created_at: now,
    });
  }

  // Payroll — February 2026
  const gross   = 285000000;
  const pph21   = 14250000;
  const bpjs    = 8550000;
  const net     = gross - pph21 - bpjs;
  entries.push({
    id: makeId(),
    date: "2026-03-01",
    desc: "Payroll — February 2026",
    ref_type: "PAYROLL",
    ref_id: "payroll-feb-2026",
    bl_no: null,
    so_id: null,
    lines: [
      { acc: ACC.SALARY.code,   name: ACC.SALARY.name,   debit: gross, credit: 0      },
      { acc: ACC.BANK.code,     name: ACC.BANK.name,     debit: 0,     credit: net    },
      { acc: ACC.PPH21.code,    name: ACC.PPH21.name,    debit: 0,     credit: pph21  },
      { acc: ACC.BPJS_PAY.code, name: ACC.BPJS_PAY.name, debit: 0,    credit: bpjs   },
    ],
    posted: true,
    created_at: now,
  });

  return entries;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function JournalProvider({ children }) {
  const [entries, setEntriesState] = useState(() => {
    const stored = loadEntries();
    if (stored && stored.length > 0) return stored;
    const seed = buildSeedEntries();
    saveEntries(seed);
    return seed;
  });

  const setEntries = useCallback((updater) => {
    setEntriesState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveEntries(next);
      return next;
    });
  }, []);

  // ── nextJENumber ────────────────────────────────────────────────────────────
  const nextJENumber = useCallback(() => {
    return nextSeq(entries);
  }, [entries]);

  // ── postEntry (internal) ───────────────────────────────────────────────────
  const postEntry = useCallback((entry) => {
    setEntries(prev => {
      const id = nextSeq(prev);
      const full = { ...entry, id, posted: true, created_at: new Date().toISOString() };
      return [full, ...prev];
    });
  }, [setEntries]);

  // ── postAR ─────────────────────────────────────────────────────────────────
  const postAR = useCallback((invoice, customer, bl_no, so_id) => {
    const amount = invoice.total_idr || invoice.total;
    const custName = typeof customer === "string" ? customer : customer?.name || invoice.customer_id;
    postEntry({
      date: invoice.date,
      desc: `Sales invoice — ${invoice.inv_no} · ${custName}`,
      ref_type: "AR",
      ref_id: invoice.id,
      bl_no: bl_no || null,
      so_id: so_id || null,
      lines: [
        { acc: ACC.AR.code,    name: ACC.AR.name,    debit: amount, credit: 0 },
        { acc: ACC.SALES.code, name: ACC.SALES.name, debit: 0,      credit: amount },
      ],
    });
  }, [postEntry]);

  // ── postARPayment ──────────────────────────────────────────────────────────
  const postARPayment = useCallback((invoice, amount, method) => {
    const amt = amount || invoice.total_idr || invoice.total;
    postEntry({
      date: new Date().toISOString().split("T")[0],
      desc: `AR Payment — ${invoice.inv_no} · ${method || "Bank Transfer"}`,
      ref_type: "PAYMENT_IN",
      ref_id: invoice.id,
      bl_no: null,
      so_id: invoice.so_id || null,
      lines: [
        { acc: ACC.BANK.code, name: ACC.BANK.name, debit: amt, credit: 0 },
        { acc: ACC.AR.code,   name: ACC.AR.name,   debit: 0,   credit: amt },
      ],
    });
  }, [postEntry]);

  // ── postAP ─────────────────────────────────────────────────────────────────
  const postAP = useCallback((bill, vendor) => {
    const amount = bill.total;
    const vendorName = typeof vendor === "string" ? vendor : vendor?.name || bill.vendor_id;
    const cat = typeof vendor === "string" ? "" : (vendor?.category || "");
    let drAcc = ACC.COGS_MAT;
    if (cat.includes("Log") || cat.includes("Veneer") || cat.includes("Chemical")) drAcc = ACC.INV_RAW;
    else if (cat.includes("Freight") || cat.includes("Utilities")) drAcc = ACC.OPEX;
    postEntry({
      date: bill.date,
      desc: `Purchase bill — ${bill.inv_no} · ${vendorName}`,
      ref_type: "AP",
      ref_id: bill.id,
      bl_no: null,
      so_id: null,
      lines: [
        { acc: drAcc.code,  name: drAcc.name,  debit: amount, credit: 0 },
        { acc: ACC.AP.code, name: ACC.AP.name, debit: 0,      credit: amount },
      ],
    });
  }, [postEntry]);

  // ── postAPPayment ──────────────────────────────────────────────────────────
  const postAPPayment = useCallback((bill, amount) => {
    const amt = amount || bill.total;
    const vendor = VENDORS.find(v => v.id === bill.vendor_id);
    postEntry({
      date: new Date().toISOString().split("T")[0],
      desc: `AP Payment — ${bill.inv_no} · ${vendor?.name || bill.vendor_id}`,
      ref_type: "PAYMENT_OUT",
      ref_id: bill.id,
      bl_no: null,
      so_id: null,
      lines: [
        { acc: ACC.AP.code,   name: ACC.AP.name,   debit: amt, credit: 0 },
        { acc: ACC.BANK.code, name: ACC.BANK.name, debit: 0,   credit: amt },
      ],
    });
  }, [postEntry]);

  // ── postPayroll ────────────────────────────────────────────────────────────
  const postPayroll = useCallback((gross, pph21, bpjs, net) => {
    const n = net || (gross - pph21 - bpjs);
    postEntry({
      date: new Date().toISOString().split("T")[0],
      desc: `Payroll — ${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
      ref_type: "PAYROLL",
      ref_id: `payroll-${Date.now()}`,
      bl_no: null,
      so_id: null,
      lines: [
        { acc: ACC.SALARY.code,   name: ACC.SALARY.name,   debit: gross, credit: 0     },
        { acc: ACC.BANK.code,     name: ACC.BANK.name,     debit: 0,     credit: n     },
        { acc: ACC.PPH21.code,    name: ACC.PPH21.name,    debit: 0,     credit: pph21 },
        { acc: ACC.BPJS_PAY.code, name: ACC.BPJS_PAY.name, debit: 0,    credit: bpjs  },
      ],
    });
  }, [postEntry]);

  // ── postInventory ──────────────────────────────────────────────────────────
  const postInventory = useCallback((fromSku, fromQty, fromCost, toSku, toQty, toCost) => {
    const debitAmt = toQty * toCost;
    const creditAmt = fromQty * fromCost;
    const toAcc = toSku?.startsWith("WIP") ? ACC.WIP : ACC.FG;
    postEntry({
      date: new Date().toISOString().split("T")[0],
      desc: `Inventory transfer — ${fromSku} → ${toSku}`,
      ref_type: "INVENTORY",
      ref_id: `inv-transfer-${Date.now()}`,
      bl_no: null,
      so_id: null,
      lines: [
        { acc: toAcc.code,       name: toAcc.name,       debit: debitAmt,  credit: 0           },
        { acc: ACC.INV_RAW.code, name: ACC.INV_RAW.name, debit: 0,         credit: creditAmt   },
      ],
    });
  }, [postEntry]);

  // ── postManual ─────────────────────────────────────────────────────────────
  const postManual = useCallback((entry) => {
    postEntry({ ...entry, ref_type: "MANUAL", ref_id: entry.ref_id || `manual-${Date.now()}` });
  }, [postEntry]);

  // ── getPnL ─────────────────────────────────────────────────────────────────
  const getPnL = useCallback((startDate, endDate) => {
    const inRange = entries.filter(e => {
      if (startDate && e.date < startDate) return false;
      if (endDate   && e.date > endDate)   return false;
      return true;
    });

    let revenue = 0, cogs = 0;
    const expensesMap = {};

    for (const e of inRange) {
      for (const l of e.lines) {
        const code = l.acc;
        if (code.startsWith("4")) revenue    += l.credit;
        if (code.startsWith("5")) cogs       += l.debit;
        if (code.startsWith("6")) {
          const acc = ACCOUNTS.find(a => a.code === code);
          const name = acc?.name || code;
          expensesMap[name] = (expensesMap[name] || 0) + l.debit;
        }
      }
    }

    const totalExpenses = Object.values(expensesMap).reduce((s, v) => s + v, 0);
    const grossProfit = revenue - cogs;
    const netIncome   = grossProfit - totalExpenses;

    return { revenue, cogs, grossProfit, expenses: expensesMap, totalExpenses, netIncome, entryCount: inRange.length };
  }, [entries]);

  // ── getTrialBalance ────────────────────────────────────────────────────────
  const getTrialBalance = useCallback(() => {
    const map = {};
    for (const e of entries) {
      for (const l of e.lines) {
        if (!map[l.acc]) {
          const acc = ACCOUNTS.find(a => a.code === l.acc);
          map[l.acc] = { acc: l.acc, name: l.name, type: acc?.type || "unknown", debit: 0, credit: 0 };
        }
        map[l.acc].debit  += l.debit;
        map[l.acc].credit += l.credit;
      }
    }
    return Object.values(map)
      .map(row => ({
        ...row,
        balance: row.debit - row.credit,
      }))
      .sort((a, b) => a.acc.localeCompare(b.acc));
  }, [entries]);

  // ── getEntriesByRef ────────────────────────────────────────────────────────
  const getEntriesByRef = useCallback((ref_type, ref_id) => {
    return entries.filter(e => e.ref_type === ref_type && e.ref_id === ref_id);
  }, [entries]);

  // ── getEntriesByBL ─────────────────────────────────────────────────────────
  const getEntriesByBL = useCallback((bl_no) => {
    if (!bl_no || bl_no === "—") return [];
    return entries.filter(e => e.bl_no === bl_no);
  }, [entries]);

  // ── getEntriesForDoc ───────────────────────────────────────────────────────
  // Broader search: by ref_id or so_id or bl_no
  const getEntriesForDoc = useCallback(({ refId, blNo, soId }) => {
    return entries.filter(e =>
      (refId && e.ref_id === refId) ||
      (blNo  && blNo !== "—" && e.bl_no === blNo) ||
      (soId  && e.so_id === soId)
    );
  }, [entries]);

  const value = {
    entries,
    postAR,
    postARPayment,
    postAP,
    postAPPayment,
    postPayroll,
    postInventory,
    postManual,
    getPnL,
    getTrialBalance,
    getEntriesByRef,
    getEntriesByBL,
    getEntriesForDoc,
    nextJENumber,
  };

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used within JournalProvider");
  return ctx;
}

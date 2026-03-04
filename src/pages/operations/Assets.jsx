import { useState, useMemo } from "react";
import { PageHeader, Card, Btn, Badge, KPICard, SearchBar, Table, Modal, toast, FormField } from "../../components/ui";
import { IDR, DATE, NUM, PCT } from "../../lib/fmt";
import { ASSETS } from "../../data/seed";
import { useAuth } from "../../contexts/AuthContext";

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Land", "Building", "Machinery", "Vehicle", "Equipment", "Furniture", "IT"];

// ── Straight-line depreciation calc ──────────────────────────────────────────
function calcDepreciation(asset) {
  const salvageVal = asset.salvage || 0;
  const lifeYears  = asset.life_years;
  const monthly    = (asset.cost - salvageVal) / (lifeYears * 12);
  const purchaseDate = new Date(asset.purchase_date);
  const today        = new Date();
  const monthsElapsed = Math.max(0,
    (today.getFullYear() - purchaseDate.getFullYear()) * 12 +
    (today.getMonth()    - purchaseDate.getMonth())
  );
  const totalMonths = lifeYears * 12;
  const depBase     = asset.cost - salvageVal;
  const accum       = Math.min(monthly * monthsElapsed, depBase);
  const bookValue   = asset.cost - accum;
  const pctDepreciated = depBase > 0 ? (accum / depBase) * 100 : 0;
  return {
    monthly, accum, bookValue, pctDepreciated,
    monthsElapsed, remaining: Math.max(0, totalMonths - monthsElapsed),
  };
}

// ── Auto-generate asset code ──────────────────────────────────────────────────
function genAssetCode(existingAssets) {
  const maxNum = existingAssets.reduce((m, a) => {
    const n = parseInt((a.asset_no || "FA-000").replace("FA-", ""), 10);
    return n > m ? n : m;
  }, 0);
  return `FA-${String(maxNum + 1).padStart(3, "0")}`;
}

// ── Depreciation schedule table rows ─────────────────────────────────────────
function buildSchedule(asset) {
  const salvageVal = asset.salvage || 0;
  const annual     = (asset.cost - salvageVal) / asset.life_years;
  const rows = [];
  let accum = 0;
  for (let y = 1; y <= asset.life_years; y++) {
    accum += annual;
    const bv = asset.cost - accum;
    rows.push({
      year: y,
      annual_dep: annual,
      accum_dep:  accum,
      book_value: Math.max(bv, salvageVal),
    });
  }
  return rows;
}

// ── New Asset Modal ───────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "", category: "Machinery", purchase_date: "", cost: "",
  life_years: "10", salvage: "0", location: "", notes: "",
};

function NewAssetModal({ onClose, onSave, existingAssets }) {
  const [form, setSaving_] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (field) => (e) => setSaving_(f => ({ ...f, [field]: e.target.value }));

  const cost       = parseFloat(form.cost)       || 0;
  const salvage    = parseFloat(form.salvage)     || 0;
  const life_years = parseFloat(form.life_years)  || 0;
  const monthly    = life_years > 0 ? (cost - salvage) / (life_years * 12) : 0;

  const handleSave = async () => {
    if (!form.name)          { toast("Nama aset wajib diisi", "error"); return; }
    if (!form.purchase_date) { toast("Tanggal pembelian wajib diisi", "error"); return; }
    if (!form.cost || cost <= 0) { toast("Biaya perolehan wajib diisi", "error"); return; }
    if (!form.life_years || life_years <= 0) { toast("Masa manfaat wajib diisi", "error"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const newCode = genAssetCode(existingAssets);
    toast(`✅ Aset ${newCode} berhasil dicatat`);
    onSave({ ...form, asset_no: newCode, status: "Active", cost, salvage, life_years });
    onClose();
  };

  return (
    <Modal title="+ Tambah Aset Baru" subtitle="Pencatatan aset tetap baru" onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Auto-gen code preview */}
          <div>
            <label className="erp-label">Kode Aset</label>
            <input value={genAssetCode(existingAssets)} readOnly
              className="erp-input bg-gray-100 text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-600 mt-0.5">Dibuat otomatis</p>
          </div>
          <div>
            <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Kategori</label>
            <select value={form.category} onChange={set("category")} className="erp-input">
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Nama Aset</label>
          <input value={form.name} onChange={set("name")} className="erp-input"
            placeholder="Misal: Hot Press Machine 2000T" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Tanggal Perolehan</label>
            <input type="date" value={form.purchase_date} onChange={set("purchase_date")} className="erp-input" />
          </div>
          <div>
            <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Biaya Perolehan (IDR)</label>
            <input type="number" value={form.cost} onChange={set("cost")} className="erp-input" placeholder="1200000000" />
            {cost > 0 && <p className="text-xs text-gray-500 mt-0.5">{IDR(cost)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Masa Manfaat (Tahun)</label>
            <input type="number" min="1" max="40" value={form.life_years} onChange={set("life_years")} className="erp-input" />
          </div>
          <div>
            <label className="erp-label">Nilai Sisa / Residu (IDR)</label>
            <input type="number" value={form.salvage} onChange={set("salvage")} className="erp-input" placeholder="0" />
            {salvage > 0 && <p className="text-xs text-gray-500 mt-0.5">{IDR(salvage)}</p>}
          </div>
        </div>

        <div>
          <label className="erp-label">Lokasi Aset</label>
          <input value={form.location} onChange={set("location")} className="erp-input"
            placeholder="Misal: Lantai Produksi Barat" />
        </div>

        <div>
          <label className="erp-label">Catatan</label>
          <textarea value={form.notes} onChange={set("notes")} className="erp-input min-h-[60px]"
            placeholder="Informasi tambahan…" />
        </div>

        {/* Depreciation preview */}
        {cost > 0 && life_years > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">📊 Estimasi Depresiasi Garis Lurus</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Per Bulan</p>
                <p className="font-bold text-amber-700">{IDR(monthly)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Per Tahun</p>
                <p className="font-bold text-gray-900">{IDR(monthly * 12)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Nilai Akhir</p>
                <p className="font-bold text-gray-400">{IDR(salvage)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Formula: (Biaya − Sisa) ÷ (Masa × 12) = ({IDR(cost)} − {IDR(salvage)}) ÷ {life_years * 12} bln
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan…" : "💾 Simpan Aset"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Asset Detail Modal ────────────────────────────────────────────────────────
function AssetDetailModal({ asset, onClose, onRetire }) {
  const dep      = calcDepreciation(asset);
  const schedule = buildSchedule(asset);
  const [showSched, setShowSched] = useState(false);

  return (
    <Modal title={asset.name} subtitle={`${asset.asset_no} · ${asset.category}`} onClose={onClose} width="max-w-3xl">
      <div className="p-5 space-y-5">
        {/* Fields grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            ["Kode Aset",         asset.asset_no],
            ["Kategori",          asset.category],
            ["Tanggal Perolehan", DATE(asset.purchase_date)],
            ["Biaya Perolehan",   IDR(asset.cost)],
            ["Nilai Sisa",        IDR(asset.salvage || 0)],
            ["Masa Manfaat",      `${asset.life_years} tahun`],
            ["Metode Depresiasi", asset.depreciation_method || "Garis Lurus"],
            ["Status",            asset.status],
            ["Akun",              asset.account || "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-gray-500">{k}</p>
              <p className="font-semibold text-gray-900 mt-0.5">{v}</p>
            </div>
          ))}
        </div>

        {/* Current depreciation summary */}
        <div className="bg-gray-100 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Depresiasi / Bulan</p>
            <p className="font-bold text-amber-700 text-base">{IDR(dep.monthly)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Akumulasi</p>
            <p className="font-bold text-amber-700 text-base">{IDR(dep.accum)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Nilai Buku Saat Ini</p>
            <p className="font-bold text-blue-700 text-base">{IDR(dep.bookValue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Sisa Masa Manfaat</p>
            <p className="font-bold text-teal-400 text-base">{Math.max(0, dep.remaining)} bln</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progres Depresiasi: {PCT(dep.pctDepreciated)}</span>
            <span>{dep.monthsElapsed} bln / {asset.life_years * 12} bln</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
              style={{ width: `${Math.min(dep.pctDepreciated, 100)}%` }}
            />
          </div>
        </div>

        {/* Schedule toggle */}
        <div>
          <button
            onClick={() => setShowSched(s => !s)}
            className="text-sm text-blue-700 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            {showSched ? "▾" : "▸"} Jadwal Depresiasi Tahunan
          </button>

          {showSched && (
            <div className="mt-3 overflow-x-auto">
              <table className="erp-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Tahun</th>
                    <th className="text-right">Depresiasi Tahunan</th>
                    <th className="text-right">Akumulasi</th>
                    <th className="text-right">Nilai Buku</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map(row => {
                    const isCurrentYear = row.year === Math.ceil(dep.monthsElapsed / 12);
                    return (
                      <tr key={row.year} className={isCurrentYear ? "bg-amber-500/10" : ""}>
                        <td>
                          Tahun {row.year}
                          {isCurrentYear && <span className="ml-1 text-xs text-amber-700">← Saat ini</span>}
                        </td>
                        <td className="text-right font-mono text-amber-700">{IDR(row.annual_dep)}</td>
                        <td className="text-right font-mono text-amber-700">{IDR(row.accum_dep)}</td>
                        <td className="text-right font-mono font-bold text-blue-700">{IDR(row.book_value)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <div className="flex gap-2">
            {asset.status !== "Retired" && (
              <Btn variant="danger" onClick={() => {
                onRetire(asset.id);
                toast("🔒 Aset telah dinonaktifkan");
                onClose();
              }}>
                🔒 Pensiunkan Aset
              </Btn>
            )}
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={onClose}>Tutup</Btn>
            {asset.status !== "Retired" && (
              <Btn variant="success" onClick={() => toast("Depresiasi bulan ini sudah dicatat ✅")}>
                ⚙️ Catat Depresiasi Bulan Ini
              </Btn>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Assets() {
  const { user } = useAuth();
  const canAddAsset = user?.role === "admin" || user?.role === "finance";

  const [assets, setAssets]     = useState(() =>
    ASSETS.map(a => ({ ...a, _dep: calcDepreciation(a) }))
  );
  const [search,   setSearch]   = useState("");
  const [catFilter,setCatFilter]= useState("All");
  const [selected, setSelected] = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);

  // Enrich with live-computed depreciation
  const enriched = useMemo(() =>
    assets.map(a => ({ ...a, _dep: calcDepreciation(a) })),
    [assets]
  );

  // KPI totals
  const totalAssets  = enriched.length;
  const totalCost    = enriched.reduce((s, a) => s + a.cost, 0);
  const totalBV      = enriched.reduce((s, a) => s + a._dep.bookValue, 0);
  const monthlyCharge = enriched.filter(a => a.status !== "Retired")
    .reduce((s, a) => s + a._dep.monthly, 0);

  // Filter
  const filtered = enriched
    .filter(a => catFilter === "All" || a.category === catFilter)
    .filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_no.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    );

  const handleRetire = (id) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, status: "Retired" } : a));
  };

  const handleAddSave = (newAsset) => {
    const id = `a${Date.now()}`;
    setAssets(prev => [...prev, { ...newAsset, id }]);
  };

  return (
    <div>
      <PageHeader
        title="Aset Tetap"
        subtitle={`${totalAssets} aset terdaftar · Straight-line depreciation`}
        actions={
          <>
            {canAddAsset && (
              <Btn onClick={() => setShowAdd(true)}>+ Tambah Aset</Btn>
            )}
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard
          label="Total Aset"
          value={totalAssets}
          icon="🏗️"
          sub={`${enriched.filter(a => a.status === "Active").length} aktif`}
        />
        <KPICard
          label="Total Biaya Perolehan"
          value={IDR(totalCost)}
          icon="💰"
          color="text-amber-700"
        />
        <KPICard
          label="Nilai Buku (Net)"
          value={IDR(totalBV)}
          icon="📊"
          color="text-teal-400"
          sub={`Setelah akumulasi depresiasi`}
        />
        <KPICard
          label="Beban Depresiasi / Bulan"
          value={IDR(monthlyCharge)}
          icon="🗓️"
          color="text-blue-700"
          sub="Garis lurus"
        />
      </div>

      {/* Table */}
      <Card>
        <div className="flex gap-3 mb-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Cari nama, kode aset…" />
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  catFilter === c
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}>
                {c === "All" ? "Semua" : c}{" "}
                <span className="ml-1 opacity-70">
                  {c === "All" ? enriched.length : enriched.filter(a => a.category === c).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Table
          onRowClick={setSelected}
          data={filtered}
          columns={[
            {
              key: "asset_no",
              label: "Kode Aset",
              render: v => <span className="font-mono text-xs text-blue-700 font-bold">{v}</span>,
            },
            { key: "name", label: "Nama Aset" },
            {
              key: "category",
              label: "Kategori",
              render: v => (
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{v}</span>
              ),
            },
            {
              key: "purchase_date",
              label: "Tanggal Perolehan",
              render: DATE,
            },
            {
              key: "cost",
              label: "Biaya Perolehan",
              right: true,
              render: v => <span className="font-mono">{IDR(v)}</span>,
            },
            {
              key: "_dep",
              label: "Akum. Depresiasi",
              right: true,
              render: dep => <span className="font-mono text-amber-700">{IDR(dep.accum)}</span>,
            },
            {
              key: "_dep",
              label: "Nilai Buku",
              right: true,
              render: dep => <span className="font-mono font-bold text-teal-400">{IDR(dep.bookValue)}</span>,
            },
            {
              key: "life_years",
              label: "Masa (Thn)",
              right: true,
              render: v => <span className="text-gray-700">{v}</span>,
            },
            {
              key: "status",
              label: "Status",
              render: v => <Badge status={v} />,
            },
          ]}
          empty="Tidak ada aset ditemukan"
        />
      </Card>

      {/* Detail Modal */}
      {selected && (
        <AssetDetailModal
          asset={selected}
          onClose={() => setSelected(null)}
          onRetire={handleRetire}
        />
      )}

      {/* Add Asset Modal */}
      {showAdd && (
        <NewAssetModal
          onClose={() => setShowAdd(false)}
          onSave={handleAddSave}
          existingAssets={assets}
        />
      )}
    </div>
  );
}

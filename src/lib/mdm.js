/**
 * Master Data Management (MDM) — permissions + types
 *
 * Master data = reference entities that don't change often.
 * All create/edit actions on master data go through the MDM workflow:
 *
 *   Non-admin:  Ajukan (submit for approval) → PENDING → ACTIVE (after admin approves)
 *   Admin:      Tambah langsung → ACTIVE immediately
 *               Can also approve / reject any pending submission
 *
 * Soft delete only: records become INACTIVE, never physically deleted.
 */

export const MDM_TYPES = {
  customer: { label: "Pelanggan",      labelEn: "Customer",     icon: "👥", color: "text-blue-400"   },
  vendor:   { label: "Pemasok",        labelEn: "Vendor",       icon: "🏢", color: "text-purple-400" },
  product:  { label: "Produk",         labelEn: "Product",      icon: "🪵", color: "text-teal-400"   },
  employee: { label: "Karyawan",       labelEn: "Employee",     icon: "👤", color: "text-green-400"  },
  bank:     { label: "Rekening Bank",  labelEn: "Bank Account", icon: "🏦", color: "text-amber-400"  },
  coa:      { label: "Akun Keuangan",  labelEn: "Chart of Acct",icon: "📑", color: "text-pink-400"   },
};

export const MDM_STATUS = {
  pending:  { label: "Menunggu Persetujuan", labelEn: "Pending Approval", color: "text-amber-400",  bg: "bg-amber-500/15 border-amber-500/30" },
  active:   { label: "Aktif",               labelEn: "Active",           color: "text-green-400",  bg: "bg-green-500/15 border-green-500/30" },
  rejected: { label: "Ditolak",             labelEn: "Rejected",         color: "text-red-400",    bg: "bg-red-500/15 border-red-500/30"     },
  inactive: { label: "Nonaktif",            labelEn: "Inactive",         color: "text-gray-500",   bg: "bg-gray-500/15 border-gray-500/30"   },
};

// Which roles can SUBMIT new master data of each type
// (admin bypasses submission and creates directly)
export const MDM_SUBMIT_PERMISSIONS = {
  admin:     ["customer", "vendor", "product", "employee", "bank", "coa"],
  finance:   ["bank", "coa"],
  sales:     ["customer"],
  purchasing:["vendor"],
  warehouse: ["product"],
  hr:        ["employee"],
  viewer:    [],
};

// Which roles can APPROVE/REJECT pending submissions (currently: admin only)
export const MDM_APPROVE_ROLES = ["admin"];

// Which roles can DEACTIVATE active records
export const MDM_DEACTIVATE_PERMISSIONS = {
  admin:     ["customer", "vendor", "product", "employee", "bank", "coa"],
  finance:   ["bank", "coa"],
  sales:     ["customer"],
  purchasing:["vendor"],
  warehouse: ["product"],
  hr:        ["employee"],
  viewer:    [],
};

export const canSubmitMDM  = (role, type) => MDM_SUBMIT_PERMISSIONS[role]?.includes(type) ?? false;
export const canApproveMDM = (role) => MDM_APPROVE_ROLES.includes(role);
export const canDeactivate = (role, type) => MDM_DEACTIVATE_PERMISSIONS[role]?.includes(type) ?? false;

// Seed users — in production, replace with Supabase Auth

export const ROLES = {
  admin: {
    label: "Administrator",
    labelBI: "Administrator",
    color: "bg-red-500/20 text-red-300",
    description: "Akses penuh ke semua modul sistem",
    // all paths allowed
    allowedPaths: ["*"],
  },
  finance: {
    label: "Finance",
    labelBI: "Keuangan / Akuntansi",
    color: "bg-green-500/20 text-green-300",
    description: "Laporan keuangan, piutang, hutang, bank, buku besar",
    allowedPaths: ["/", "/finance", "/inventory/products", "/inventory/stock"],
  },
  sales: {
    label: "Sales",
    labelBI: "Penjualan / Ekspor",
    color: "bg-blue-500/20 text-blue-300",
    description: "Customer, order penjualan, proforma invoice, pengiriman",
    allowedPaths: ["/", "/sales", "/inventory/products", "/inventory/stock"],
  },
  purchasing: {
    label: "Purchasing",
    labelBI: "Pembelian / Pengadaan",
    color: "bg-purple-500/20 text-purple-300",
    description: "Vendor, purchase order, penerimaan barang, inventori",
    allowedPaths: ["/", "/purchasing", "/inventory", "/production"],
  },
  warehouse: {
    label: "Warehouse",
    labelBI: "Gudang",
    color: "bg-teal-500/20 text-teal-300",
    description: "Produk, level stok, mutasi barang masuk/keluar",
    allowedPaths: ["/", "/inventory"],
  },
  hr: {
    label: "HR",
    labelBI: "SDM / HR",
    color: "bg-pink-500/20 text-pink-300",
    description: "Data karyawan dan penggajian",
    allowedPaths: ["/", "/hr"],
  },
  viewer: {
    label: "Viewer",
    labelBI: "Viewer (Lihat Saja)",
    color: "bg-gray-500/20 text-gray-300",
    description: "Hanya bisa melihat dashboard dan laporan keuangan",
    allowedPaths: ["/", "/finance/reports"],
  },
};

export const USERS = [
  {
    id: "u1", username: "admin",  password: "admin123",
    name: "Administrator",   role: "admin",     dept: "Management",
    avatar: "A", avatarColor: "bg-red-600",
  },
  {
    id: "u2", username: "sari",   password: "sari123",
    name: "Sari Dewi",       role: "finance",   dept: "Finance",
    avatar: "S", avatarColor: "bg-green-600",
  },
  {
    id: "u3", username: "budi",   password: "budi123",
    name: "Budi Santoso",    role: "sales",     dept: "Sales",
    avatar: "B", avatarColor: "bg-blue-600",
  },
  {
    id: "u4", username: "wahyu",  password: "wahyu123",
    name: "Wahyu Prasetyo",  role: "purchasing",dept: "Purchasing",
    avatar: "W", avatarColor: "bg-purple-600",
  },
  {
    id: "u5", username: "doni",   password: "doni123",
    name: "Doni Kurniawan",  role: "warehouse", dept: "Warehouse",
    avatar: "D", avatarColor: "bg-teal-600",
  },
  {
    id: "u6", username: "rini",   password: "rini123",
    name: "Rini Setiawati",  role: "hr",        dept: "HR",
    avatar: "R", avatarColor: "bg-pink-600",
  },
  {
    id: "u7", username: "viewer", password: "viewer123",
    name: "Read-Only User",  role: "viewer",    dept: "—",
    avatar: "V", avatarColor: "bg-gray-600",
  },
];

export const canAccess = (user, path) => {
  if (!user) return false;
  const role = ROLES[user.role];
  if (!role) return false;
  if (role.allowedPaths.includes("*")) return true;
  // Check if any allowed path is a prefix of the requested path
  return role.allowedPaths.some(allowed =>
    path === allowed || path.startsWith(allowed + "/")
  );
};

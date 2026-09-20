export type Material = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
};

export type Member = {
  id: string;
  name: string;
  baseSalary: number;
  multiplier: number;
  bonus: number;
  /** Ikut dihitung pada payroll pekan ini. */
  active?: boolean;
  /** Nominal gaji yang sudah diambil pada pekan ini. */
  withdrawn?: number;
};

export const isActive = (m: Member) => m.active !== false;

export type PayrollMode = "manual" | "share" | "total";

export type DayData = {
  materials: Material[];
  cups: number;
  pricePerCup: number;
  revenue: number;
  members: Member[];
  payrollMode: PayrollMode;
  salarySharePct: number;
  /** Sumber nilai modal: rincian bahan atau total manual. */
  capitalMode?: "detail" | "manual";
  manualCapital?: number;
  /** Total gaji pekan ini bila diisi manual (mode "total"). */
  manualPayroll?: number;
  /** Tandakan apakah minggu ini libur (tidak operasional). */
  isHoliday?: boolean;
  /** Tanggal operasional (YYYY-MM-DD) */
  date?: string;
};

export const emptyDay = (): DayData => ({
  materials: [],
  cups: 0,
  pricePerCup: 0,
  revenue: 0,
  members: [],
  payrollMode: "share",
  salarySharePct: 50,
  capitalMode: "detail",
  manualCapital: 0,
  isHoliday: false,
});

export const PERFORMANCE_OPTIONS = [
  { value: 0.3, label: "Bantu Minimal (0.3x)" },
  { value: 0.5, label: "Bantu Sebagian (0.5x)" },
  { value: 0.8, label: "Kurang Aktif (0.8x)" },
  { value: 1, label: "Standar (1.0x)" },
  { value: 1.2, label: "Sangat Baik (1.2x)" },
];

export const materialTotal = (m: Material) => m.qty * m.price;

/** Gaji manual: nominal apa adanya + bonus, tanpa dipotong performa. */
export const memberTotal = (m: Member) => m.baseSalary + m.bonus;

/** Total dana gaji: angka manual (mode total) atau persentase dari omzet. */
export const salaryPool = (day: DayData) =>
  day.payrollMode === "total"
    ? Math.max(0, day.manualPayroll || 0)
    : Math.max(0, (day.revenue * (day.salarySharePct || 0)) / 100);

/** Total dana modal pada mode bagi hasil. */
export const capitalPool = (day: DayData) =>
  Math.max(0, day.revenue - salaryPool(day));

/** Gaji per anggota, mengikuti mode yang dipilih. */
export function memberPay(day: DayData, m: Member) {
  if (!isActive(m)) return 0;
  if (day.payrollMode === "manual") return memberTotal(m);
  const weights = (day.members || []).reduce((s, x) => s + (isActive(x) ? x.multiplier || 0 : 0), 0);
  const pool = salaryPool(day);
  const share = weights > 0 ? (pool * (m.multiplier || 0)) / weights : 0;
  return share + m.bonus;
}

export const payrollTotal = (day: DayData) =>
  (day.members || []).reduce((s, m) => s + memberPay(day, m), 0);

/** Total modal pekan ini: rincian bahan atau angka manual. */
export const capitalTotal = (day: DayData) =>
  day.capitalMode === "manual"
    ? Math.max(0, day.manualCapital || 0)
    : (day.materials || []).reduce((s, m) => s + materialTotal(m), 0);

/** Sisa gaji yang belum diambil pada pekan ini. */
export const memberRemaining = (day: DayData, m: Member) =>
  memberPay(day, m) - (m.withdrawn || 0);

export function summarize(day: DayData) {
  if (!day) return { capital: 0, payroll: 0, revenue: 0, profit: 0 };
  const capital = capitalTotal(day);
  const payroll = payrollTotal(day);
  const revenue = day.revenue || 0;
  return { capital, payroll, revenue, profit: revenue - capital - payroll };
}

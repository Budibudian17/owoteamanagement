import { useCallback, useEffect, useState } from "react";
import {
  capitalPool,
  capitalTotal,
  emptyDay,
  memberPay,
  payrollTotal,
  type DayData,
  type Member,
} from "./types";

const PREFIX = "owo-tea:day:";
const ROSTER_KEY = "owo-tea:roster";
const HOLIDAY_KEY = "owo-tea:holidays";

export const dateKey = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const todayKey = () => dateKey(new Date());

/** OWO TEA hanya berjualan hari Minggu (CFD). */
export const isSundayKey = (key: string) => {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
};

/** Minggu operasional: hari ini jika Minggu, jika tidak Minggu terakhir sebelumnya. */
export const operationalSundayKey = () => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - d.getDay());
  return dateKey(d);
};

/** Default cerdas: jika minggu berjalan sudah selesai diinput (ada penjualan) dan hari ini bukan Minggu, langsung buka minggu berikutnya. Skip minggu libur. */
export function smartDefaultSundayKey() {
  const current = operationalSundayKey();
  if (new Date().getDay() === 0) return current; // Hari Minggu: tetap di hari jualan
  const day = readDay(current);
  if (day.cups > 0 || day.revenue > 0) return shiftWeeksForward(current);
  // Skip holiday weeks
  if (readHoliday(current)) return shiftWeeksForward(current);
  return current;
}

const shiftWeeksForward = (key: string) => shiftWeeks(key, 1);

export function shiftWeeks(key: string, weeks: number) {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weeks * 7);
  return dateKey(date);
}

export function readDay(key: string): DayData {
  if (typeof window === "undefined") return emptyDay();
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return emptyDay();
    return { ...emptyDay(), ...(JSON.parse(raw) as Partial<DayData>) };
  } catch {
    return emptyDay();
  }
}

export function writeDay(key: string, data: DayData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + key, JSON.stringify(data));
}

export function removeDay(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PREFIX + key);
}

/** Baca status libur untuk tanggal tertentu. */
export function readHoliday(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(HOLIDAY_KEY);
    if (!raw) return false;
    const holidays = JSON.parse(raw) as Record<string, boolean>;
    return holidays[key] || false;
  } catch {
    return false;
  }
}

/** Tulis status libur untuk tanggal tertentu. */
export function writeHoliday(key: string, isHoliday: boolean) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(HOLIDAY_KEY);
    const holidays = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    if (isHoliday) {
      holidays[key] = true;
    } else {
      delete holidays[key];
    }
    window.localStorage.setItem(HOLIDAY_KEY, JSON.stringify(holidays));
  } catch {
    // Ignore errors
  }
}

/** Daftar semua tanggal yang ditandai sebagai libur. */
export function listHolidays(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HOLIDAY_KEY);
    if (!raw) return [];
    const holidays = JSON.parse(raw) as Record<string, boolean>;
    return Object.keys(holidays).sort().reverse();
  } catch {
    return [];
  }
}

export function listStoredDays(): string[] {
  if (typeof window === "undefined") return [];
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length));
  }
  return keys.sort().reverse();
}

/** Daftar anggota tetap, dipakai ulang tiap pekan. */
export function readRoster(): Member[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ROSTER_KEY);
    return raw ? (JSON.parse(raw) as Member[]) : [];
  } catch {
    return [];
  }
}

export function writeRoster(members: Member[]) {
  if (typeof window === "undefined") return;
  const roster = members
    .filter((m) => m.name.trim())
    .map((m) => ({
      id: m.id,
      name: m.name,
      baseSalary: m.baseSalary,
      multiplier: m.multiplier,
      bonus: 0,
      active: true,
      withdrawn: 0,
    }));
  window.localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

const OPENING_PAYROLL_KEY = "owo-tea:opening-payroll";

/** Saldo gaji awal per anggota (hasil pekan-pekan lama yang belum diinput). */
export function readOpeningPayroll(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OPENING_PAYROLL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function writeOpeningPayroll(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OPENING_PAYROLL_KEY, JSON.stringify(map));
}

/** Total gaji terkumpul dikurangi yang sudah diambil, lintas seluruh pekan. */
export function memberBalances(): Record<string, number> {
  const out: Record<string, number> = { ...readOpeningPayroll() };
  for (const key of listStoredDays()) {
    // Skip holiday weeks
    if (readHoliday(key)) continue;
    const day = readDay(key);
    for (const m of day.members) {
      out[m.id] = (out[m.id] || 0) + memberPay(day, m) - (m.withdrawn || 0);
    }
  }
  return out;
}

/** State scoped by date key, persisted to LocalStorage. */
export function useDayData(key: string) {
  const [data, setData] = useState<DayData>(emptyDay());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const day = readDay(key);
    if (day.members.length === 0) {
      day.members = readRoster().map((m) => ({ ...m, bonus: 0, active: true, withdrawn: 0 }));
    }
    setData(day);
    setHydrated(true);
  }, [key]);

  const update = useCallback(
    (patch: Partial<DayData> | ((prev: DayData) => DayData)) => {
      setData((prev) => {
        const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
        writeDay(key, next);
        writeRoster(next.members);
        return next;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    const next = emptyDay();
    next.members = readRoster().map((m) => ({ ...m, bonus: 0, active: true, withdrawn: 0 }));
    writeDay(key, next);
    setData(next);
  }, [key]);

  return { data, update, reset, hydrated };
}

const OPENING_KEY = "owo-tea:opening-capital";

/** Saldo awal kas modal: hasil kumpulan modal dari pekan-pekan lama. */
export function readOpeningCapital(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(OPENING_KEY);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function writeOpeningCapital(value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OPENING_KEY, String(Math.max(0, value || 0)));
}

/** Kas modal berjalan: saldo awal + bagian modal dari omzet seluruh pekan - belanja bahan. */
export function capitalFund(uptoKey?: string) {
  const opening = readOpeningCapital();
  let inflow = opening;
  let spent = 0;
  for (const key of listStoredDays()) {
    if (uptoKey && key > uptoKey) continue;
    // Skip holiday weeks
    if (readHoliday(key)) continue;
    const day = readDay(key);
    inflow +=
      day.payrollMode === "share"
        ? capitalPool(day)
        : Math.max(0, day.revenue - payrollTotal(day));
    spent += capitalTotal(day);
  }
  return { opening, inflow, spent, balance: inflow - spent };
}


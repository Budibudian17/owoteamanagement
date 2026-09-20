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
import { supabase } from "@/lib/supabase/client";
import {
  getMembers,
  getDayData,
  saveDayData,
  getDayDataRange,
  deleteDayData as deleteDayDataFromDB,
} from "../supabase/db";

const dateKey = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const todayKey = () => dateKey(new Date());

export const isSundayKey = (key: string) => {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
};

export function operationalSundayKey() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - d.getDay());
  return dateKey(d);
}

export function smartDefaultSundayKey() {
  return operationalSundayKey();
}

const shiftWeeksForward = (key: string) => shiftWeeks(key, 1);

export function shiftWeeks(key: string, weeks: number) {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weeks * 7);
  return dateKey(date);
}

export async function readDay(key: string): Promise<DayData> {
  const dayData = await getDayData(new Date(key));
  return dayData || emptyDay();
}

export async function writeDay(key: string, data: DayData) {
  await saveDayData(new Date(key), data);
}

export async function removeDay(key: string) {
  await deleteDayDataFromDB(new Date(key));
}

export async function readRoster(): Promise<Member[]> {
  const members = await getMembers();
  return members.map(m => ({
    ...m,
    bonus: 0,
    active: true,
    withdrawn: 0,
  }));
}

export async function writeRoster(members: Member[]) {
  // Roster is now managed via members table, not stored separately
  // This function is kept for compatibility but doesn't do anything
  console.log('Roster is now managed via Supabase members table');
}

export async function listStoredDays(): Promise<string[]> {
  // Get all days from the last 3 months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  const dayData = await getDayDataRange(startDate, new Date());
  return dayData
    .filter(d => d.date) // Filter out entries without date
    .map(d => {
      const date = new Date(d.date!);
      return dateKey(date);
    })
    .sort()
    .reverse();
}

export async function readHoliday(key: string): Promise<boolean> {
  const dayData = await getDayData(new Date(key));
  return dayData?.isHoliday || false;
}

export async function writeHoliday(key: string, isHoliday: boolean) {
  const dayData = await getDayData(new Date(key));
  if (dayData) {
    await saveDayData(new Date(key), { ...dayData, isHoliday });
  } else {
    // Create new day data if it doesn't exist
    await saveDayData(new Date(key), {
      materials: [],
      cups: 0,
      pricePerCup: 0,
      revenue: 0,
      members: [],
      payrollMode: "share",
      salarySharePct: 50,
      capitalMode: "detail",
      manualCapital: 0,
      manualPayroll: 0,
      isHoliday,
      date: key,
    });
  }
}

export async function listHolidays(): Promise<string[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  const dayData = await getDayDataRange(startDate, new Date());
  return dayData
    .filter(d => d.isHoliday && d.date)
    .map(d => {
      const date = new Date(d.date!);
      return dateKey(date);
    })
    .sort()
    .reverse();
}

export async function readOpeningCapital(): Promise<number> {
  // Sementara pakai localStorage karena Supabase RLS error
  try {
    const raw = localStorage.getItem('owo-tea:opening-capital');
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export async function writeOpeningCapital(value: number) {
  // Sementara pakai localStorage karena Supabase RLS error
  localStorage.setItem('owo-tea:opening-capital', String(value));
}

export async function readOpeningPayroll(): Promise<Record<string, number>> {
  // Sementara pakai localStorage karena Supabase RLS error
  try {
    const raw = localStorage.getItem('owo-tea:opening-payroll');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function writeOpeningPayroll(map: Record<string, number>) {
  // Sementara pakai localStorage karena Supabase RLS error
  localStorage.setItem('owo-tea:opening-payroll', JSON.stringify(map));
}

export async function memberBalances(): Promise<Record<string, number>> {
  const days = await listStoredDays();
  const balances: Record<string, number> = {};
  
  // Include opening payroll
  const openingPayroll = await readOpeningPayroll();
  for (const [memberId, amount] of Object.entries(openingPayroll)) {
    balances[memberId] = (balances[memberId] || 0) + amount;
  }
  
  for (const key of days) {
    const isHoliday = await readHoliday(key);
    if (isHoliday) continue;
    
    const day = await readDay(key);
    for (const m of day.members) {
      if (m.active !== false) {
        balances[m.id] = (balances[m.id] || 0) + memberPay(day, m) - (m.withdrawn || 0);
      }
    }
  }
  
  return balances;
}

export async function capitalFund(uptoKey?: string): Promise<{ opening: number; inflow: number; spent: number; balance: number }> {
  const opening = await readOpeningCapital();
  let inflow = opening;
  let spent = 0;
  
  const days = await listStoredDays();
  for (const key of days) {
    if (uptoKey && key > uptoKey) continue;
    
    const isHoliday = await readHoliday(key);
    if (isHoliday) continue;
    
    const day = await readDay(key);
    inflow +=
      day.payrollMode === "share"
        ? capitalPool(day)
        : Math.max(0, day.revenue - payrollTotal(day));
    spent += capitalTotal(day);
  }
  
  return { opening, inflow, spent, balance: inflow - spent };
}

export function useDayData(key: string) {
  const [data, setData] = useState<DayData>(emptyDay());
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        let day = await readDay(key);
        
        if (mounted) {
          setData(day);
          setHydrated(true);
        }
      } catch (error) {
        console.error('Error loading day data:', error);
        if (mounted) {
          setData(emptyDay());
          setHydrated(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [key]);

  const update = useCallback(
    async (patch: Partial<DayData> | ((prev: DayData) => DayData)) => {
      const next = typeof patch === "function" ? patch(data) : { ...data, ...patch };
      setData(next);
      try {
        await writeDay(key, next);
        console.log('✅ Data saved to Supabase:', key);
      } catch (error) {
        console.error('❌ Error saving to Supabase:', error);
      }
    },
    [key, data],
  );

  const reset = useCallback(async () => {
    const next = emptyDay();
    await writeDay(key, next);
    setData(next);
  }, [key]);

  return { data, update, reset, hydrated, loading };
}

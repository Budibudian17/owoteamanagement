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
  getSetting,
  setSetting,
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
  try {
    const value = await getSetting('opening-capital');
    return value !== null ? Number(value) : 0;
  } catch (error) {
    console.error('Error reading opening capital:', error);
    return 0;
  }
}

export async function writeOpeningCapital(value: number) {
  try {
    await setSetting('opening-capital', value);
  } catch (error) {
    console.error('Error writing opening capital:', error);
    throw error;
  }
}

export async function readOpeningPayroll(): Promise<Record<string, number>> {
  try {
    const value = await getSetting('opening-payroll');
    return value && typeof value === 'object' ? value : {};
  } catch (error) {
    console.error('Error reading opening payroll:', error);
    return {};
  }
}

export async function writeOpeningPayroll(map: Record<string, number>) {
  try {
    await setSetting('opening-payroll', map);
  } catch (error) {
    console.error('Error writing opening payroll:', error);
    throw error;
  }
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

export async function capitalFund(excludeKey?: string): Promise<{ opening: number; inflow: number; spent: number; balance: number }> {
  const opening = await readOpeningCapital();
  let inflow = opening;
  let spent = 0;

  const days = await listStoredDays();
  for (const key of days) {
    // Skip the excluded key (current day)
    if (excludeKey && key === excludeKey) continue;

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

export function capitalFundWithCurrentDay(
  currentDay: DayData,
  currentDayKey: string,
  savedFund: { opening: number; inflow: number; spent: number; balance: number }
): { opening: number; inflow: number; spent: number; balance: number } {
  // Check if current day is a holiday
  const isHoliday = currentDay.isHoliday || false;

  if (isHoliday) {
    // If current day is holiday, return saved fund as is
    return savedFund;
  }

  // Calculate what the current day contributes in real-time
  const currentDayInflow =
    currentDay.payrollMode === "share"
      ? capitalPool(currentDay)
      : Math.max(0, currentDay.revenue - payrollTotal(currentDay));
  const currentDaySpent = capitalTotal(currentDay);

  // Add current day's real-time contribution to the saved fund (which excludes current day)
  return {
    opening: savedFund.opening,
    inflow: savedFund.inflow + currentDayInflow,
    spent: savedFund.spent + currentDaySpent,
    balance: savedFund.inflow + currentDayInflow - (savedFund.spent + currentDaySpent),
  };
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

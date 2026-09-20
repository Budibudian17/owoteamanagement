import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MapPin, Coffee, LogOut } from "lucide-react";
import { DateNav } from "@/components/owo/DateNav";
import { MetricCards } from "@/components/owo/MetricCards";
import { MaterialsPanel } from "@/components/owo/MaterialsPanel";
import { RevenuePanel } from "@/components/owo/RevenuePanel";
import { PayrollPanel } from "@/components/owo/PayrollPanel";
import { UtilityBar } from "@/components/owo/UtilityBar";
import { HistoryPanel } from "@/components/owo/HistoryPanel";
import { BackfillPanel } from "@/components/owo/BackfillPanel";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth.tsx";
import {
  capitalFund,
  listStoredDays,
  memberBalances,
  readOpeningCapital,
  writeOpeningCapital,
  readOpeningPayroll,
  writeOpeningPayroll,
  removeDay,
  operationalSundayKey,
  readDay,
  shiftWeeks,
  useDayData,
  readHoliday,
} from "@/lib/owo/supabase-storage";

import { summarize } from "@/lib/owo/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OWO TEA | Dashboard Admin Keuangan Harian" },
      {
        name: "description",
        content:
          "Dashboard keuangan harian OWO TEA di CFD Margonda Depok: modal bahan baku, omzet cup, payroll tim, dan laba bersih per tanggal.",
      },
      { property: "og:title", content: "OWO TEA | Dashboard Admin Keuangan Harian" },
      {
        property: "og:description",
        content:
          "Kelola modal, omzet, gaji tim, dan keuntungan bersih OWO TEA per tanggal operasional CFD Margonda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { isAuthenticated, isAdmin, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (!isAdmin) {
    return <Navigate to="/user" />;
  }

  return <DashboardContent logout={logout} />;
}

function DashboardContent({ logout }: { logout: () => void }) {
  const [activeDate, setActiveDate] = useState(() => operationalSundayKey());
  const { data, update, reset, hydrated } = useDayData(activeDate);
  const [days, setDays] = useState<string[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [fund, setFund] = useState({ opening: 0, inflow: 0, spent: 0, balance: 0 });
  const [opening, setOpening] = useState(0);
  const [openingPayroll, setOpeningPayroll] = useState<Record<string, number>>({});
  const [isHoliday, setIsHoliday] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    
    const loadAsyncData = async () => {
      try {
        const [daysData, balancesData, fundData, openingData, openingPayrollData, holidayData] = await Promise.all([
          listStoredDays(),
          memberBalances(),
          capitalFund(activeDate),
          readOpeningCapital(),
          readOpeningPayroll(),
          readHoliday(activeDate),
        ]);
        
        setDays(daysData);
        setBalances(balancesData);
        setFund(fundData);
        setOpening(openingData);
        setOpeningPayroll(openingPayrollData);
        setIsHoliday(holidayData);
      } catch (error) {
        console.error('Error loading async data:', error);
      }
    };
    
    loadAsyncData();
  }, [hydrated, data, activeDate]);


  const summary = summarize(data);

  const handleHolidayChange = async () => {
    setIsHoliday(await readHoliday(activeDate));
  };

  const handleLogout = () => {
    logout();
    toast.success("Logout berhasil");
  };

  const copyPrevWeekMaterials = async () => {
    const prevKey = shiftWeeks(activeDate, -1);
    const isHoliday = await readHoliday(prevKey);
    if (isHoliday) {
      toast.error("Pekan lalu adalah hari libur, tidak ada data untuk disalin");
      return;
    }
    const prev = await readDay(prevKey);
    if (prev.materials.length === 0) {
      toast.error("Pekan lalu belum punya data bahan baku");
      return;
    }
    update({
      materials: [
        ...data.materials,
        ...prev.materials.map((m) => ({ ...m, id: crypto.randomUUID() })),
      ],
    });
    toast.success(`${prev.materials.length} bahan disalin dari pekan lalu`);
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/owotealogo.png"
              alt="OWO TEA Logo"
              className="size-8 sm:size-9 shrink-0 rounded-lg object-contain"
            />
            <div className="min-w-0">
              <h1 className="truncate text-sm sm:text-base font-semibold tracking-tight">OWO TEA</h1>
              <p className="truncate text-xs text-muted-foreground">Dashboard Admin Keuangan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-secondary text-secondary-foreground">
              Admin
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <DateNav value={activeDate} onChange={setActiveDate} onHolidayChange={handleHolidayChange} />

        {isHoliday && (
          <Card className="border-warning-soft bg-warning-soft/10">
            <CardContent className="flex items-center gap-3 p-4">
              <Coffee className="size-6 text-warning shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-warning text-sm sm:text-base">Hari Libur</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Minggu ini ditandai sebagai hari libur. Tidak ada operasional CFD.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <MetricCards
          capital={summary.capital}
          revenue={summary.revenue}
          payroll={summary.payroll}
          profit={summary.profit}
          fundBalance={fund.balance}
        />


        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {!isHoliday ? (
            <>
              <div className="space-y-4 xl:col-span-2">
                <MaterialsPanel
                  materials={data.materials}
                  onChange={(materials) => update({ materials })}
                  onCopyPrevWeek={copyPrevWeekMaterials}
                  capitalMode={data.capitalMode}
                  manualCapital={data.manualCapital}
                  onCapitalModeChange={(capitalMode) => update({ capitalMode })}
                  onManualCapitalChange={(manualCapital) => update({ manualCapital })}
                  fund={fund}
                  openingCapital={opening}
                  onOpeningCapitalChange={async (v) => {
                    await writeOpeningCapital(v);
                    setOpening(v);
                    setFund(await capitalFund(activeDate));
                  }}

                />
                <PayrollPanel
                  day={data}
                  onChange={(patch) => update(patch)}
                  balances={balances}
                  openingPayroll={openingPayroll}
                  onOpeningPayrollChange={async (map) => {
                    await writeOpeningPayroll(map);
                    setOpeningPayroll(map);
                    setBalances(await memberBalances());
                  }}
                />
              </div>
              <div className="space-y-4">
                <RevenuePanel
                  cups={data.cups}
                  pricePerCup={data.pricePerCup}
                  revenue={data.revenue}
                  onChange={(patch) => update(patch)}
                />
                <UtilityBar
                  dateKeyValue={activeDate}
                  data={data}
                  summary={summary}
                  onReset={reset}
                  isHoliday={isHoliday}
                />
                <BackfillPanel onSaved={async () => setDays(await listStoredDays())} />
                <HistoryPanel
                  days={days}
                  active={activeDate}
                  onSelect={setActiveDate}
                  onDelete={async (key) => {
                    await removeDay(key);
                    const [newDays, newBalances] = await Promise.all([
                      listStoredDays(),
                      memberBalances(),
                    ]);
                    setDays(newDays);
                    setBalances(newBalances);
                    if (key === activeDate) reset();
                    toast.success(`Riwayat ${key} dihapus`);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                  <Coffee className="size-10 sm:size-12 text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg font-semibold">Input Data Dinonaktifkan</p>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                    Karena minggu ini ditandai sebagai hari libur, semua input data dinonaktifkan.
                    Gunakan navigasi tanggal untuk melihat atau edit minggu operasional lainnya.
                  </p>
                </CardContent>
              </Card>
              <div className="mt-4">
                <HistoryPanel
                  days={days}
                  active={activeDate}
                  onSelect={setActiveDate}
                  onDelete={async (key) => {
                    await removeDay(key);
                    const [newDays, newBalances] = await Promise.all([
                      listStoredDays(),
                      memberBalances(),
                    ]);
                    setDays(newDays);
                    setBalances(newBalances);
                    if (key === activeDate) reset();
                    toast.success(`Riwayat ${key} dihapus`);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

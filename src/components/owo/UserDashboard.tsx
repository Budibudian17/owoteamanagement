import { useState, useEffect } from "react";
import { Navigate } from "@tanstack/react-router";
import { MapPin, Coffee, LogOut, Leaf, Package, CupSoda, Users } from "lucide-react";
import { DateNav } from "@/components/owo/DateNav";
import { MetricCards } from "@/components/owo/MetricCards";
import { HistoryPanel } from "@/components/owo/HistoryPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  operationalSundayKey,
  listStoredDays,
  readHoliday,
  capitalFund,
  memberBalances,
  readOpeningPayroll,
  useDayData,
} from "@/lib/owo/supabase-storage";
import { summarize, materialTotal, memberPay, payrollTotal, memberRemaining, isActive } from "@/lib/owo/types";
import { useAuth } from "@/lib/auth.tsx";
import { toast } from "sonner";
import { longDate, rupiah } from "@/lib/owo/format";

export function UserDashboard() {
  const { isAuthenticated, isAdmin, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  if (isAdmin) {
    return <Navigate to="/" />;
  }

  const [activeDate, setActiveDate] = useState(() => operationalSundayKey());
  const { data, hydrated } = useDayData(activeDate);
  const [days, setDays] = useState<string[]>([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [fund, setFund] = useState({ opening: 0, inflow: 0, spent: 0, balance: 0 });
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [openingPayroll, setOpeningPayroll] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!hydrated) return;
    
    const loadAsyncData = async () => {
      try {
        const [daysData, holidayData, fundData, balancesData, openingPayrollData] = await Promise.all([
          listStoredDays(),
          readHoliday(activeDate),
          capitalFund(activeDate),
          memberBalances(),
          readOpeningPayroll(),
        ]);
        
        setDays(daysData);
        setIsHoliday(holidayData);
        setFund(fundData);
        setBalances(balancesData);
        setOpeningPayroll(openingPayrollData);
      } catch (error) {
        console.error('Error loading async data:', error);
      }
    };
    
    loadAsyncData();
  }, [hydrated, activeDate]);

  const handleDateChange = async (key: string) => {
    setActiveDate(key);
    setIsHoliday(await readHoliday(key));
  };

  const handleHolidayChange = async () => {
    setIsHoliday(await readHoliday(activeDate));
  };

  const handleLogout = () => {
    logout();
    toast.success("Logout berhasil");
  };

  const summary = summarize(data);
  const materialsTotal = data.materials.reduce((sum, m) => sum + materialTotal(m), 0);

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
              <p className="truncate text-xs text-muted-foreground">View Only Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-secondary text-secondary-foreground">
              User View
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
        <DateNav value={activeDate} onChange={handleDateChange} onHolidayChange={handleHolidayChange} showHolidayToggle={false} />

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

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Package className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">Bahan Baku</p>
                  <p className="text-xs text-muted-foreground">Belanja pekan ini</p>
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums">{rupiah(materialsTotal)}</p>
              {data.materials.length > 0 && (
                <div className="mt-3 space-y-2">
                  {data.materials.map((m) => (
                    <div key={m.id} className="flex justify-between text-sm border-b border-border pb-2">
                      <span className="text-muted-foreground">
                        {m.name} ({m.qty} {m.unit})
                      </span>
                      <span className="font-medium tabular-nums">{rupiah(materialTotal(m))}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <CupSoda className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">Penjualan</p>
                  <p className="text-xs text-muted-foreground">Omzet cup terjual</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Jumlah Cup</p>
                  <p className="text-xl font-bold tabular-nums">{data.cups || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Harga/Cup</p>
                  <p className="text-xl font-bold tabular-nums">{rupiah(data.pricePerCup || 0)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Total Pendapatan</p>
                <p className="text-2xl font-bold tabular-nums">{rupiah(data.revenue || 0)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">Payroll Tim</p>
                <p className="text-xs text-muted-foreground">Gaji semua anggota</p>
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums mb-4">{rupiah(payrollTotal(data))}</p>
            {data.members.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="pb-2">Nama</th>
                      <th className="pb-2 text-right">Gaji</th>
                      <th className="pb-2 text-right">Diambil</th>
                      <th className="pb-2 text-right">Sisa</th>
                      <th className="pb-2 text-right">Saldo Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.members.map((m) => (
                      <tr key={m.id} className="border-t border-border">
                        <td className="py-2 font-medium">{m.name || "Tanpa nama"}</td>
                        <td className="py-2 text-right tabular-nums">{rupiah(memberPay(data, m))}</td>
                        <td className="py-2 text-right tabular-nums text-muted-foreground">{rupiah(m.withdrawn || 0)}</td>
                        <td className="py-2 text-right tabular-nums">{rupiah(memberRemaining(data, m))}</td>
                        <td className="py-2 text-right tabular-nums font-semibold">{rupiah(balances[m.id] ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data anggota tim.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
            <div className="size-10 sm:size-12 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
              <Coffee className="size-5 sm:size-6 text-muted-foreground" />
            </div>
            <p className="text-base sm:text-lg font-semibold mb-2">Mode View Only</p>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Anda dalam mode view-only. Untuk mengedit data keuangan, silakan login sebagai Admin.
            </p>
          </CardContent>
        </Card>

        <HistoryPanel
          days={days}
          active={activeDate}
          onSelect={handleDateChange}
          onDelete={() => {}} // No delete access for users
          canDelete={false}
        />
      </main>
    </div>
  );
}

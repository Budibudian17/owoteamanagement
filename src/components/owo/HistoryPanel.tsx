import { History, Trash2, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { rupiah, longDate } from "@/lib/owo/format";
import { readDay, readHoliday } from "@/lib/owo/supabase-storage";
import { summarize } from "@/lib/owo/types";
import { Panel } from "./Panel";
import { useState, useEffect } from "react";

export function HistoryPanel({
  days,
  active,
  onSelect,
  onDelete,
}: {
  days: string[];
  active: string;
  onSelect: (key: string) => void;
  onDelete: (key: string) => void;
}) {
  const [dayDataCache, setDayDataCache] = useState<Record<string, any>>({});
  const [holidayCache, setHolidayCache] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      const dayData: Record<string, any> = {};
      const holidays: Record<string, boolean> = {};
      
      for (const key of days) {
        try {
          dayData[key] = await readDay(key);
          holidays[key] = await readHoliday(key);
        } catch (error) {
          console.error(`Error loading data for ${key}:`, error);
          dayData[key] = null;
          holidays[key] = false;
        }
      }
      
      setDayDataCache(dayData);
      setHolidayCache(holidays);
    };
    
    loadData();
  }, [days]);

  return (
    <Panel icon={History} title="Riwayat Tanggal" description="Arsip hari operasional tersimpan">
      <div className="space-y-2">
        {days.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            Belum ada riwayat tersimpan.
          </p>
        )}
        {days.map((key) => {
          const dayData = dayDataCache[key];
          const { profit } = dayData ? summarize(dayData) : { profit: 0 };
          const isHoliday = holidayCache[key] || false;
          return (
            <div
              key={key}
              className={cn(
                "grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg border px-3 py-2 transition-colors sm:grid-cols-[minmax(0,1fr)_auto_auto]",
                key === active
                  ? "border-foreground/20 bg-accent"
                  : "border-border hover:bg-accent/60",
                isHoliday && "border-warning-soft bg-warning-soft/10",
              )}
            >
              <button onClick={() => onSelect(key)} className="min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="block truncate text-sm font-medium">{longDate(key)}</span>
                  {isHoliday && (
                    <Badge variant="outline" className="gap-1 border-warning-soft bg-warning-soft text-warning text-xs shrink-0">
                      <Coffee className="size-3" />
                      <span className="hidden sm:inline">Libur</span>
                      <span className="sm:hidden">Libur</span>
                    </Badge>
                  )}
                </div>
                <span className="block text-xs text-muted-foreground">{key}</span>
              </button>
              {!isHoliday && (
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums text-xs sm:text-sm",
                    profit >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {rupiah(profit)}
                </span>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    aria-label={`Hapus riwayat ${key}`}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus riwayat {longDate(key)}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Seluruh data modal, penjualan, dan gaji pada tanggal ini akan dihapus
                      permanen dari riwayat.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(key)}>Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

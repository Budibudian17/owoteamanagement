import { useState, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Archive, Radio, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { operationalSundayKey, shiftWeeks, readHoliday, writeHoliday } from "@/lib/owo/storage";
import { longDate } from "@/lib/owo/format";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (key: string) => void;
  onHolidayChange?: () => void;
};

const isSunday = (date: Date) => date.getDay() === 0;

export function DateNav({ value, onChange, onHolidayChange }: Props) {
  const [open, setOpen] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const currentSunday = operationalSundayKey();
  const isCurrentWeek = value === currentSunday;
  const [y = 1970, m = 1, d = 1] = value.split("-").map(Number);
  const selected = new Date(y, m - 1, d);

  // Load holiday status when value changes
  useEffect(() => {
    setIsHoliday(readHoliday(value));
  }, [value]);

  const toggleHoliday = (checked: boolean) => {
    writeHoliday(value, checked);
    setIsHoliday(checked);
    onHolidayChange?.();
    if (checked) {
      toast.success(`${value} ditandai sebagai hari libur`);
    } else {
      toast.success(`${value} tidak lagi ditandai libur`);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-panel">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <CalendarDays className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tanggal Operasional
            </p>
            <p className="truncate text-sm font-semibold sm:text-base">{longDate(value)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 gap-1.5 border-transparent font-medium text-xs",
              isCurrentWeek
                ? "bg-success-soft text-success"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isCurrentWeek ? <Radio className="size-3" /> : <Archive className="size-3" />}
            <span className="hidden sm:inline">{isCurrentWeek ? "Sedang Berjalan" : "Arsip Riwayat"}</span>
            <span className="sm:hidden">{isCurrentWeek ? "Berjalan" : "Arsip"}</span>
          </Badge>
          {isHoliday && (
            <Badge variant="outline" className="shrink-0 gap-1.5 border-warning-soft bg-warning-soft text-warning text-xs">
              <Coffee className="size-3" />
              Libur
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Button
          variant="outline"
          className="justify-center gap-1.5 text-xs sm:text-sm w-full sm:w-auto"
          onClick={() => onChange(shiftWeeks(value, -1))}
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Minggu Sebelumnya</span>
          <span className="sm:hidden">Sebelumnya</span>
        </Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start w-full sm:w-auto text-xs sm:text-sm">
              <CalendarDays className="size-4" />
              <span className="truncate">{value}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => {
                if (date && isSunday(date)) {
                  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                  onChange(key);
                }
                setOpen(false);
              }}
              disabled={(date) => !isSunday(date)}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          className="justify-center gap-1.5 text-xs sm:text-sm w-full sm:w-auto"
          onClick={() => onChange(shiftWeeks(value, 1))}
        >
          <span className="hidden sm:inline">Minggu Berikutnya</span>
          <span className="sm:hidden">Berikutnya</span>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="secondary" onClick={() => onChange(currentSunday)} disabled={isCurrentWeek} className="text-xs sm:text-sm w-full sm:w-auto">
          Minggu Ini
        </Button>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3">
        <div className="flex items-center gap-2 min-w-0">
          <Coffee className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">Tandai sebagai hari libur</span>
        </div>
        <Switch
          checked={isHoliday}
          onCheckedChange={toggleHoliday}
          className="data-[state=checked]:bg-warning shrink-0"
        />
      </div>
    </div>
  );
}
